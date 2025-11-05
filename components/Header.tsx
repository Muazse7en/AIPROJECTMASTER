import React from 'react';
import { BuildingIcon, DatabaseIcon } from './icons';

interface HeaderProps {
    currentView: 'boq' | 'database';
    onToggleView: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onToggleView }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
            <BuildingIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800 ml-3">
              AI Construction BOQ Manager
            </h1>
        </div>
        
        <div className="flex items-center space-x-2">
            <span className={`text-sm font-semibold ${currentView === 'boq' ? 'text-blue-600' : 'text-slate-500'}`}>
                BOQ Project
            </span>
            <button
                onClick={onToggleView}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${currentView === 'database' ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
                <span
                    aria-hidden="true"
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200 ${currentView === 'database' ? 'translate-x-5' : 'translate-x-0'}`}
                />
            </button>
            <span className={`text-sm font-semibold ${currentView === 'database' ? 'text-blue-600' : 'text-slate-500'}`}>
                Settings & Database
            </span>
            <DatabaseIcon className="w-5 h-5 text-slate-400" />
        </div>
      </div>
    </header>
  );
};

export default Header;
