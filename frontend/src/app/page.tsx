import VideoStream from '@/components/VideoStream';
import StatusPanel from '@/components/StatusPanel'; 
import CountHistoryChart from '@/components/CountHistoryChart';

export default function HomePage() {
  return (
    <div className="container mx-auto p-4 flex flex-col space-y-4 w-full max-w-7xl">
      
      {/* Top Section: Video Stream */}
      <div className="w-full">
        <VideoStream />
      </div>

      {/* Bottom Section: Status and Monitor Graph */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Status Panel (Left Column) */}
        <div className="md:col-span-1">
          <StatusPanel /> 
        </div>

        {/* Monitor Graph (Right Column) */}
        <div className="md:col-span-1 bg-gray-800/60 border border-gray-700/50 rounded-lg shadow-md p-4 flex flex-col justify-center">
          <CountHistoryChart /> 
        </div>

      </div>

    </div>
  );
}
