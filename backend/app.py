from flask import Flask, Response, jsonify, render_template_string, request
from flask_cors import CORS # Import CORS
import cv2
import time
import threading
from backend.yolo_utils import load_yolo_model, detect_heads
from backend.database import init_db, log_detection, update_real_time_stats, get_real_time_stats, get_detection_history
import numpy as np

app = Flask(__name__)
CORS(app) # Enable CORS for all origins on the app

# --- Global Variables & Locks ---
yolo_model = None
video_capture = None
output_frame = None # Frame to be served by /video_feed
frame_lock = threading.Lock() # To safely access output_frame
head_count_lock = threading.Lock() # To safely access current_head_count
current_head_count = 0

# --- Configuration ---
WEBCAM_INDEX = 0 # As requested, use webcam index 0
DB_LOG_INTERVAL = 5 # Log to DB every 5 seconds (or N frames)

# --- Video Processing Thread Function ---
def video_processing_thread():
    global video_capture, output_frame, current_head_count, yolo_model

    print(f"Attempting to open webcam exclusively at index: {WEBCAM_INDEX} using CAP_DSHOW backend...")
    video_capture = cv2.VideoCapture(WEBCAM_INDEX, cv2.CAP_DSHOW)
    if not video_capture.isOpened():
        print(f"CRITICAL Error: Could not open webcam at index {WEBCAM_INDEX} with CAP_DSHOW. Video stream will not be available.")
        return # Exit thread if webcam cannot be opened as specified
        
    # Get and print the actual resolution being used by the camera capture
    frame_width = int(video_capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(video_capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"Webcam at index {WEBCAM_INDEX} opened successfully. Capture resolution: {frame_width}x{frame_height}")

    last_log_time = time.time()

    while True:
        ret, frame = video_capture.read()
        
        # More verbose logging for webcam read status
        if frame is not None:
            print(f"Frame read attempt: ret={ret}, frame.shape={frame.shape}")
        else:
            print(f"Frame read attempt: ret={ret}, frame is None")

        if not ret:
            print("ERROR: FAILED TO CAPTURE FRAME FROM WEBCAM. video_capture.read() returned False. Retrying...")
            # Create a black image to signify error if we want to display something
            # error_img = np.zeros((480, 640, 3), dtype=np.uint8)
            # cv2.putText(error_img, "CAM ERROR", (100, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            # with frame_lock:
            #     output_frame = error_img.copy()
            # cv2.imshow('Real-time CCTV Detection', output_frame) # Display error in window
            # key = cv2.waitKey(100) & 0xFF # Wait a bit longer on error
            # if key == ord('q'):
            #     print("'q' pressed during error, shutting down video processing...")
            #     break
            time.sleep(0.1) # Keep this simple sleep for now
            continue

        # Process frame with YOLO
        processed_frame, detected_heads = detect_heads(yolo_model, frame.copy()) # Use a copy for processing

        # Update global head count safely
        with head_count_lock:
            current_head_count = detected_heads
        
        # Update real-time stats in DB (can be throttled if too frequent)
        update_real_time_stats(detected_heads)

        # Log to detection_logs periodically
        if time.time() - last_log_time >= DB_LOG_INTERVAL:
            log_detection(detected_heads)
            last_log_time = time.time()

        # Update the output frame for the MJPEG stream safely
        with frame_lock:
            output_frame = processed_frame.copy()

        # Live display window (OpenCV GUI) - DISABLED
        # cv2.putText(processed_frame, f'Live Heads: {detected_heads}', (10, 30), 
        #             cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2, cv2.LINE_AA)
        # cv2.imshow('Real-time CCTV Detection', processed_frame)

        # Check for 'q' key press - DISABLED (Stop backend with Ctrl+C in terminal)
        # key = cv2.waitKey(1) & 0xFF
        # if key == ord('q'):
        #     print("'q' pressed, shutting down video processing...")
        #     break
        # elif key == ord('s'): # Example: save frame on 's' key
        #     cv2.imwrite(f"capture_{time.time()}.png", output_frame)
        #     print("Frame saved!")

    # Release resources
    if video_capture:
        video_capture.release()
    # cv2.destroyAllWindows() # Disabled as imshow is disabled
    print("Video processing thread finished.")

# --- Flask Routes ---
def generate_frames():
    """Generator function for MJPEG streaming."""
    global output_frame, frame_lock
    while True:
        with frame_lock:
            if output_frame is None:
                # Send a placeholder or wait if no frame is ready
                # For simplicity, we'll just continue and wait for a frame
                # A better approach might be to send a "waiting for stream" image
                time.sleep(0.1) # Wait a bit for the first frame
                continue
            
            (flag, encoded_image) = cv2.imencode(".jpg", output_frame)
            if not flag:
                continue # if encoding failed, skip this frame
        
        # Yield the frame in byte format
        yield(b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + 
              bytearray(encoded_image) + b'\r\n')
        time.sleep(0.03) # Control streaming frame rate (approx 30 FPS)

@app.route('/video_feed')
def video_feed():
    """Video streaming route."""
    if yolo_model is None or video_capture is None or not video_capture.isOpened():
        return "Error: Model or Video Capture not ready.", 503
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/stats')
def stats():
    """Returns real-time stats."""
    with head_count_lock:
        count = current_head_count 
    # Return only the count
    return jsonify({"current_detected_heads": count})
    # db_stats = get_real_time_stats() # This reads from DB, might be slightly delayed from in-memory
    # return jsonify(db_stats) # If you prefer DB as the source of truth

@app.route('/history')
def history():
    """Returns historical detection logs."""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        offset = (page - 1) * per_page
        logs = get_detection_history(limit=per_page, offset=offset)
        # Could also add total count / pagination info here
        return jsonify(logs)
    except ValueError:
        return jsonify({"error": "Invalid page or per_page parameter. Must be integers."}), 400

@app.route('/')
def index():
    # Simple JSON status endpoint
    global video_capture # Need access to the global variable
    status = "Unknown"
    if video_capture is not None and video_capture.isOpened():
        status = "Webcam Ready"
    elif yolo_model is None:
        status = "Model Not Loaded"
    else:
        status = "Webcam Not Ready"
        
    return jsonify({
        "service_status": "Running", 
        "webcam_status": status,
        "model_loaded": yolo_model is not None
    })

# --- Main Application Setup ---
if __name__ == '__main__':
    print("Initializing database...")
    init_db() # Initialize SQLite database and tables
    print("Database initialized.")

    print("Loading YOLOv8 model...")
    yolo_model = load_yolo_model() # Load the YOLO model
    if yolo_model is None:
        print("CRITICAL: YOLO Model could not be loaded. Check model path and dependencies.")
        # Optionally exit or run in a degraded mode
        # exit(1)

    print("Starting video processing thread...")
    # Start the video processing in a separate thread
    # daemon=True means the thread will exit when the main program exits
    video_thread = threading.Thread(target=video_processing_thread, daemon=True)
    video_thread.start()

    print("Starting Flask development server...")
    # For production, use a proper WSGI server like Gunicorn or uWSGI
    # app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False, threaded=True) 