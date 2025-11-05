import React, { useState } from 'react';
import { DollarSignIcon, UsersIcon, CalendarIcon, DownloadIcon, BriefcaseIcon, ClipboardIcon, TagIcon, ChevronDownIcon, ChevronUpIcon, NoteIcon, DocumentIcon } from './icons';
import { ClientProfile } from '../types';
import { CostBreakdownPieChart, CostByCategoryBarChart } from './charts';

interface DashboardProps {
  data: {
    totalCost: number;
    totalDryCost: number;
    manpower: string[];
    projectDuration: number;
    clients: ClientProfile[];
    activeClientId: number;
    projectName: string;
    clientName: string;
    chartData: {
        costBreakdown: { [key: string]: number };
        costByCategory: { [key: string]: number };
    };
  };
  onDurationChange: (duration: number) => void;
  onExport: () => void;
  onClientChange: (clientId: number) => void;
  onProjectNameChange: (name: string) => void;
  onClientNameChange: (name: string) => void;
  onOpenNotesModal: () => void;
  onOpenSowModal: () => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | React.ReactNode; }> = ({ icon, title, value }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-start">
        <div className="bg-blue-100 text-blue-600 p-3 rounded-full mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <div className="text-2xl font-bold text-slate-800">{value}</div>
        </div>
    </div>
);

const InputCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; }> = ({ icon, title, children }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm">
         <div className="flex items-start">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full mr-4">
                {icon}
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">{title}</p>
                {children}
            </div>
        </div>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ data, onDurationChange, onExport, onClientChange, onProjectNameChange, onClientNameChange, onOpenNotesModal, onOpenSowModal }) => {
  const [isOverviewVisible, setIsOverviewVisible] = useState(true);
  // FIX: Coerce value to number for comparison.
  const hasChartData = Object.values(data.chartData.costBreakdown).some(v => Number(v) > 0);
  
  return (
    <div className="mb-6 space-y-4">
        {/* Row 1: Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
                icon={<TagIcon />} 
                title="Total Dry Cost"
                value={`QAR ${data.totalDryCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <StatCard 
                icon={<DollarSignIcon />} 
                title="Total Estimated Cost"
                value={`QAR ${data.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <StatCard 
                icon={<UsersIcon />} 
                title="Manpower Roles"
                value={data.manpower.length > 0 ? `${data.manpower.length} Roles` : 'N/A'}
            />
             <InputCard icon={<CalendarIcon />} title="Project Duration">
                <div className="flex items-center">
                     <input 
                        type="number"
                        value={data.projectDuration}
                        onChange={(e) => onDurationChange(parseInt(e.target.value, 10) || 0)}
                        className="text-2xl font-bold text-slate-800 bg-transparent w-24 border-b-2 border-transparent focus:border-blue-500 outline-none"
                    />
                    <span className="text-lg text-slate-500 ml-2">days</span>
                </div>
            </InputCard>
        </div>
        
        {/* Row 2: Project Info, Context & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputCard icon={<ClipboardIcon/>} title="Project Name">
                 <input 
                    type="text"
                    value={data.projectName}
                    onChange={(e) => onProjectNameChange(e.target.value)}
                    className="text-xl font-bold text-slate-800 bg-transparent w-full border-b-2 border-transparent focus:border-blue-500 outline-none"
                />
            </InputCard>
            <InputCard icon={<UsersIcon />} title="Client Name">
                 <input 
                    type="text"
                    value={data.clientName}
                    onChange={(e) => onClientNameChange(e.target.value)}
                    className="text-xl font-bold text-slate-800 bg-transparent w-full border-b-2 border-transparent focus:border-blue-500 outline-none"
                />
            </InputCard>
            <InputCard icon={<BriefcaseIcon />} title="Active Client Profile">
                <select
                    value={data.activeClientId}
                    onChange={(e) => onClientChange(parseInt(e.target.value, 10))}
                    className="text-xl font-bold text-slate-800 bg-transparent w-full border-b-2 border-transparent focus:border-blue-500 outline-none"
                >
                    {data.clients.map(client => (
                        <option key={client.id} value={client.id}>
                            {client.name}
                        </option>
                    ))}
                </select>
            </InputCard>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
                <p className="text-sm text-slate-500 font-medium mb-3">Project Context for AI</p>
                <div className="flex space-x-2">
                     <button
                        onClick={onOpenSowModal}
                        className="w-full bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center"
                    >
                        <DocumentIcon className="mr-2" />
                        Edit Scope of Work
                    </button>
                    <button
                        onClick={onOpenNotesModal}
                        className="w-full bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center"
                    >
                        <NoteIcon className="mr-2" />
                        Edit General Notes
                    </button>
                </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-center">
                <button
                    onClick={onExport}
                    className="w-full h-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center shadow-md hover:shadow-lg"
                >
                    <DownloadIcon className="mr-2" />
                    Export to Excel
                </button>
            </div>
        </div>

        {/* Row 3: Visualizations */}
        {hasChartData && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <button
              onClick={() => setIsOverviewVisible(!isOverviewVisible)}
              className="w-full flex justify-between items-center text-left mb-4"
            >
              <h3 className="text-lg font-semibold text-slate-800">Project Overview</h3>
              {isOverviewVisible ? <ChevronUpIcon className="w-5 h-5 text-slate-600" /> : <ChevronDownIcon className="w-5 h-5 text-slate-600" />}
            </button>
            {isOverviewVisible && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                      <h4 className="font-semibold text-center text-slate-600 mb-2">Cost Breakdown</h4>
                      <CostBreakdownPieChart data={data.chartData.costBreakdown} />
                  </div>
                  <div>
                      <h4 className="font-semibold text-center text-slate-600 mb-2">Cost by Category</h4>
                      <CostByCategoryBarChart data={data.chartData.costByCategory} />
                  </div>
              </div>
            )}
        </div>
        )}
    </div>
  );
};

export default Dashboard;