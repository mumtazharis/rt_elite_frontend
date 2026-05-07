// src/components/Fee/Setting/FeeSettingFormModal.tsx
import React from 'react';
import { X } from "lucide-react";

export interface FeeSettingFormData {
  name: string;
  amount: number | string;
  period: 'monthly' | 'yearly' | 'incidental';
  due_date: string;
}

interface FeeSettingFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  formData: FeeSettingFormData;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  setFormData: React.Dispatch<React.SetStateAction<FeeSettingFormData>>;
}

const FeeSettingFormModal: React.FC<FeeSettingFormModalProps> = ({
  isOpen,
  mode,
  isLoading,
  isSaving,
  error,
  formData,
  onClose,
  onSubmit,
  setFormData
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">
            {mode === 'edit' ? 'Edit Setting Iuran' : 'Tambah Setting Iuran'}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors p-1"
            disabled={isSaving}
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <svg className="animate-spin h-8 w-8 mb-4 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Memuat data...</span>
            </div>
          ) : (
            <form id="feeSettingForm" onSubmit={onSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Nama Iuran</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Contoh: Iuran Kebersihan Bulanan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Jumlah (Rp)</label>
                  <input 
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="Contoh: 50000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Periode</label>
                  <select 
                    value={formData.period}
                    onChange={(e) => setFormData({...formData, period: e.target.value as any})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                    required
                  >
                    <option value="monthly">Bulanan</option>
                    <option value="yearly">Tahunan</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Tanggal Jatuh Tempo Default</label>
                <input 
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                  required
                />
                <p className="text-[10px] text-slate-500 italic">* Untuk bulanan/tahunan, ini akan menentukan hari/tanggal setiap periodenya.</p>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
          <button 
            type="button"
            onClick={onClose}
            className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded font-medium hover:bg-slate-50 transition-colors"
            disabled={isSaving}
          >
            Batal
          </button>
          <button 
            type="submit"
            form="feeSettingForm"
            className="bg-teal-600 text-white px-6 py-2 rounded font-medium hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm disabled:bg-teal-400"
            disabled={isSaving || isLoading}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menyimpan...
              </>
            ) : mode === 'edit' ? 'Simpan Perubahan' : 'Tambah Setting'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default FeeSettingFormModal;
