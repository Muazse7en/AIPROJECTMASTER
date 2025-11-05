
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RateBreakdown, BOQItem, Material, Labor, Equipment, Tool } from '../types';
import { CloseIcon, SparkleIcon, PlusIcon, TrashIcon } from './icons';

interface BSRModalProps {
  item: BOQItem;
  onClose: () => void;
  onSave: (newBSR: RateBreakdown) => void;
  onAiRegenerate: () => Promise<void>;
}

const EditableCell: React.FC<{ value: string | number, onChange: (value: string | number) => void, type?: 'text' | 'number', className?: string, disabled?: boolean }> = ({ value, onChange, type = 'text', className = '', disabled=false }) => (
    <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        className={`w-full bg-slate-50 p-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed ${className}`}
        disabled={disabled}
    />
);

const BSRSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-4">
    <h4 className="text-md font-semibold text-slate-700 border-b pb-2 mb-3">{title}</h4>
    {children}
  </div>
);

const BSRModal: React.FC<BSRModalProps> = ({ item, onClose, onSave, onAiRegenerate }) => {
    const [editableBSR, setEditableBSR] = useState<RateBreakdown>(() => JSON.parse(JSON.stringify(item.rateBreakdown!)));
    const [isRegenerating, setIsRegenerating] = useState(false);

    useEffect(() => {
        // This effect re-syncs the modal's state if the underlying item's BSR changes
        // (e.g., after an AI regeneration).
        setEditableBSR(JSON.parse(JSON.stringify(item.rateBreakdown!)));
    }, [item.rateBreakdown]);
    
    const handleAiRegenerateClick = async () => {
        if (confirm('This will overwrite your current edits with new AI-generated data. Are you sure?')) {
            setIsRegenerating(true);
            await onAiRegenerate();
            setIsRegenerating(false);
        }
    };
    
    const updateBSR = useCallback((updater: (bsr: RateBreakdown) => RateBreakdown) => {
        setEditableBSR(updater);
    }, []);
    
    useEffect(() => {
        // Recalculate totals whenever the BSR object changes, except for the quoted price.
        const subtotal = 
            editableBSR.materials.reduce((sum, i) => sum + i.cost, 0) +
            editableBSR.labor.reduce((sum, i) => sum + i.cost, 0) +
            editableBSR.equipment.reduce((sum, i) => sum + i.cost, 0) +
            editableBSR.tools.reduce((sum, i) => sum + i.cost, 0);

        const overheadAmount = subtotal * (editableBSR.overhead.percentage / 100);
        const profitAmount = (subtotal + overheadAmount) * (editableBSR.profit.percentage / 100);
        const total = subtotal + overheadAmount + profitAmount;

        setEditableBSR(currentBSR => ({
            ...currentBSR,
            subtotal,
            overhead: { ...currentBSR.overhead, amount: overheadAmount },
            profit: { ...currentBSR.profit, amount: profitAmount },
            total,
        }));

    }, [editableBSR.materials, editableBSR.labor, editableBSR.equipment, editableBSR.tools, editableBSR.overhead.percentage, editableBSR.profit.percentage]);


    const handleUpdate = <T extends Exclude<keyof RateBreakdown, 'total' | 'subtotal' | 'overhead' | 'profit' | 'quotedUnitPrice'>>(section: T, index: number, field: keyof RateBreakdown[T][0], value: any) => {
        updateBSR(bsr => {
            const newBSR = { ...bsr };
            const newSection = [...newBSR[section]] as any[];
            let updatedItem = { ...newSection[index], [field]: value };

            if ((section === 'labor' || section === 'equipment') && (field === 'hours' || field === 'rate')) {
                const item = updatedItem as Labor | Equipment;
                updatedItem.cost = item.hours * item.rate;
            }
             
            if (section === 'materials' && (field === 'quantity' || field === 'unitPrice')) {
                const item = updatedItem as Material;
                updatedItem.cost = (item.quantity || 0) * (item.unitPrice || 0);
            }
            
            newSection[index] = updatedItem;
            newBSR[section] = newSection as any;
            return newBSR;
        });
    };

    const handleAdd = (section: 'materials' | 'labor' | 'equipment' | 'tools') => {
        updateBSR(bsr => {
            const newBSR = { ...bsr };
            let newItem: any;
            if (section === 'materials') newItem = { item: '', unit: '', quantity: 1, unitPrice: 0, cost: 0 };
            if (section === 'labor') newItem = { role: '', hours: 0, rate: 0, cost: 0 };
            if (section === 'equipment') newItem = { item: '', hours: 0, rate: 0, cost: 0 };
            if (section === 'tools') newItem = { item: '', cost: 0 };
            
            const newSection = [...newBSR[section], newItem];
            newBSR[section] = newSection as any;
            return newBSR;
        });
    };

    const handleDelete = (section: keyof Omit<RateBreakdown, 'total' | 'subtotal' | 'overhead' | 'profit' | 'quotedUnitPrice'>, index: number) => {
        updateBSR(bsr => {
            const newBSR = { ...bsr };
            const newSection = (newBSR[section] as any[]).filter((_, i) => i !== index);
            newBSR[section] = newSection as any;
            return newBSR;
        });
    };
    
    const handleSaveChanges = () => {
        onSave(editableBSR);
    };

    const handlePercentageUpdate = (field: 'overhead' | 'profit', value: number) => {
        updateBSR(bsr => ({
            ...bsr,
            [field]: { ...bsr[field], percentage: value }
        }))
    };
    
    const handleQuotedPriceUpdate = (value: number) => {
        updateBSR(bsr => ({
            ...bsr,
            quotedUnitPrice: value
        }))
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b">
                    <div>
                         <h3 className="text-lg font-bold text-slate-800">Edit Breakdown of Rates (BSR)</h3>
                         <p className="text-sm text-slate-500 max-w-md truncate">{item.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleAiRegenerateClick} disabled={isRegenerating} className="p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-blue-100 disabled:opacity-50 disabled:cursor-wait transition-colors" title="Regenerate with AI">
                            {isRegenerating ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div> : <SparkleIcon className="w-5 h-5" />}
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100">
                            <CloseIcon />
                        </button>
                    </div>
                </header>
                <main className="p-6 overflow-y-auto space-y-4">
                     {/* Materials */}
                    <BSRSection title="Materials">
                        <table className="w-full text-sm">
                            <thead><tr className="text-left text-xs text-slate-500 uppercase">
                                <th className="pb-2 w-[35%]">Item</th>
                                <th className="pb-2 w-[15%]">Unit</th>
                                <th className="pb-2 w-[15%]">Quantity</th>
                                <th className="pb-2 w-[15%]">Unit Price (QAR)</th>
                                <th className="pb-2 w-[20%] text-right">Cost (QAR)</th>
                                <th className="w-12"></th>
                            </tr></thead>
                            <tbody>{editableBSR.materials.map((m, i) => <tr key={i}>
                                <td className="pr-2 py-1"><EditableCell value={m.item} onChange={v => handleUpdate('materials', i, 'item', v)} /></td>
                                <td className="pr-2 py-1"><EditableCell value={m.unit} onChange={v => handleUpdate('materials', i, 'unit', v)} /></td>
                                <td className="pr-2 py-1"><EditableCell value={m.quantity} type="number" onChange={v => handleUpdate('materials', i, 'quantity', v)} /></td>
                                <td className="pr-2 py-1"><EditableCell value={m.unitPrice} type="number" onChange={v => handleUpdate('materials', i, 'unitPrice', v)} className="text-right" /></td>
                                <td className="pr-2 py-1 text-right font-medium text-slate-600">{m.cost.toFixed(2)}</td>
                                <td><button onClick={() => handleDelete('materials', i)} className="p-1 text-slate-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button></td>
                            </tr>)}</tbody>
                        </table>
                        <button onClick={() => handleAdd('materials')} className="text-blue-600 text-sm font-semibold mt-2 flex items-center"><PlusIcon className="w-4 h-4 mr-1"/>Add Material</button>
                    </BSRSection>
                     {/* Labor */}
                    <BSRSection title="Labor">
                        <table className="w-full text-sm">
                             <thead><tr className="text-left text-xs text-slate-500 uppercase">
                                <th className="pb-2 w-2/5">Role</th><th className="pb-2 w-1/5">Hours</th><th className="pb-2 w-1/5">Rate (QAR/hr)</th><th className="pb-2 w-1/5 text-right">Cost (QAR)</th><th className="w-12"></th>
                            </tr></thead>
                            <tbody>{editableBSR.labor.map((l, i) => <tr key={i}>
                                <td className="pr-2 py-1"><EditableCell value={l.role} onChange={v => handleUpdate('labor', i, 'role', v)} /></td>
                                <td className="pr-2 py-1"><EditableCell value={l.hours} type="number" onChange={v => handleUpdate('labor', i, 'hours', v)} /></td>
                                <td className="pr-2 py-1"><EditableCell value={l.rate} type="number" onChange={v => handleUpdate('labor', i, 'rate', v)} /></td>
                                <td className="pr-2 py-1 text-right font-medium text-slate-600">{l.cost.toFixed(2)}</td>
                                <td><button onClick={() => handleDelete('labor', i)} className="p-1 text-slate-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button></td>
                            </tr>)}</tbody>
                        </table>
                        <button onClick={() => handleAdd('labor')} className="text-blue-600 text-sm font-semibold mt-2 flex items-center"><PlusIcon className="w-4 h-4 mr-1"/>Add Labor</button>
                    </BSRSection>
                     {/* Equipment */}
                     <BSRSection title="Equipment">
                        <table className="w-full text-sm">
                            <thead><tr className="text-left text-xs text-slate-500 uppercase">
                                <th className="pb-2 w-2/5">Item</th><th className="pb-2 w-1/5">Hours</th><th className="pb-2 w-1/5">Rate (QAR/hr)</th><th className="pb-2 w-1/5 text-right">Cost (QAR)</th><th className="w-12"></th>
                            </tr></thead>
                            <tbody>{editableBSR.equipment.map((e, i) => <tr key={i}>
                                <td className="pr-2 py-1"><EditableCell value={e.item} onChange={v => handleUpdate('equipment', i, 'item', v)} /></td>
                                <td className="pr-2 py-1"><EditableCell value={e.hours} type="number" onChange={v => handleUpdate('equipment', i, 'hours', v)} /></td>
                                <td className="pr-2 py-1"><EditableCell value={e.rate} type="number" onChange={v => handleUpdate('equipment', i, 'rate', v)} /></td>
                                <td className="pr-2 py-1 text-right font-medium text-slate-600">{e.cost.toFixed(2)}</td>
                                <td><button onClick={() => handleDelete('equipment', i)} className="p-1 text-slate-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button></td>
                            </tr>)}</tbody>
                        </table>
                        <button onClick={() => handleAdd('equipment')} className="text-blue-600 text-sm font-semibold mt-2 flex items-center"><PlusIcon className="w-4 h-4 mr-1"/>Add Equipment</button>
                    </BSRSection>
                     {/* Tools */}
                    <BSRSection title="Tools & Plants">
                        <table className="w-full text-sm">
                            <thead><tr className="text-left text-xs text-slate-500 uppercase">
                                <th className="pb-2 w-4/5">Item</th><th className="pb-2 w-1/5 text-right">Cost (QAR)</th><th className="w-12"></th>
                            </tr></thead>
                            <tbody>{editableBSR.tools.map((t, i) => <tr key={i}>
                                <td className="pr-2 py-1"><EditableCell value={t.item} onChange={v => handleUpdate('tools', i, 'item', v)} /></td>
                                <td className="pr-2 py-1"><EditableCell value={t.cost} type="number" onChange={v => handleUpdate('tools', i, 'cost', v)} className="text-right"/></td>
                                <td><button onClick={() => handleDelete('tools', i)} className="p-1 text-slate-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button></td>
                            </tr>)}</tbody>
                        </table>
                         <button onClick={() => handleAdd('tools')} className="text-blue-600 text-sm font-semibold mt-2 flex items-center"><PlusIcon className="w-4 h-4 mr-1"/>Add Tool</button>
                    </BSRSection>

                    {/* Cost Summary */}
                    <BSRSection title="Cost Summary">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-w-lg">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-slate-600">Subtotal</span>
                                <span className="font-bold text-slate-800 text-lg">QAR {editableBSR.subtotal.toFixed(2)}</span>
                            </div>
                            <div></div>
                            <div className="flex justify-between items-center">
                                <label className="font-semibold text-slate-600">Overhead</label>
                                <div className="flex items-center space-x-2">
                                    <EditableCell value={editableBSR.overhead.percentage} type="number" onChange={v => handlePercentageUpdate('overhead', v as number)} className="w-20 text-right" />
                                    <span>%</span>
                                </div>
                            </div>
                            <div className="text-right text-slate-600">QAR {editableBSR.overhead.amount.toFixed(2)}</div>
                             <div className="flex justify-between items-center">
                                <label className="font-semibold text-slate-600">Profit</label>
                                 <div className="flex items-center space-x-2">
                                    <EditableCell value={editableBSR.profit.percentage} type="number" onChange={v => handlePercentageUpdate('profit', v as number)} className="w-20 text-right" />
                                    <span>%</span>
                                </div>
                            </div>
                            <div className="text-right text-slate-600">QAR {editableBSR.profit.amount.toFixed(2)}</div>
                        </div>
                    </BSRSection>

                </main>
                <footer className="p-4 border-t bg-slate-50 rounded-b-lg flex justify-between items-center mt-auto">
                    <div className="flex items-baseline space-x-4">
                        <div className="text-right">
                           <span className="text-sm text-slate-600 block">Final Calculated Price</span>
                           <span className="text-xl font-bold text-slate-800">QAR {editableBSR.total.toFixed(2)}</span>
                        </div>
                        <div className="text-right">
                            <label className="text-sm text-slate-600 font-semibold block">Quoted Unit Price (QAR)</label>
                            <EditableCell value={editableBSR.quotedUnitPrice} type="number" onChange={v => handleQuotedPriceUpdate(v as number)} className="text-xl font-bold text-blue-600 w-36 text-right" />
                        </div>
                    </div>
                    <div>
                        <button onClick={onClose} className="text-slate-600 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors mr-2">Cancel</button>
                        <button onClick={handleSaveChanges} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">Save Changes</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default BSRModal;