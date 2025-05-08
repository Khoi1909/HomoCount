'use client'; // Essential for hooks and client-side libraries

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Type for the data structure from the /history endpoint
interface HistoryLog {
  timestamp: string; 
  detected_heads: number;
}

// Type for the formatted data used in the chart
interface ChartDataPoint {
    time: string; // Formatted time for display
    people_count: number;
}

// Function to format the timestamp
const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (error) {
    console.error("Error formatting timestamp:", timestamp, error);
    return "Invalid Date";
  }
};

const CountHistoryGraph: React.FC = () => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const historyUrl = 'http://localhost:5000/history?limit=60'; // Fetch recent history (e.g., last 60 logs)

  useEffect(() => {
    const fetchHistory = async () => {
      console.log("CountHistoryGraph: Fetching history...");
      try {
        const response = await fetch(historyUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rawData: HistoryLog[] = await response.json();
        
        // Format data for the chart: format time, rename key, reverse order
        const formattedData: ChartDataPoint[] = rawData
          .map(log => ({
            time: formatTimestamp(log.timestamp),
            people_count: log.detected_heads,
          }))
          .reverse(); // API returns newest first, chart needs oldest first
          
        setChartData(formattedData);
        setError(null);
      } catch (e) {
        console.error("CountHistoryGraph: Failed to fetch history:", e);
        setError("Failed to load history data.");
      }
    };

    fetchHistory();
    const intervalId = setInterval(fetchHistory, 30000); // Refresh history every 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  if (error) {
    return <div className="text-red-400 p-4 text-center text-sm">{error}</div>;
  }

  if (chartData.length === 0) {
    return <div className="text-gray-400 p-4 text-center text-sm">Loading history data...</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={250}> 
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" /> {/* gray-600 */}
        <XAxis 
            dataKey="time" 
            stroke="#9ca3af" /* gray-400 */
            fontSize={10} 
            tick={{ fill: '#9ca3af' }}
        /> 
        <YAxis 
            allowDecimals={false} 
            stroke="#9ca3af" 
            fontSize={10} 
            tick={{ fill: '#9ca3af' }}
            domain={['auto', 'auto']}
            label={{ value: 'People', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 10, dx: -5 }} // Y-axis label
        />
        <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '4px' }} /* gray-800 border-gray-600 */
            labelStyle={{ color: '#f3f4f6' }} /* gray-100 */
            itemStyle={{ color: '#34d399' }} /* emerald-400 */
        />
        {/* <Legend wrapperStyle={{ fontSize: '11px' }} /> */}
        <Line 
            type="monotone" 
            dataKey="people_count" 
            name="People" 
            stroke="#34d399" /* emerald-400 */
            strokeWidth={2}
            activeDot={{ r: 6, fill: '#34d399' }} 
            dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default CountHistoryGraph; 