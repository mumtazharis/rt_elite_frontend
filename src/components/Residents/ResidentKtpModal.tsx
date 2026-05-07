// src/components/Residents/ResidentKtpModal.tsx
import React from 'react';
import { X, Download } from "lucide-react";

interface ResidentKtpModalProps {
  isOpen: boolean;
  isLoading: boolean;
  imageUrl: string | null;
  error: string | null;
  residentId: number | null;
  onClose: () => void;
}

const ResidentKtpModal: React.FC<ResidentKtpModalProps> = ({
  isOpen,
  isLoading,
  imageUrl,
  error,
  residentId,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Pratinjau KTP</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex justify-center items-center min-h-[300px] bg-slate-100">
          {isLoading ? (
            <div className="flex flex-col items-center text-slate-500">
              <svg className="animate-spin h-8 w-8 mb-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Memuat foto KTP...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 font-medium text-center bg-red-50 px-6 py-4 rounded-md border border-red-200">
              {error}
            </div>
          ) : imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Foto KTP" 
              className="max-w-full max-h-[60vh] object-contain rounded border border-slate-300 shadow-sm"
            />
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
          {imageUrl && (
            <a 
              href={imageUrl} 
              download={`KTP_${residentId || 'warga'}.jpg`}
              className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download size={18} />
              Download
            </a>
          )}
          <button 
            onClick={onClose}
            className="bg-slate-200 text-slate-800 px-4 py-2 rounded font-medium hover:bg-slate-300 transition-colors"
          >
            <X size={16} />
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

export default ResidentKtpModal;
