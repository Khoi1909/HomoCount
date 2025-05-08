'use client';

import React, { useState, useEffect, useRef } from 'react';

interface BackendStatus {
  service_status?: string;
  webcam_status?: 'Webcam Ready' | 'Webcam Not Ready' | 'Model Not Loaded' | 'Unknown';
  model_loaded?: boolean;
}

const VideoStream: React.FC = () => {
  const videoFeedUrl = 'http://localhost:5000/video_feed';
  const statusUrl = 'http://localhost:5000/';
  const [isBackendReady, setIsBackendReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>('Connecting to backend...'); 
  const pollCount = useRef<number>(0);
  const intervalId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkBackendStatus = async () => {
      pollCount.current += 1;
      console.log(`VideoStream: Checking backend status (Attempt ${pollCount.current})...`);
      if (isBackendReady && intervalId.current === null) {
      }
      try {
        const response = await fetch(statusUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: BackendStatus = await response.json();
        if (data.webcam_status === 'Webcam Ready') {
          if (!isBackendReady) {
            console.log("VideoStream: Backend webcam is ready. Displaying stream.");
            setIsBackendReady(true);
            setError(null);
          }
          if (intervalId.current) {
            clearInterval(intervalId.current);
            intervalId.current = null;
            console.log("VideoStream: Status polling stopped.");
          }
        } else {
           const statusMsg = data.webcam_status || 'Unknown state';
          if (isBackendReady || error !== `Waiting for backend webcam... (Status: ${statusMsg})`) {
            console.log(`VideoStream: Backend not ready (Status: ${statusMsg}), will re-check.`);
            setIsBackendReady(false); 
            setError(`Waiting for backend webcam... (Status: ${statusMsg})`);
          }
          if (intervalId.current && pollCount.current > 10) {
            clearInterval(intervalId.current);
            intervalId.current = setInterval(checkBackendStatus, 5000); 
            console.log("VideoStream: Switched to slower polling.");
          }
        }
      } catch (e) {
        console.error("VideoStream: Failed to fetch backend status:", e);
         if (isBackendReady || error !== "Cannot connect to backend status endpoint. Ensure backend is running.") {
            setIsBackendReady(false);
            setError("Cannot connect to backend status endpoint. Ensure backend is running.");
        }
         if (intervalId.current && pollCount.current > 10) { 
            clearInterval(intervalId.current);
            intervalId.current = setInterval(checkBackendStatus, 5000); 
            console.log("VideoStream: Switched to slower polling after error.");
          }
      }
    };

    if (!isBackendReady && intervalId.current === null) {
      console.log("VideoStream: Backend not ready and no polling active, restarting polling.");
      pollCount.current = 0;
      intervalId.current = setInterval(checkBackendStatus, 1000);
    } else if (isBackendReady && intervalId.current !== null) {
       clearInterval(intervalId.current);
       intervalId.current = null;
       console.log("VideoStream: Status polling stopped because isBackendReady became true.");
    }

    if (intervalId.current === null && !isBackendReady) {
        checkBackendStatus();
        intervalId.current = setInterval(checkBackendStatus, 1000); 
        console.log("VideoStream: Status polling started (1s interval).");
    }

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
        console.log("VideoStream: Status polling cleaned up.");
      }
    }; 
  }, [isBackendReady, error]);

  const handleStreamError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
     console.error("VideoStream: Error loading video stream:", e);
     setError("Video stream failed. Check backend connection.");
     setIsBackendReady(false);
  };

  return (
    <div className="border-2 border-gray-700/50 rounded-xl shadow-lg overflow-hidden bg-gray-900/80 flex items-center justify-center min-h-[300px] md:min-h-[480px]"> 
      {isBackendReady ? (
        <img
          src={videoFeedUrl}
          alt="Live CCTV Feed"
          width={640}
          height={480}
          className="mx-auto block max-w-full"
          onError={handleStreamError}
        />
      ) : (
        <div className="text-gray-400 p-4 text-center flex flex-col items-center">
           <svg className="animate-spin h-8 w-8 text-gray-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default VideoStream; 