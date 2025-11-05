import React from 'react';
import { Database, ManpowerRate, MaterialRate } from '../types';
import ManpowerRatesTable from './ManpowerRatesTable';
import EquipmentRatesTable from './EquipmentRatesTable';
import ClientManager from './ClientManager';
import MaterialRatesTable from './MaterialRatesTable';

interface DatabaseViewProps {
  database: Database;
  onUpdate: (category: keyof Database, data: any[]) => void;
  onAiAssist: (role: string) => Promise<Partial<ManpowerRate>>;
  onMaterialAiAssist: (materialName: string) => Promise<Partial<MaterialRate>>;
}

const DatabaseView: React.FC<DatabaseViewProps> = ({ database, onUpdate, onAiAssist, onMaterialAiAssist }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Settings & Database</h2>
        <p className="text-slate-600">
          Manage your company's standard rates and client profiles here. These values will be used by the AI to generate accurate, customized estimates.
        </p>
      </div>

      <ManpowerRatesTable 
        rates={database.manpowerRates}
        onUpdate={(newRates) => onUpdate('manpowerRates', newRates)}
        onAiAssist={onAiAssist}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <EquipmentRatesTable
            rates={database.equipmentRates}
            onUpdate={(newRates) => onUpdate('equipmentRates', newRates)}
        />
        <MaterialRatesTable
            rates={database.materialRates}
            onUpdate={(newRates) => onUpdate('materialRates', newRates)}
            onAiAssist={onMaterialAiAssist}
        />
      </div>

      <ClientManager
          clients={database.clientProfiles}
          onUpdate={(newClients) => onUpdate('clientProfiles', newClients)}
      />

    </div>
  );
};

export default DatabaseView;