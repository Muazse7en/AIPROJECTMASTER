import React, { useState, useEffect } from 'react';
import { ManpowerRate } from '../types';
import { PlusIcon, TrashIcon, SparkleIcon } from './icons';

interface ManpowerRatesTableProps {
  rates: ManpowerRate[];
  onUpdate: (newRates: ManpowerRate[]) => void;
  onAiAssist: (role: string) => Promise<Partial<ManpowerRate>>;
}

const TableInput: React.FC<{ value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; className?: string; placeholder?: string }> = 
({ value, onChange, type = 'text', className = '', placeholder = '' }) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-slate-50 p-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${className}`}
    />
);

const calculateEffectiveRate = (rate: Omit<ManpowerRate, 'id' | 'effectiveHourlyRate'>): number => {
    const monthlyDirectCost = rate.monthlySalary + rate.accommodation + rate.transport;
    const annualDirectCost = monthlyDirectCost * 12;

    const gratuityCostPerYear = (rate.monthlySalary / 30) * rate.leaveSettlementDaysPerYear;
    
    const annualIndirectCost = rate.visaCostPerYear + rate.annualFlightTicketCost + gratuityCostPerYear;
    
    const totalAnnualCost = annualDirectCost + annualIndirectCost;
    
    // Assuming 8 hours/day, 26 days/month -> 2496 hours/year
    const totalAnnualHours = 8 * 26 * 12;

    return totalAnnualHours > 0 ? totalAnnualCost / totalAnnualHours : 0;
};

const ManpowerRatesTable: React.FC<ManpowerRatesTableProps> = ({ rates, onUpdate, onAiAssist }) => {
    const [localRates, setLocalRates] = useState(rates);
    const [newRate, setNewRate] = useState<Omit<ManpowerRate, 'id' | 'effectiveHourlyRate'>>({
        role: '', monthlySalary: 0, accommodation: 0, transport: 0, visaCostPerYear: 0, annualFlightTicketCost: 0, leaveSettlementDaysPerYear: 21
    });
    const [isAiLoading, setIsAiLoading] = useState(false);

    useEffect(() => {
        // Recalculate rates when the component loads, in case logic has changed
        const recalculatedRates = rates.map(rate => ({
            ...rate,
            effectiveHourlyRate: calculateEffectiveRate(rate)
        }));
        setLocalRates(recalculatedRates);
    }, [rates]);

    const handleUpdateRate = (index: number, field: keyof Omit<ManpowerRate, 'id' | 'effectiveHourlyRate'>, value: any) => {
        const updatedRates = [...localRates];
        const rateToUpdate = { ...updatedRates[index], [field]: value };
        const updatedRate = { ...rateToUpdate, effectiveHourlyRate: calculateEffectiveRate(rateToUpdate) };
        updatedRates[index] = updatedRate;
        onUpdate(updatedRates);
    };
    
    const handleNewRateChange = (field: keyof typeof newRate, value: any) => {
        setNewRate(prev => ({ ...prev, [field]: value }));
    };

    const handleAddRate = () => {
        if (!newRate.role) {
            alert("Please enter a role.");
            return;
        }
        const calculatedRate = calculateEffectiveRate(newRate);
        const newRateWithId: ManpowerRate = {
            ...newRate,
            id: Date.now(),
            effectiveHourlyRate: calculatedRate,
        };
        onUpdate([...localRates, newRateWithId]);
        setNewRate({ role: '', monthlySalary: 0, accommodation: 0, transport: 0, visaCostPerYear: 0, annualFlightTicketCost: 0, leaveSettlementDaysPerYear: 21 });
    };

    const handleRemoveRate = (id: number) => {
        onUpdate(localRates.filter(rate => rate.id !== id));
    };
    
    const handleAiAssistClick = async () => {
        if (!newRate.role) {
            alert("Please enter a role to get AI assistance.");
            return;
        }
        setIsAiLoading(true);
        try {
            const result = await onAiAssist(newRate.role);
            setNewRate(prev => ({ ...prev, ...result }));
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-slate-800 p-4 border-b">Manpower Rate Database</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-medium">
                        <tr>
                            <th className="p-3 text-left">Role</th>
                            <th className="p-3 text-left">Salary/Month</th>
                            <th className="p-3 text-left">Accommodation</th>
                            <th className="p-3 text-left">Transport</th>
                            <th className="p-3 text-left">Visa Cost/Yr</th>
                            <th className="p-3 text-left">Flight/Yr</th>
                            <th className="p-3 text-left">Gratuity Days/Yr</th>
                            <th className="p-3 text-right font-bold">Effective Hourly Rate (QAR)</th>
                            <th className="p-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {localRates.map((rate, index) => (
                            <tr key={rate.id} className="border-b border-slate-200">
                                <td className="p-2 w-1/4"><TableInput value={rate.role} onChange={(e) => handleUpdateRate(index, 'role', e.target.value)} /></td>
                                <td className="p-2"><TableInput type="number" value={rate.monthlySalary} onChange={(e) => handleUpdateRate(index, 'monthlySalary', parseFloat(e.target.value) || 0)} /></td>
                                <td className="p-2"><TableInput type="number" value={rate.accommodation} onChange={(e) => handleUpdateRate(index, 'accommodation', parseFloat(e.target.value) || 0)} /></td>
                                <td className="p-2"><TableInput type="number" value={rate.transport} onChange={(e) => handleUpdateRate(index, 'transport', parseFloat(e.target.value) || 0)} /></td>
                                <td className="p-2"><TableInput type="number" value={rate.visaCostPerYear} onChange={(e) => handleUpdateRate(index, 'visaCostPerYear', parseFloat(e.target.value) || 0)} /></td>
                                <td className="p-2"><TableInput type="number" value={rate.annualFlightTicketCost} onChange={(e) => handleUpdateRate(index, 'annualFlightTicketCost', parseFloat(e.target.value) || 0)} /></td>
                                <td className="p-2"><TableInput type="number" value={rate.leaveSettlementDaysPerYear} onChange={(e) => handleUpdateRate(index, 'leaveSettlementDaysPerYear', parseInt(e.target.value, 10) || 0)} /></td>
                                <td className="p-2 text-right font-bold text-blue-600 text-base">{rate.effectiveHourlyRate.toFixed(2)}</td>
                                <td className="p-2 text-center">
                                    <button onClick={() => handleRemoveRate(rate.id)} className="p-2 text-slate-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50">
                        <tr>
                            <td className="p-2"><TableInput value={newRate.role} onChange={(e) => handleNewRateChange('role', e.target.value)} placeholder="New Role" /></td>
                            <td className="p-2"><TableInput type="number" value={newRate.monthlySalary} onChange={(e) => handleNewRateChange('monthlySalary', parseFloat(e.target.value) || 0)} /></td>
                            <td className="p-2"><TableInput type="number" value={newRate.accommodation} onChange={(e) => handleNewRateChange('accommodation', parseFloat(e.target.value) || 0)} /></td>
                            <td className="p-2"><TableInput type="number" value={newRate.transport} onChange={(e) => handleNewRateChange('transport', parseFloat(e.target.value) || 0)} /></td>
                            <td className="p-2"><TableInput type="number" value={newRate.visaCostPerYear} onChange={(e) => handleNewRateChange('visaCostPerYear', parseFloat(e.target.value) || 0)} /></td>
                            <td className="p-2"><TableInput type="number" value={newRate.annualFlightTicketCost} onChange={(e) => handleNewRateChange('annualFlightTicketCost', parseFloat(e.target.value) || 0)} /></td>
                            <td className="p-2"><TableInput type="number" value={newRate.leaveSettlementDaysPerYear} onChange={(e) => handleNewRateChange('leaveSettlementDaysPerYear', parseInt(e.target.value, 10) || 0)} /></td>
                            <td className="p-2 text-right font-bold text-base">
                                 <button onClick={handleAiAssistClick} disabled={isAiLoading} className="p-2 text-slate-500 hover:text-blue-600 disabled:opacity-50" title="AI Assist">
                                    {isAiLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div> : <SparkleIcon className="w-5 h-5 mx-auto" />}
                                 </button>
                            </td>
                            <td className="p-2 text-center">
                                <button onClick={handleAddRate} className="p-2 text-slate-500 hover:text-green-600"><PlusIcon className="w-5 h-5"/></button>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default ManpowerRatesTable;