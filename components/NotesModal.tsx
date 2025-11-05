import React, { useState } from 'react';
import { CloseIcon } from './icons';

interface NotesModalProps {
  title: string;
  initialContent: string;
  onClose: () => void;
  onSave: (content: string) => void;
}

const NotesModal: React.FC<NotesModalProps> = ({ title, initialContent, onClose, onSave }) => {
  const [content, setContent] = useState(initialContent);

  const handleSave = () => {
    onSave(content);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col">
        <header className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100">
            <CloseIcon />
          </button>
        </header>
        <main className="p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-slate-50"
            placeholder="Enter details here..."
          />
        </main>
        <footer className="p-4 border-t bg-slate-50 rounded-b-lg flex justify-end items-center mt-auto">
          <button onClick={onClose} className="text-slate-600 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors mr-2">
            Cancel
          </button>
          <button onClick={handleSave} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            Save and Close
          </button>
        </footer>
      </div>
    </div>
  );
};

export default NotesModal;