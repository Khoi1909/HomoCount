import cv2
import time

CAM_INDEX = 1 # Try 0, then 1, then 2, etc.

print(f"Attempting to open webcam at index: {CAM_INDEX}")
# Try adding a backend preference, e.g., cv2.CAP_DSHOW for DirectShow on Windows
cap = cv2.VideoCapture(CAM_INDEX, cv2.CAP_DSHOW) 

if not cap.isOpened():
    print(f"Error: Cannot open webcam at index {CAM_INDEX} with CAP_DSHOW. Trying default...")
    cap = cv2.VideoCapture(CAM_INDEX)
    if not cap.isOpened():
        print(f"Error: Cannot open webcam at index {CAM_INDEX} with default backend either.")
        exit()

print(f"Webcam at index {CAM_INDEX} opened successfully.")

frame_count = 0
max_frames_to_test = 150 # Test for about 5 seconds at 30fps

while frame_count < max_frames_to_test:
    ret, frame = cap.read()
    print(f"Frame {frame_count}: ret = {ret}")
    if not ret:
        print("Error: Can't receive frame (stream end or error). Exiting ...")
        break

    cv2.imshow('Simple Webcam Test', frame)
    
    # Wait for 33ms (approx 30fps). Break if 'q' is pressed.
    if cv2.waitKey(33) & 0xFF == ord('q'): 
        print("'q' pressed, exiting.")
        break
    frame_count += 1
    # time.sleep(0.03) # Alternative to waitKey for delay if window is not primary focus

cap.release()
cv2.destroyAllWindows()
print("Webcam test finished.") 