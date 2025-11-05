import React, { useState, useCallback, useMemo } from 'react';
import { BOQItem, RateBreakdown, Database, ManpowerRate, EquipmentRate, ClientProfile, MaterialRate } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import BOQTable from './components/BOQTable';
import BSRModal from './components/BSRModal';
import DatabaseView from './components/DatabaseView';
import NotesModal from './components/NotesModal';
import { analyzeDescription, analyzeRateForDatabase, analyzeMaterialForDatabase } from './services/geminiService';
import { exportToExcel } from './utils/fileExporter';

const initialBOQItems: BOQItem[] = [
  // ... (existing initial BOQ items)
];

const initialDatabase: Database = {
  manpowerRates: [
    { id: 1, role: 'Skilled Laborer / Mason', monthlySalary: 2500, accommodation: 300, transport: 200, visaCostPerYear: 500, annualFlightTicketCost: 1200, leaveSettlementDaysPerYear: 21, effectiveHourlyRate: 20.91 },
    { id: 2, role: 'General Helper', monthlySalary: 1500, accommodation: 250, transport: 150, visaCostPerYear: 500, annualFlightTicketCost: 1000, leaveSettlementDaysPerYear: 21, effectiveHourlyRate: 13.10 },
    { id: 3, role: 'Foreman', monthlySalary: 4500, accommodation: 500, transport: 300, visaCostPerYear: 750, annualFlightTicketCost: 1800, leaveSettlementDaysPerYear: 21, effectiveHourlyRate: 35.82 },
  ],
  equipmentRates: [
    { id: 1, item: 'Excavator (20T)', hourlyRate: 250 },
    { id: 2, item: 'Concrete Mixer (1 bag)', hourlyRate: 50 },
    { id: 3, item: 'JCB / Backhoe Loader', hourlyRate: 150 },
    { id: 4, item: 'Dewatering Pump (4")', hourlyRate: 30 },
  ],
  materialRates: [
    { id: 1, name: 'OPC Cement (50kg bag)', unit: 'bag', unitPrice: 16, supplier: 'Qatar National Cement' },
    { id: 2, name: 'Dune Sand', unit: 'm³', unitPrice: 45, supplier: 'Local Supplier' },
    { id: 3, name: 'Washed Sand', unit: 'm³', unitPrice: 60, supplier: 'Local Supplier' },
    { id: 4, name: 'Aggregate (20mm)', unit: 'm³', unitPrice: 75, supplier: 'Local Supplier' },
    { id: 5, name: 'Deformed Steel Bar (12mm)', unit: 'ton', unitPrice: 2400, supplier: 'Qatar Steel' },
  ],
  clientProfiles: [
    { id: 1, name: 'Standard Client', markupPercentage: 0 },
    { id: 2, name: 'Premium Client (Ashghal)', markupPercentage: 10 },
    { id: 3, name: 'Private Villa Client', markupPercentage: 5 },
  ],
};


