# HomoCount - Real-time Human Detection & Counting System

This project provides a backend and frontend for detecting human heads in a live webcam feed using YOLOv8, counting them, and displaying the results in real-time.

## Project Structure

```
HomoCount/
├── backend/         # Flask backend application
│   ├── app.py
│   ├── database.py
│   ├── yolo_utils.py
│   ├── model/         # Contains the YOLOv8 model
│   └── ...
├── frontend/        # Next.js frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── .gitignore       # Git ignore file
├── requirements.txt # Backend Python dependencies
└── README.md 
```

## Prerequisites

*   **Python** (>= 3.8 recommended)
*   **Pip** (Python package installer)
*   **Node.js** (>= 18 recommended)
*   **npm** (Node package manager, usually comes with Node.js)
*   **Git**
*   A **Webcam** accessible by your system (index 0 is currently configured).
*   An **NVIDIA GPU** with **CUDA** drivers installed (for GPU acceleration). The backend will fall back to CPU if CUDA is not available.
*   Your trained YOLOv8 head detection model file (`final_best.pt`).

## Setup Instructions

1.  **Clone the Repository (if applicable)**
    If you haven't already, clone the repository to your local machine:
    ```bash
    git clone https://github.com/Khoi1909/HomoCount.git
    cd HomoCount
    ```

2.  **Place YOLOv8 Model**
    *   Place your trained YOLOv8 model file named `final_best.pt` inside the `backend/model/` directory.

3.  **Backend Setup (Python Virtual Environment)**
    *   Navigate to the project root directory (`HomoCount`).
    *   Create a Python virtual environment:
        ```bash
        python -m venv .venv
        ```
    *   Activate the virtual environment:
        *   Windows (PowerShell): `.\.venv\Scripts\Activate.ps1`
        *   Windows (Command Prompt): `.venv\Scripts\activate.bat`
        *   macOS/Linux: `source .venv/bin/activate`
    *   Install backend dependencies:
        ```bash
        pip install -r requirements.txt
        ```
        *(Note: This includes PyTorch. If GPU acceleration doesn't work, you might need to reinstall PyTorch with a specific CUDA version matching your system. See [PyTorch Get Started](https://pytorch.org/get-started/locally/) for details.)*

    *   **GPU Check (Optional):** To verify if PyTorch detects your CUDA-enabled GPU correctly after installing dependencies, run:
        ```bash
        python check_torch_gpu.py
        ```
        Look for output similar to:
        ```
        PyTorch version: ...
        CUDA available: True
        CUDA version (compiled with): ...
        Device name: NVIDIA GeForce ...
        ```
        If `CUDA available` is `False`, PyTorch cannot detect your GPU, and the backend will fall back to CPU processing.

4.  **Frontend Setup (Node.js Dependencies)**
    *   Navigate to the frontend directory:
        ```bash
        cd frontend
        ```
    *   Install frontend dependencies:
        ```bash
        npm install
        ```
    *   Navigate back to the project root:
        ```bash
        cd ..
        ```

## Running the Application

You need to run both the backend and the frontend simultaneously in separate terminals.

1.  **Run the Backend**
    *   Open a terminal in the project root (`HomoCount`).
    *   Activate the Python virtual environment (if not already active):
        *   Windows (PowerShell): `.\.venv\Scripts\Activate.ps1`
        *   macOS/Linux: `source .venv/bin/activate`
    *   Run the Flask application:
        ```bash
        python -m backend.app
        ```
    *   The backend will start, initialize the database, load the model (attempting GPU), and open the webcam feed. It serves on `http://localhost:5000`.
    *   **To stop the backend**, press `Ctrl+C` in its terminal.

2.  **Run the Frontend**
    *   Open a *separate* terminal.
    *   Navigate to the frontend directory:
        ```bash
        cd frontend
        ```
    *   Start the Next.js development server:
        ```bash
        npm run dev
        ```
    *   The frontend will compile and become available, usually at `http://localhost:3000`.
    *   Open `http://localhost:3000` in your web browser.
    *   The frontend will attempt to connect to the backend. Once the backend is fully ready, the video stream and stats should appear.
    *   **To stop the frontend**, press `Ctrl+C` in its terminal.

## Key Endpoints (Backend)

*   `http://localhost:5000/` : Basic status JSON.
*   `http://localhost:5000/video_feed` : MJPEG video stream with detections.
*   `http://localhost:5000/stats` : Real-time people count.
*   `http://localhost:5000/history` : Historical detection logs (JSON). 
