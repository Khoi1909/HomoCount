import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 shadow-lg mb-8 sticky top-0 z-50">
      <nav className="container mx-auto flex items-center justify-center p-4 max-w-5xl">
        <div className="text-4xl font-bold text-white">
          <span className="text-emerald-400">Homo</span>Count
        </div>
      </nav>
    </header>
  );
};

export default Header; 