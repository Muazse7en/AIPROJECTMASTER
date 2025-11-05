import React, { useState, useEffect, useRef } from 'react';
import { BOQItem } from '../types';
import { SparkleIcon, PlusIcon, TrashIcon, InfoIcon, SettingsIcon } from './icons';
import FileDropzone from './FileDropzone';

interface BOQTableProps {
  items: BOQItem[];
  selectedItemIds: Set<number>;
  visibleColumns: Set<string>;
  onUpdateItem: (id: number, field: keyof BOQItem, value: any) => void;
  onAddItem: () => void;
  onRemoveItems: (ids: number[]) => void;
  onAiAssist: (id: number) => void;
  onBulkAiAssist: () => void;
  onShowBSR: (id: number) => void;
  onSelectItem: (id: number, isSelected: boolean) => void;
  onSelectAll: (isSelected: boolean) => void;
  onToggleColumn: (columnKey: string) => void;
}

const TableInput: React.FC<{ value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; type?: string; className?: string, isTextarea?: boolean, rows?: number }> = ({ value, onChange, type = 'text', className = '', isTextarea = false, rows = 2 }) => {
    if (isTextarea) {
        return (
            <textarea
                value={value}
                onChange={onChange}
                className={`w-full bg-transparent p-2 rounded-md border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all resize-y min-h-[40px] ${className}`}
                rows={rows}
            />
        )
    }
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            className={`w-full bg-transparent p-2 rounded-md border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all ${className}`}
        />
    )
};

const units = ['m³', 'm²', 'LM', 'Nos', 'LS', 'Item', 'Ltr', 'Kg', 'Ton', 'Day', 'Hr', 'Set'];

const TableSelect: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; className?: string }> = ({ value, onChange, className = '' }) => {
    return (
        <select
            value={value}
            onChange={onChange}
            className={`w-full bg-transparent p-2 rounded-md border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all ${className}`}
        >
            <option value="">--</option>
            {units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
            ))}
        </select>
    )
};

