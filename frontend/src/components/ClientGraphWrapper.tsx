'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import the actual graph component with SSR disabled
const CountHistoryGraph = dynamic(
  () => import('@/components/CountHistoryGraph'),
  {
    ssr: false, // Disable server-side rendering for this component
    // Use a div with min-height for loading state to prevent layout shift
    loading: () => (
        <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
             Loading graph...
        </div>
    )
  }
);

const ClientGraphWrapper: React.FC = () => {
  return <CountHistoryGraph />;
};

export default ClientGraphWrapper; 