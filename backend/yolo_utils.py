import cv2
import time
from ultralytics import YOLO
import numpy as np # Added for np.array if image is passed directly
import torch

MODEL_PATH = 'backend/model/final_best.pt'  # Make sure your model is here

def load_image_from_path(path: str):
    """
    Load an image from a file path and convert it to RGB format.
    OpenCV loads images in BGR format by default.
    """
    image = cv2.imread(path)
    if image is None:
        raise FileNotFoundError(f"Image not found at path: {path}")
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

def load_yolo_model():
    """Loads the YOLOv8 model. Attempts to use GPU if available."""
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Loading YOLOv8 model on: {device}")
    try:
        model = YOLO(MODEL_PATH)
        model.to(device) # Move model to the selected device
        print("YOLOv8 model loaded successfully.")
        return model
    except Exception as e:
        print(f"Error loading YOLOv8 model: {e}")
        print(f"Please ensure that '{MODEL_PATH}' exists and is a valid YOLOv8 model file.")
        print("If using GPU, ensure CUDA drivers and PyTorch with CUDA support are correctly installed.")
        return None

def detect_heads(model, frame):
    """Detects human heads in a given frame using the YOLOv8 model.
       Applies a confidence threshold and draws boxes without text labels."""
    if model is None:
        return frame, 0

    # Confidence threshold
    CONFIDENCE_THRESHOLD = 0.7

    results = model(frame, verbose=False) 
    
    detected_heads = 0
    # Process results
    for result in results:
        boxes = result.boxes  # Boxes object for bounding box outputs
        for box in boxes:
            confidence = box.conf[0]
            # Check if the detected class is a head AND confidence meets threshold
            if int(box.cls) == 0 and confidence >= CONFIDENCE_THRESHOLD: 
                detected_heads += 1
                x1, y1, x2, y2 = map(int, box.xyxy[0]) # get coordinates
                
                # Draw bounding box only
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                # Text label drawing is disabled as requested
                # label = f"Head: {confidence:.2f}"
                # cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    return frame, detected_heads

# Example usage (for testing this module directly)
# Note: This test part might still show labels if run directly
if __name__ == '__main__':
    print("Testing yolo_utils.py...")
    model = load_yolo_model()
    if model:
        print("Attempting to capture from webcam (index 1, fallback 0) for test...")
        cap = cv2.VideoCapture(0) 
        if not cap.isOpened():
            print("Error: Could not open webcam at index 1. Trying index 0...")
            cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                print("Error: Could not open any webcam for testing.")
                exit()
        print("Test webcam opened successfully.")

        while True:
            ret, frame = cap.read()
            if not ret:
                print("Error: Failed to capture frame during test.")
                break

            # Use a copy for drawing to avoid modifying original if needed elsewhere (though not here)
            processed_frame_test, head_count_test = detect_heads(model, frame.copy()) 
            
            # Display count on the test window
            cv2.putText(processed_frame_test, f'Heads: {head_count_test}', (10, 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2, cv2.LINE_AA)
            
            cv2.imshow('YOLOv8 Live Detection Test', processed_frame_test)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()
        print("Test video stream ended.")
    else:
        print("Failed to load model for testing.")

# Example usage (optional, can be removed or kept for testing)
if __name__ == '__main__':
    # This example requires an image file named 'test_image.jpg' in the same directory
    # or you can change the path.
    # You also need to have 'yolov8n.pt' model file or specify a different model.
    try:
        img_path = 'path_to_your_test_image.jpg' # Replace with a valid image path
        
        # 1. Load image using the utility function from this file
        # rgb_image = load_image_from_path(img_path)
        
        # Or, if you already have an image loaded as a NumPy array (e.g., from a webcam feed)
        # For this example, let's create a dummy image if no path is provided.
        try:
            rgb_image = load_image_from_path(img_path)
            print(f"Successfully loaded image from {img_path}")
        except FileNotFoundError:
            print(f"Warning: Test image not found at {img_path}. Using a dummy image for demonstration.")
            rgb_image = np.zeros((640, 480, 3), dtype=np.uint8)
            cv2.putText(rgb_image, "Dummy Image", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)


        # 2. Detect heads
        image_with_heads, detected_heads_data, inference_time = detect_heads_yolo(rgb_image)
        
        print(f"Inference time: {inference_time:.2f} ms")
        print(f"Detected {len(detected_heads_data)} heads.")
        for head_data in detected_heads_data:
            print(f"  Box: {head_data['box']}, Confidence: {head_data['confidence']:.2f}")

        # 3. Display the image with detections
        # Convert RGB back to BGR for OpenCV display
        # bgr_display_image = cv2.cvtColor(image_with_heads, cv2.COLOR_RGB2BGR)
        # cv2.imshow('Head Detections', bgr_display_image)
        # cv2.waitKey(0)
        # cv2.destroyAllWindows()
        
        # If you want to use matplotlib for display (handles RGB directly)
        import matplotlib.pyplot as plt
        plt.figure(figsize=(10, 8))
        plt.imshow(image_with_heads)
        plt.title('Head Detections')
        plt.axis('off')
        plt.show()
        print("Displayed image with detections. If the window doesn't appear, ensure matplotlib GUI backend is set up.")

    except ImportError as e:
        print(f"Import error: {e}. Make sure you have all dependencies installed (opencv-python, ultralytics, numpy, matplotlib).")
    except Exception as e:
        print(f"An error occurred: {e}") 