const BOQTableRow: React.FC<{ item: BOQItem; index: number; isSelected: boolean; visibleColumns: Set<string>; onUpdateItem: BOQTableProps['onUpdateItem']; onRemoveItem: (id: number) => void; onAiAssist: BOQTableProps['onAiAssist']; onShowBSR: BOQTableProps['onShowBSR']; onSelectItem: BOQTableProps['onSelectItem']; }> = ({ item, index, isSelected, visibleColumns, onUpdateItem, onRemoveItem, onAiAssist, onShowBSR, onSelectItem }) => {
    
    return (
    <tr className={`border-b border-slate-200 group transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
      <td className="p-2 text-center">
        <input type="checkbox" checked={isSelected} onChange={(e) => onSelectItem(item.id, e.target.checked)} className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
      </td>
      <td className="p-2 text-center text-slate-500">{index + 1}</td>
      <td className="p-2 w-1/3">
        <TableInput isTextarea value={item.description} onChange={(e) => onUpdateItem(item.id, 'description', e.target.value)} />
      </td>
      {visibleColumns.has('unit') && <td className="p-2"><TableSelect value={item.unit} onChange={(e) => onUpdateItem(item.id, 'unit', e.target.value)} /></td>}
      {visibleColumns.has('quantity') && <td className="p-2"><TableInput type="number" value={item.quantity} onChange={(e) => onUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} /></td>}
      {visibleColumns.has('manpower') && <td className="p-2 w-1/6"><TableInput value={item.manpower} onChange={(e) => onUpdateItem(item.id, 'manpower', e.target.value)} /></td>}
      {visibleColumns.has('notes') && <td className="p-2 w-1/6"><TableInput isTextarea value={item.notes || ''} onChange={(e) => onUpdateItem(item.id, 'notes', e.target.value)} /></td>}
      {visibleColumns.has('unitPrice') && <td className="p-2 text-right cursor-pointer" onDoubleClick={() => onShowBSR(item.id)}>
         <div className="relative">
            <TableInput type="number" className="text-right" value={item.unitPrice.toFixed(2)} onChange={(e) => onUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} />
            {item.rateBreakdown && <div className="absolute top-0 right-0 -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity"><InfoIcon className="w-4 h-4 text-blue-500" /></div>}
        </div>
      </td>}
      {visibleColumns.has('total') && <td className="p-2 text-right font-medium">QAR {item.total.toFixed(2)}</td>}
      <td className="p-2 text-center">
        <div className="flex items-center justify-center space-x-1">
          <button 
            onClick={() => onAiAssist(item.id)}
            disabled={item.status === 'loading'}
            className="p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="AI Assist"
          >
            {item.status === 'loading' ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div> : <SparkleIcon className="w-5 h-5" />}
          </button>
          <button onClick={() => onRemoveItem(item.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors" title="Remove Item">
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const BulkActionsToolbar: React.FC<{ selectedCount: number; onBulkDelete: () => void; onBulkAiAssist: () => void; }> = ({ selectedCount, onBulkDelete, onBulkAiAssist }) => (
    <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
        <span className="font-semibold text-blue-800">{selectedCount} item(s) selected</span>
        <div className="space-x-2">
            <button onClick={onBulkAiAssist} className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 flex items-center">
                <SparkleIcon className="w-4 h-4 mr-1.5" />
                AI Assist Selected
            </button>
            <button onClick={onBulkDelete} className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 flex items-center">
                <TrashIcon className="w-4 h-4 mr-1.5" />
                Delete Selected
            </button>
        </div>
    </div>
);

const ColumnToggler: React.FC<{ visibleColumns: Set<string>; onToggleColumn: (key: string) => void; }> = ({ visibleColumns, onToggleColumn }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const columnOptions = [
        { key: 'unit', label: 'Unit' },
        { key: 'quantity', label: 'Qty' },
        { key: 'manpower', label: 'Manpower' },
        { key: 'notes', label: 'Notes for AI' },
        { key: 'unitPrice', label: 'Unit Price' },
        { key: 'total', label: 'Total' },
    ];
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref]);

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors">
                <SettingsIcon className="w-4 h-4 mr-2" />
                View Options
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-10 border">
                    <div className="p-3 text-sm font-semibold text-slate-700 border-b">Toggle Columns</div>
                    <div className="p-2 space-y-1">
                        {columnOptions.map(({ key, label }) => (
                            <label key={key} className="flex items-center space-x-3 px-2 py-1.5 rounded-md hover:bg-slate-100 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.has(key)}
                                    onChange={() => onToggleColumn(key)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const BOQTable: React.FC<BOQTableProps> = ({ items, selectedItemIds, visibleColumns, onUpdateItem, onAddItem, onRemoveItems, onAiAssist, onBulkAiAssist, onShowBSR, onSelectItem, onSelectAll, onToggleColumn }) => {
  const isAllSelected = items.length > 0 && selectedItemIds.size === items.length;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
         <h3 className="text-lg font-semibold text-slate-800">Bill of Quantities</h3>
         <ColumnToggler visibleColumns={visibleColumns} onToggleColumn={onToggleColumn} />
      </div>
      <FileDropzone onFileDrop={(file) => alert(`File dropped: ${file.name}. File parsing not implemented yet.`)}/>
      {selectedItemIds.size > 0 && (
          <BulkActionsToolbar 
            selectedCount={selectedItemIds.size}
            onBulkDelete={() => onRemoveItems(Array.from(selectedItemIds))}
            onBulkAiAssist={onBulkAiAssist}
          />
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600 uppercase font-medium">
            <tr>
              <th className="p-3 text-center w-12">
                <input type="checkbox" checked={isAllSelected} onChange={(e) => onSelectAll(e.target.checked)} className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
              </th>
              <th className="p-3 text-center w-12">S.No</th>
              <th className="p-3 text-left">Description</th>
              {visibleColumns.has('unit') && <th className="p-3 text-left w-24">Unit</th>}
              {visibleColumns.has('quantity') && <th className="p-3 text-left w-20">Qty</th>}
              {visibleColumns.has('manpower') && <th className="p-3 text-left">Manpower</th>}
              {visibleColumns.has('notes') && <th className="p-3 text-left">Notes for AI</th>}
              {visibleColumns.has('unitPrice') && <th className="p-3 text-right w-32">Unit Price (QAR)</th>}
              {visibleColumns.has('total') && <th className="p-3 text-right w-32">Total (QAR)</th>}
              <th className="p-3 text-center w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <BOQTableRow 
                key={item.id} 
                item={item} 
                index={index}
                isSelected={selectedItemIds.has(item.id)}
                visibleColumns={visibleColumns}
                onUpdateItem={onUpdateItem} 
                onRemoveItem={() => onRemoveItems([item.id])}
                onAiAssist={onAiAssist}
                onShowBSR={onShowBSR}
                onSelectItem={onSelectItem}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <button 
          onClick={onAddItem}
          className="bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
        >
          <PlusIcon className="mr-2" />
          Add Item
        </button>
      </div>
    </div>
  );
};

export default BOQTable;