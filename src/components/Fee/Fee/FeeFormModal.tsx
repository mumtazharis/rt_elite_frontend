// src/components/Fee/Fee/FeeFormModal.tsx
import React, { useState, useEffect } from 'react';
import { X } from "lucide-react";
import { AsyncPaginate } from 'react-select-async-paginate';
import Cookies from 'js-cookie';

export interface FeeFormData {
  name: string;
  amount: number | string;
  due_date: string;
  residence_ids: number[];
}

interface ResidenceOption {
  value: number;
  label: string;
}

interface FeeFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit'; // create for incidental
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  formData: FeeFormData;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  setFormData: React.Dispatch<React.SetStateAction<FeeFormData>>;
}

const FeeFormModal: React.FC<FeeFormModalProps> = ({
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
  const [selectedResidences, setSelectedResidences] = useState<ResidenceOption[]>([]);

  // Reset selectedResidences when modal opens/closes or formData changes
  useEffect(() => {
    if (!isOpen) {
      setSelectedResidences([]);
    }
  }, [isOpen]);

  const loadResidenceOptions = async (search: string, _prevOptions: any, { page }: any) => {
    try {
      const token = Cookies.get('access_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(`${apiUrl}/api/residences/select?q=${search}&page=${page}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();

      return {
        options: result.data,
        hasMore: result.has_more,
        additional: {
          page: page + 1,
        },
      };
    } catch (error) {
      console.error("Error loading residences:", error);
      return {
        options: [],
        hasMore: false,
      };
    }
  };

  const handleResidenceChange = (selectedOptions: any) => {
    const options = selectedOptions as ResidenceOption[] || [];
    setSelectedResidences(options);
    setFormData(prev => ({
      ...prev,
      residence_ids: options.map(opt => opt.value)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">
            {mode === 'edit' ? 'Edit Data Tagihan' : 'Buat Tagihan Dadakan'}
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
            <form id="feeForm" onSubmit={onSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {mode !== 'edit' && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Tujuan Tagihan (Rumah)</label>
                    <AsyncPaginate
                      isMulti
                      value={selectedResidences}
                      loadOptions={loadResidenceOptions}
                      onChange={handleResidenceChange}
                      additional={{ page: 1 }}
                      placeholder="Semua Rumah (Kosongkan jika semua)"
                      noOptionsMessage={() => "Tidak ada rumah ditemukan"}
                      className="text-sm"
                      classNames={{
                        control: (state) => 
                          `border-slate-300 rounded-md shadow-sm transition-all ${
                            state.isFocused ? 'border-teal-500 ring-1 ring-teal-500' : 'hover:border-slate-400'
                          }`,
                        option: (state) =>
                          `cursor-pointer px-3 py-2 ${
                            state.isSelected 
                              ? 'bg-teal-600 text-white' 
                              : state.isFocused 
                                ? 'bg-teal-50 text-teal-900' 
                                : 'text-slate-700 hover:bg-slate-50'
                          }`,
                        multiValue: () => 'bg-teal-100 rounded-md m-1',
                        multiValueLabel: () => 'text-teal-800 text-xs px-2 py-1',
                        multiValueRemove: () => 'text-teal-600 hover:bg-teal-200 hover:text-teal-900 px-1 rounded-r-md cursor-pointer transition-colors',
                      }}
                    />
                  </div>
                  <div className="bg-teal-50 p-3 rounded-md text-xs text-teal-700 italic">
                    * Kosongkan pilihan rumah jika ingin membuat tagihan untuk <strong>semua</strong> rumah yang memiliki penghuni aktif.
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Nama Tagihan</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Contoh: Iuran Perbaikan Lampu Jalan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Jumlah (Rp)</label>
                <input 
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="Masukkan nominal"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Batas Waktu (Jatuh Tempo)</label>
                <input 
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                  required
                />
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
            form="feeForm"
            className="bg-teal-600 text-white px-6 py-2 rounded font-medium hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm disabled:bg-teal-400"
            disabled={isSaving || isLoading}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </>
            ) : mode === 'edit' ? 'Simpan Perubahan' : 'Buat Tagihan'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default FeeFormModal;
