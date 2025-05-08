'use client';

import React, { useState, useEffect, useRef } from 'react';

// Define types for the state and API responses
interface BackendStatus {
  service_status?: string;
  webcam_status?: 'Webcam Ready' | 'Webcam Not Ready' | 'Model Not Loaded' | 'Unknown';
  model_loaded?: boolean;
}

interface StatsResponse {
  current_detected_heads: number;
}

const StatusPanel: React.FC = () => { 
  const [error, setError] = useState<string | null>('Connecting to backend...');
  const [isBackendReady, setIsBackendReady] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({}); 
  const [peopleCount, setPeopleCount] = useState<number | string>('--'); 

  const statusUrl = 'http://localhost:5000/'; 
  const statsUrl = 'http://localhost:5000/stats'; 

  const statusIntervalId = useRef<NodeJS.Timeout | null>(null);
  const statsIntervalId = useRef<NodeJS.Timeout | null>(null); 
  const statusPollCount = useRef<number>(0);
  const WEBCAM_DISPLAY_INDEX: number = 0; 

  // Effect to check backend status
  useEffect(() => {
    const checkBackendStatus = async () => {
      statusPollCount.current += 1;
      console.log(`StatusPanel: Checking backend status (Attempt ${statusPollCount.current})...`);
      try {
        const response = await fetch(statusUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: BackendStatus = await response.json();
        setBackendStatus(data); 

        if (data.webcam_status === 'Webcam Ready') {
          console.log("StatusPanel: Backend webcam is ready.");
          setIsBackendReady(true);
          setError(null); 
          if (statusIntervalId.current) {
            clearInterval(statusIntervalId.current);
            statusIntervalId.current = null;
            console.log("StatusPanel: Status polling stopped.");
          }
        } else {
          const statusMsg = data.webcam_status || 'Unknown state';
          console.log(`StatusPanel: Backend not ready (Status: ${statusMsg}), will re-check.`);
          setIsBackendReady(false);
          setError(`Backend not ready: ${statusMsg}`);
          setPeopleCount('--'); 
          if (statusIntervalId.current && statusPollCount.current > 10) {
            clearInterval(statusIntervalId.current);
            statusIntervalId.current = setInterval(checkBackendStatus, 5000);
            console.log("StatusPanel: Switched to slower status polling.");
          }
        }
      } catch (e) {
        console.error("StatusPanel: Failed to fetch backend status:", e);
        setIsBackendReady(false);
        setBackendStatus({}); 
        setError("Camera Down"); 
        setPeopleCount('--'); 
         if (statusIntervalId.current && statusPollCount.current > 10) {
            clearInterval(statusIntervalId.current);
            statusIntervalId.current = setInterval(checkBackendStatus, 5000);
            console.log("StatusPanel: Switched to slower status polling after error.");
          }
      }
    };

    checkBackendStatus(); 
    statusIntervalId.current = setInterval(checkBackendStatus, 1000); 
    console.log("StatusPanel: Status polling started (1s interval).");

    return () => {
      if (statusIntervalId.current) {
        clearInterval(statusIntervalId.current);
        console.log("StatusPanel: Status polling cleaned up.");
      }
    };
  }, []);

  // Effect to fetch PEOPLE COUNT once backend is ready
  useEffect(() => {
    const fetchCount = async () => {
      if (!isBackendReady) return; 
      console.log("StatusPanel: Fetching people count...");
      try {
        const response = await fetch(statsUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: StatsResponse = await response.json();
        setPeopleCount(data.current_detected_heads); 
      } catch (e) {
        console.error("StatusPanel: Failed to fetch people count:", e);
        setError("Count fetch failed");
        setPeopleCount('ERR');
      }
    };

    if (isBackendReady) {
      fetchCount(); 
      statsIntervalId.current = setInterval(fetchCount, 33); 
      console.log("StatusPanel: People count fetching interval started (33ms).");
    } else {
      if (statsIntervalId.current) {
        clearInterval(statsIntervalId.current);
        statsIntervalId.current = null;
        console.log("StatusPanel: People count fetching interval stopped.");
      }
    }

    return () => {
      if (statsIntervalId.current) {
        clearInterval(statsIntervalId.current);
        console.log("StatusPanel: People count fetching interval cleaned up.");
      }
    };
  }, [isBackendReady]);


  // Determine status display text and color
  let statusText: string = error || "Connecting...";
  let statusColorClass: string = "text-yellow-400"; 

  if (isBackendReady) {
      statusText = `Camera ID: CAM_${WEBCAM_DISPLAY_INDEX} Running`;
      statusColorClass = "text-green-400";
      if (error === "Count fetch failed") statusText = "Camera Running / Count Error";
  } else if (error && (error.includes("Camera Down") || error.includes("Failed to fetch backend status"))) {
      statusText = error; 
      statusColorClass = "text-red-500";
  } else if (error) {
      statusText = error;
      statusColorClass = "text-yellow-500";
  }

  return (
    <div className="p-4 bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-md text-sm flex flex-col space-y-3">
      <div className="text-center">
        <h3 className="text-gray-400 text-xs uppercase mb-1 font-semibold">Camera Status</h3>
        <p className={`font-medium ${statusColorClass}`}>{statusText}</p>
      </div>
      <hr className="border-gray-700/50"/>
      <div className="text-center">
        <h3 className="text-gray-400 text-xs uppercase mb-1 font-semibold">Live Count</h3>
        <p className={`text-4xl font-bold ${isBackendReady && error !== 'Count fetch failed' ? 'text-emerald-400' : 'text-gray-500'}`}>
            {isBackendReady ? peopleCount : '--'}
        </p>
      </div>
    </div>
  );
};

export default StatusPanel; 