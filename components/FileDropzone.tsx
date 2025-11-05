
import React, { useState, useCallback } from 'react';
import { UploadCloudIcon } from './icons';

interface FileDropzoneProps {
  onFileDrop: (file: File) => void;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ onFileDrop }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileDrop(e.dataTransfer.files[0]);
    }
  }, [onFileDrop]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
        onFileDrop(e.target.files[0]);
    }
  };

  return (
    <div 
      onDragEnter={handleDrag} 
      onDragOver={handleDrag} 
      onDragLeave={handleDrag} 
      onDrop={handleDrop}
      className={`p-4 border-2 border-dashed rounded-md m-4 text-center transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'}`}
    >
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
        <UploadCloudIcon className={`w-8 h-8 ${isDragActive ? 'text-blue-600' : 'text-slate-500'}`} />
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop BOQ file
        </p>
        <p className="text-xs text-slate-500">Excel, CSV, or PDF (parsing is a mock-up)</p>
      </label>
      <input id="file-upload" type="file" className="hidden" onChange={handleChange} />
    </div>
  );
};

export default FileDropzone;