const App: React.FC = () => {
  const [boqItems, setBoqItems] = useState<BOQItem[]>(initialBOQItems);
  const [projectDuration, setProjectDuration] = useState<number>(180);
  const [editingBSRItemId, setEditingBSRItemId] = useState<number | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [generalNotes, setGeneralNotes] = useState<string>(`High-risk project located in a congested downtown area with limited site access. All work must adhere to strict safety protocols and noise regulations. A higher profit margin of 15% should be considered due to the increased risk and complexity.`);
  const [sow, setSow] = useState<string>(`Construction of a G+2 private villa, including all substructure, superstructure, MEP, finishing, and external works as per approved drawings and specifications.`);
  const [view, setView] = useState<'boq' | 'database'>('boq');
  const [database, setDatabase] = useState<Database>(initialDatabase);
  const [activeClientId, setActiveClientId] = useState<number>(1);
  const [projectName, setProjectName] = useState<string>('New Villa Construction');
  const [clientName, setClientName] = useState<string>('Mr. Ahmed Al-Thani');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(['unit', 'quantity', 'manpower', 'notes', 'unitPrice', 'total'])
  );
  const [activeModal, setActiveModal] = useState<'notes' | 'sow' | null>(null);

  const editingBSRItem = useMemo(() => {
    if (editingBSRItemId === null) return null;
    return boqItems.find(item => item.id === editingBSRItemId) ?? null;
  }, [editingBSRItemId, boqItems]);

  const handleToggleColumn = useCallback((columnKey: string) => {
    setVisibleColumns(prev => {
        const newSet = new Set(prev);
        if (newSet.has(columnKey)) {
            newSet.delete(columnKey);
        } else {
            newSet.add(columnKey);
        }
        return newSet;
    });
  }, []);

  const handleUpdateItem = useCallback((id: number, field: keyof BOQItem, value: any) => {
    setBoqItems(prevItems => prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            const quantity = field === 'quantity' ? Number(value) : item.quantity;
            const unitPrice = field === 'unitPrice' ? Number(value) : item.unitPrice;
            updatedItem.total = quantity * unitPrice;
          }
          return updatedItem;
        }
        return item;
      })
    );
  }, []);

  const handleAddItem = useCallback(() => {
    setBoqItems(prevItems => [
      ...prevItems,
      {
        id: prevItems.length > 0 ? Math.max(...prevItems.map(item => item.id)) + 1 : 1,
        description: '', unit: '', quantity: 0, manpower: '', unitPrice: 0, total: 0,
        rateBreakdown: null, isAiAssisted: false, status: 'idle', notes: '', category: 'Uncategorized',
      }
    ]);
  }, []);

  const handleRemoveItems = useCallback((idsToRemove: number[]) => {
    setBoqItems(prevItems => prevItems.filter(item => !idsToRemove.includes(item.id)));
    setSelectedItemIds(prevIds => {
      const newIds = new Set(prevIds);
      idsToRemove.forEach(id => newIds.delete(id));
      return newIds;
    });
  }, []);

  const handleAiAssist = useCallback(async (id: number) => {
    const item = boqItems.find(i => i.id === id);
    if (!item || !item.description) {
      alert("Please enter a description first.");
      return;
    }

    handleUpdateItem(id, 'status', 'loading');
    
    const activeClient = database.clientProfiles.find(c => c.id === activeClientId) || database.clientProfiles[0];
    const markup = 1 + (activeClient.markupPercentage / 100);

    const manpowerRatesWithMarkup = database.manpowerRates.map(r => ({ ...r, effectiveHourlyRate: r.effectiveHourlyRate * markup }));
    const equipmentRatesWithMarkup = database.equipmentRates.map(r => ({...r, hourlyRate: r.hourlyRate * markup }));

    try {
      const result = await analyzeDescription(
          item.description, 
          item.notes || '', 
          generalNotes,
          sow,
          manpowerRatesWithMarkup,
          equipmentRatesWithMarkup,
          database.materialRates
      );
      
      const { rateBreakdown: baseBSR, ...rest } = result;
      
      const subtotal = 
        baseBSR.materials.reduce((sum, i) => sum + i.cost, 0) +
        baseBSR.labor.reduce((sum, i) => sum + i.cost, 0) +
        baseBSR.equipment.reduce((sum, i) => sum + i.cost, 0) +
        baseBSR.tools.reduce((sum, i) => sum + i.cost, 0);

      const overheadAmount = subtotal * (baseBSR.overhead.percentage / 100);
      const profitAmount = (subtotal + overheadAmount) * (baseBSR.profit.percentage / 100);
      const total = subtotal + overheadAmount + profitAmount;
      const quotedUnitPrice = Math.round(total);
      
      const fullRateBreakdown: RateBreakdown = {
        ...baseBSR, subtotal,
        overhead: { percentage: baseBSR.overhead.percentage, amount: overheadAmount },
        profit: { percentage: baseBSR.profit.percentage, amount: profitAmount },
        total, quotedUnitPrice,
      };

      setBoqItems(prevItems => prevItems.map(i => {
          if (i.id === id) {
              return {
                ...i, manpower: rest.manpower, unit: rest.unit, unitPrice: quotedUnitPrice,
                rateBreakdown: fullRateBreakdown, isAiAssisted: true, status: 'success',
                category: rest.category,
                total: i.quantity * quotedUnitPrice,
              };
          }
          return i;
      }));
      
    } catch (error) {
      console.error("AI analysis failed:", error);
      handleUpdateItem(id, 'status', 'error');
      alert("Failed to get AI assistance. Please check the console for details.");
    }
  }, [boqItems, generalNotes, sow, handleUpdateItem, database, activeClientId]);

  const handleBulkAiAssist = useCallback(async () => {
    const idsToProcess = Array.from(selectedItemIds);
    for (const id of idsToProcess) { await handleAiAssist(id); }
  }, [selectedItemIds, handleAiAssist]);

  const handleShowBSR = useCallback((id: number) => {
    const item = boqItems.find(i => i.id === id);
    if (item && item.rateBreakdown) { setEditingBSRItemId(id); } 
    else { alert("No rate breakdown available. Use AI Assist first."); }
  }, [boqItems]);

  const handleSaveBSR = useCallback((itemId: number, newBSR: RateBreakdown) => {
    setBoqItems(prevItems => prevItems.map(item => {
        if (item.id === itemId) {
            const newUnitPrice = newBSR.quotedUnitPrice;
            return { ...item, rateBreakdown: newBSR, unitPrice: newUnitPrice, total: item.quantity * newUnitPrice };
        }
        return item;
    }));
    setEditingBSRItemId(null);
  }, []);

  const handleSelectItem = useCallback((id: number, isSelected: boolean) => {
    setSelectedItemIds(prevIds => {
      const newIds = new Set(prevIds);
      if (isSelected) { newIds.add(id); } 
      else { newIds.delete(id); }
      return newIds;
    });
  }, []);

  const handleSelectAll = useCallback((isSelected: boolean) => {
    if (isSelected) { setSelectedItemIds(new Set(boqItems.map(item => item.id))); } 
    else { setSelectedItemIds(new Set()); }
  }, [boqItems]);

  const handleExport = useCallback(() => {
    exportToExcel(boqItems, 'BOQ_Export', projectName, clientName);
  }, [boqItems, projectName, clientName]);
  
  const handleDatabaseUpdate = useCallback((
    category: keyof Database, 
    data: ManpowerRate[] | EquipmentRate[] | ClientProfile[] | MaterialRate[]
  ) => {
      setDatabase(prevDb => ({ ...prevDb, [category]: data }));
  }, []);
  
  const handleDatabaseAiAssist = useCallback(async (role: string): Promise<Partial<ManpowerRate>> => {
      try {
          return await analyzeRateForDatabase(role);
      } catch (error) {
          console.error("Database AI assist failed:", error);
          alert("Failed to get AI assistance for the database item.");
          return {};
      }
  }, []);

  const handleMaterialDatabaseAiAssist = useCallback(async (materialName: string): Promise<Partial<MaterialRate>> => {
      try {
          return await analyzeMaterialForDatabase(materialName);
      } catch (error) {
          console.error("Material DB AI assist failed:", error);
          alert("Failed to get AI assistance for the material.");
          return {};
      }
  }, []);

  const handleSaveModal = (content: string) => {
    if (activeModal === 'notes') {
        setGeneralNotes(content);
    } else if (activeModal === 'sow') {
        setSow(content);
    }
    setActiveModal(null);
  };

  const chartData = useMemo(() => {
    const costBreakdown = { Materials: 0, Labor: 0, Equipment: 0, Tools: 0, Overhead: 0, Profit: 0 };
    const costByCategory: { [key: string]: number } = {};

    for (const item of boqItems) {
      if (item.rateBreakdown) {
        const quantity = item.quantity || 0;
        costBreakdown.Materials += item.rateBreakdown.materials.reduce((sum, m) => sum + m.cost, 0) * quantity;
        costBreakdown.Labor += item.rateBreakdown.labor.reduce((sum, l) => sum + l.cost, 0) * quantity;
        costBreakdown.Equipment += item.rateBreakdown.equipment.reduce((sum, e) => sum + e.cost, 0) * quantity;
        costBreakdown.Tools += item.rateBreakdown.tools.reduce((sum, t) => sum + t.cost, 0) * quantity;
        costBreakdown.Overhead += item.rateBreakdown.overhead.amount * quantity;
        costBreakdown.Profit += item.rateBreakdown.profit.amount * quantity;

        const category = item.category || 'Uncategorized';
        if (!costByCategory[category]) {
            costByCategory[category] = 0;
        }
        costByCategory[category] += item.total || 0;
      }
    }
    return { costBreakdown, costByCategory };
  }, [boqItems]);

  const dashboardData = useMemo(() => {
    const totalCost = boqItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const totalDryCost = boqItems.reduce((sum, item) => {
      if (item.rateBreakdown && item.quantity > 0) {
        return sum + (item.rateBreakdown.subtotal * item.quantity);
      }
      return sum;
    }, 0);
    const manpower = [...new Set(boqItems.flatMap(item => item.manpower.split(',').map(m => m.trim()).filter(Boolean)))];
    return { 
        totalCost,
        totalDryCost,
        manpower, projectDuration, 
        clients: database.clientProfiles, activeClientId,
        projectName, clientName,
        chartData,
    };
  }, [boqItems, projectDuration, database.clientProfiles, activeClientId, projectName, clientName, chartData]);
  
  const modalContent = activeModal === 'notes' ? generalNotes : activeModal === 'sow' ? sow : '';
  const modalTitle = activeModal === 'notes' ? 'General Project Notes for AI' : 'Project Scope of Work (SOW)';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Header currentView={view} onToggleView={() => setView(v => v === 'boq' ? 'database' : 'boq')} />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        {view === 'boq' ? (
          <>
            <Dashboard 
              data={dashboardData} 
              onDurationChange={setProjectDuration} 
              onExport={handleExport}
              onClientChange={setActiveClientId}
              onProjectNameChange={setProjectName}
              onClientNameChange={setClientName}
              onOpenNotesModal={() => setActiveModal('notes')}
              onOpenSowModal={() => setActiveModal('sow')}
            />
            <BOQTable
              items={boqItems}
              selectedItemIds={selectedItemIds}
              visibleColumns={visibleColumns}
              onUpdateItem={handleUpdateItem}
              onAddItem={handleAddItem}
              onRemoveItems={handleRemoveItems}
              onAiAssist={handleAiAssist}
              onBulkAiAssist={handleBulkAiAssist}
              onShowBSR={handleShowBSR}
              onSelectItem={handleSelectItem}
              onSelectAll={handleSelectAll}
              onToggleColumn={handleToggleColumn}
            />
          </>
        ) : (
          <DatabaseView 
            database={database}
            onUpdate={handleDatabaseUpdate}
            onAiAssist={handleDatabaseAiAssist}
            onMaterialAiAssist={handleMaterialDatabaseAiAssist}
          />
        )}
      </main>
      {editingBSRItem && (
        <BSRModal
            item={editingBSRItem}
            onClose={() => setEditingBSRItemId(null)}
            onSave={(newBSR) => handleSaveBSR(editingBSRItem.id, newBSR)}
            onAiRegenerate={() => handleAiAssist(editingBSRItem.id)}
        />
      )}
      {activeModal && (
        <NotesModal
            title={modalTitle}
            initialContent={modalContent}
            onClose={() => setActiveModal(null)}
            onSave={handleSaveModal}
        />
      )}
    </div>
  );
};

export default App;