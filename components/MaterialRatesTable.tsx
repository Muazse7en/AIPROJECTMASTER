import React, { useState, useEffect } from 'react';
import { MaterialRate } from '../types';
import { PlusIcon, TrashIcon, SparkleIcon } from './icons';

interface MaterialRatesTableProps {
  rates: MaterialRate[];
  onUpdate: (newRates: MaterialRate[]) => void;
  onAiAssist: (materialName: string) => Promise<Partial<MaterialRate>>;
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

const MaterialRatesTable: React.FC<MaterialRatesTableProps> = ({ rates, onUpdate, onAiAssist }) => {
    const [localRates, setLocalRates] = useState(rates);
    const [newRate, setNewRate] = useState<Omit<MaterialRate, 'id'>>({
        name: '', unit: '', unitPrice: 0, supplier: ''
    });
    const [isAiLoading, setIsAiLoading] = useState(false);

    useEffect(() => {
        setLocalRates(rates);
    }, [rates]);

    const handleUpdateRate = (index: number, field: keyof MaterialRate, value: any) => {
        const updatedRates = [...localRates];
        updatedRates[index] = { ...updatedRates[index], [field]: value };
        onUpdate(updatedRates);
    };
    
    const handleNewRateChange = (field: keyof typeof newRate, value: any) => {
        setNewRate(prev => ({ ...prev, [field]: value }));
    };

    const handleAddRate = () => {
        if (!newRate.name || !newRate.unit || newRate.unitPrice <= 0) {
            alert("Please enter a valid material name, unit, and price.");
            return;
        }
        const newRateWithId: MaterialRate = {
            ...newRate,
            id: Date.now(),
        };
        onUpdate([...localRates, newRateWithId]);
        setNewRate({ name: '', unit: '', unitPrice: 0, supplier: '' });
    };

    const handleRemoveRate = (id: number) => {
        onUpdate(localRates.filter(rate => rate.id !== id));
    };
    
    const handleAiAssistClick = async () => {
        if (!newRate.name) {
            alert("Please enter a material name to get AI assistance.");
            return;
        }
        setIsAiLoading(true);
        try {
            const result = await onAiAssist(newRate.name);
            setNewRate(prev => ({ ...prev, ...result }));
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-slate-800 p-4 border-b">Material & Supplier Database</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-medium">
                        <tr>
                            <th className="p-3 text-left">Material Name</th>
                            <th className="p-3 text-left">Unit</th>
                            <th className="p-3 text-left">Unit Price (QAR)</th>
                            <th className="p-3 text-left">Supplier (Optional)</th>
                            <th className="p-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {localRates.map((rate, index) => (
                            <tr key={rate.id} className="border-b border-slate-200">
                                <td className="p-2 w-2/5"><TableInput value={rate.name} onChange={(e) => handleUpdateRate(index, 'name', e.target.value)} /></td>
                                <td className="p-2"><TableInput value={rate.unit} onChange={(e) => handleUpdateRate(index, 'unit', e.target.value)} /></td>
                                <td className="p-2"><TableInput type="number" value={rate.unitPrice} onChange={(e) => handleUpdateRate(index, 'unitPrice', parseFloat(e.target.value) || 0)} /></td>
                                <td className="p-2"><TableInput value={rate.supplier || ''} onChange={(e) => handleUpdateRate(index, 'supplier', e.target.value)} /></td>
                                <td className="p-2 text-center">
                                    <button onClick={() => handleRemoveRate(rate.id)} className="p-2 text-slate-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50">
                        <tr>
                            <td className="p-2"><TableInput value={newRate.name} onChange={(e) => handleNewRateChange('name', e.target.value)} placeholder="New Material" /></td>
                            <td className="p-2"><TableInput value={newRate.unit} onChange={(e) => handleNewRateChange('unit', e.target.value)} placeholder="e.g., m³" /></td>
                            <td className="p-2">
                                <div className="flex items-center">
                                    <TableInput type="number" value={newRate.unitPrice} onChange={(e) => handleNewRateChange('unitPrice', parseFloat(e.target.value) || 0)} />
                                    <button onClick={handleAiAssistClick} disabled={isAiLoading} className="p-2 text-slate-500 hover:text-blue-600 disabled:opacity-50" title="AI Assist">
                                        {isAiLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div> : <SparkleIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            </td>
                            <td className="p-2"><TableInput value={newRate.supplier || ''} onChange={(e) => handleNewRateChange('supplier', e.target.value)} placeholder="Supplier Name" /></td>
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

export default MaterialRatesTable;