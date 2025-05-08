'use client'; // Required for Chart.js and hooks

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface HistoryLog {
  timestamp: string;
  detected_heads: number;
}

// Function to format the timestamp for the chart labels
const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (error) {
    console.error("Error formatting timestamp:", timestamp, error);
    return "Invalid Date";
  }
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false, // Allow chart to fill container height
  plugins: {
    legend: {
      position: 'top' as const, // Type assertion for position
       labels: {
            color: '#d1d5db', // gray-300 for legend text
            font: {
                size: 11
            }
       }
    },
    title: {
      display: true,
      text: 'People Count Over Time',
      color: '#e5e7eb', // gray-100
      font: {
        size: 14
      }
    },
    tooltip: {
       backgroundColor: '#1f2937', // gray-800
       titleColor: '#f3f4f6', // gray-100
       bodyColor: '#f3f4f6', // gray-100
    }
  },
  scales: {
    x: {
        ticks: {
            color: '#9ca3af', // gray-400
            maxRotation: 45, // Rotate labels slightly if they overlap
            minRotation: 45,
            font: {
                 size: 10
            }
        },
        grid: {
            color: '#4b5563' // gray-600
        }
    },
    y: {
        beginAtZero: true,
        ticks: {
            color: '#9ca3af', // gray-400
             stepSize: 1, // Ensure integer ticks
             font: {
                 size: 10
            }
        },
        grid: {
            color: '#4b5563' // gray-600
        },
        title: { // Y-axis label
            display: true,
            text: 'People',
            color: '#9ca3af',
            font: {
                size: 10
            }
        },
        max: 5 // Set a fixed maximum for the Y-axis
    }
  }
};

const CountHistoryChart: React.FC = () => {
  const [chartData, setChartData] = useState<{ labels: string[]; datasets: any[] }>({ labels: [], datasets: [] });
  const [error, setError] = useState<string | null>(null);
  const historyUrl = 'http://localhost:5000/history?limit=60';

  useEffect(() => {
    const fetchHistory = async () => {
      console.log("CountHistoryChart: Fetching history...");
      try {
        const response = await fetch(historyUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rawData: HistoryLog[] = await response.json();
        
        // Reverse and format data for Chart.js
        const reversedData = [...rawData].reverse(); // Oldest first
        const labels = reversedData.map(log => formatTimestamp(log.timestamp));
        const dataPoints = reversedData.map(log => log.detected_heads);

        setChartData({
          labels,
          datasets: [
            {
              label: 'People Count',
              data: dataPoints,
              borderColor: '#34d399', // emerald-400
              backgroundColor: 'rgba(52, 211, 153, 0.1)', // Lighter fill
              tension: 0.1, // Slight curve
              pointRadius: 0, // Hide points
              pointHoverRadius: 4
            },
          ],
        });
        setError(null);
      } catch (e) {
        console.error("CountHistoryChart: Failed to fetch history:", e);
        setError("Failed to load history data.");
      }
    };

    fetchHistory();
    const intervalId = setInterval(fetchHistory, 30000);

    return () => clearInterval(intervalId);
  }, []);

  if (error) {
    return <div className="text-red-400 p-4 text-center text-sm">{error}</div>;
  }

  if (chartData.labels.length === 0) {
    return <div className="text-gray-400 p-4 text-center text-sm">Loading history data...</div>;
  }

  return (
    <div style={{ height: '250px' }}> {/* Set explicit height for chart container */} 
        <Line options={chartOptions} data={chartData} />
    </div>
  );
};

export default CountHistoryChart; 