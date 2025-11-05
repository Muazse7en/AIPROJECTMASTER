import React, { useState, useEffect } from 'react';
import { ClientProfile } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface ClientManagerProps {
  clients: ClientProfile[];
  onUpdate: (newClients: ClientProfile[]) => void;
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

const ClientManager: React.FC<ClientManagerProps> = ({ clients, onUpdate }) => {
    const [localClients, setLocalClients] = useState(clients);
    const [newName, setNewName] = useState('');
    const [newMarkup, setNewMarkup] = useState(0);

    useEffect(() => {
        setLocalClients(clients);
    }, [clients]);

    const handleUpdateClient = (index: number, field: keyof ClientProfile, value: any) => {
        const updatedClients = [...localClients];
        updatedClients[index] = { ...updatedClients[index], [field]: value };
        onUpdate(updatedClients);
    };

    const handleAddClient = () => {
        if (!newName) {
            alert("Please enter a client name.");
            return;
        }
        const newClient: ClientProfile = {
            id: Date.now(),
            name: newName,
            markupPercentage: newMarkup,
        };
        onUpdate([...localClients, newClient]);
        setNewName('');
        setNewMarkup(0);
    };

    const handleRemoveClient = (id: number) => {
        // Prevent deleting the last client
        if (localClients.length <= 1) {
            alert("You must have at least one client profile.");
            return;
        }
        onUpdate(localClients.filter(client => client.id !== id));
    };

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-slate-800 p-4 border-b">Client Profile Manager</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-medium">
                        <tr>
                            <th className="p-3 text-left">Client Name</th>
                            <th className="p-3 text-left">Markup (%)</th>
                            <th className="p-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {localClients.map((client, index) => (
                            <tr key={client.id} className="border-b border-slate-200">
                                <td className="p-2"><TableInput value={client.name} onChange={(e) => handleUpdateClient(index, 'name', e.target.value)} /></td>
                                <td className="p-2"><TableInput type="number" value={client.markupPercentage} onChange={(e) => handleUpdateClient(index, 'markupPercentage', parseFloat(e.target.value) || 0)} /></td>
                                <td className="p-2 text-center">
                                    <button onClick={() => handleRemoveClient(client.id)} className="p-2 text-slate-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50">
                        <tr>
                            <td className="p-2"><TableInput value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New Client Name" /></td>
                            <td className="p-2"><TableInput type="number" value={newMarkup} onChange={(e) => setNewMarkup(parseFloat(e.target.value) || 0)} /></td>
                            <td className="p-2 text-center">
                                <button onClick={handleAddClient} className="p-2 text-slate-500 hover:text-green-600"><PlusIcon className="w-5 h-5"/></button>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default ClientManager;
