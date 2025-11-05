import React, { useState, useEffect } from 'react';
import { EquipmentRate } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface EquipmentRatesTableProps {
  rates: EquipmentRate[];
  onUpdate: (newRates: EquipmentRate[]) => void;
}

const TableInput: React.FC<{ value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; placeholder?: string }> = 
({ value, onChange, type = 'text', placeholder = '' }) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-slate-50 p-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
);

const EquipmentRatesTable: React.FC<EquipmentRatesTableProps> = ({ rates, onUpdate }) => {
    const [localRates, setLocalRates] = useState(rates);
    const [newItem, setNewItem] = useState('');
    const [newRate, setNewRate] = useState(0);

    useEffect(() => {
        setLocalRates(rates);
    }, [rates]);

    const handleUpdateRate = (index: number, field: keyof EquipmentRate, value: any) => {
        const updatedRates = [...localRates];
        updatedRates[index] = { ...updatedRates[index], [field]: value };
        onUpdate(updatedRates);
    };

    const handleAddRate = () => {
        if (!newItem || newRate <= 0) {
            alert("Please enter a valid item and hourly rate.");
            return;
        }
        const newRateItem: EquipmentRate = {
            id: Date.now(),
            item: newItem,
            hourlyRate: newRate,
        };
        onUpdate([...localRates, newRateItem]);
        setNewItem('');
        setNewRate(0);
    };

    const handleRemoveRate = (id: number) => {
        onUpdate(localRates.filter(rate => rate.id !== id));
    };

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-slate-800 p-4 border-b">Equipment Rate Database</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-medium">
                        <tr>
                            <th className="p-3 text-left">Equipment / Item</th>
                            <th className="p-3 text-left">Hourly Rate (QAR)</th>
                            <th className="p-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {localRates.map((rate, index) => (
                            <tr key={rate.id} className="border-b border-slate-200">
                                <td className="p-2"><TableInput value={rate.item} onChange={(e) => handleUpdateRate(index, 'item', e.target.value)} /></td>
                                <td className="p-2"><TableInput type="number" value={rate.hourlyRate} onChange={(e) => handleUpdateRate(index, 'hourlyRate', parseFloat(e.target.value) || 0)} /></td>
                                <td className="p-2 text-center">
                                    <button onClick={() => handleRemoveRate(rate.id)} className="p-2 text-slate-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50">
                        <tr>
                            <td className="p-2"><TableInput value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="New Equipment" /></td>
                            <td className="p-2"><TableInput type="number" value={newRate} onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)} /></td>
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

export default EquipmentRatesTable;
