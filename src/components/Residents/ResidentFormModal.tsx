// src/components/Residents/ResidentFormModal.tsx
import React from 'react';
import { X, Save, PlusCircle } from "lucide-react";

export interface ResidentFormData {
  nik: string;
  full_name: string;
  phone_number: string;
  marriage_status: string;
  ktp: File | null;
  hasCurrentKtp: boolean;
  currentKtpUrl: string | null;
  removeKtp: boolean;
}

interface ResidentFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  formData: ResidentFormData;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  setFormData: React.Dispatch<React.SetStateAction<ResidentFormData>>;
}

const ResidentFormModal: React.FC<ResidentFormModalProps> = ({
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">
            {mode === 'edit' ? 'Edit Data Warga' : 'Tambah Warga Baru'}
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
              <span>Memuat data warga...</span>
            </div>
          ) : (
            <form id="residentForm" onSubmit={onSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* 2 Column Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">NIK</label>
                  <input
                    type="text"
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">No. HP</label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Status Pernikahan</label>
                  <select
                    value={formData.marriage_status}
                    onChange={(e) => setFormData({ ...formData, marriage_status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                    required
                  >
                    <option value="belum_menikah">Belum Menikah</option>
                    <option value="menikah">Menikah</option>
                  </select>
                </div>
              </div>

              {/* KTP Field (Full Width) */}
              <div className="pt-4 border-t border-slate-100">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 block">Foto KTP</label>

                  {/* Current KTP Display */}
                  {formData.hasCurrentKtp && !formData.removeKtp && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {formData.currentKtpUrl ? (
                          <img src={formData.currentKtpUrl} alt="Current KTP" className="w-20 h-14 object-cover rounded border border-slate-300 shadow-sm" />
                        ) : (
                          <div className="w-20 h-14 bg-slate-200 rounded flex items-center justify-center text-[10px] text-slate-500">No Image</div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-700">KTP Saat Ini Tersedia</p>
                          <p className="text-xs text-slate-500">File sudah tersimpan di server</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, removeKtp: true })}
                        className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 bg-red-50 hover:bg-red-100 rounded transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  )}

                  {/* Info if KTP is marked for removal */}
                  {formData.removeKtp && !formData.ktp && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-center justify-between">
                      <p className="text-sm text-amber-700">KTP akan dihapus setelah disimpan</p>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, removeKtp: false })}
                        className="text-amber-800 hover:underline text-xs"
                      >
                        Batalkan Hapus
                      </button>
                    </div>
                  )}

                  {/* Upload Area */}
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-slate-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                        </svg>
                        <p className="mb-2 text-sm text-slate-500">
                          <span className="font-semibold">{formData.ktp ? 'Ganti file' : 'Klik untuk upload baru'}</span>
                        </p>
                        <p className="text-xs text-slate-400">PNG, JPG atau JPEG (Maks. 2MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFormData({ ...formData, ktp: e.target.files[0], removeKtp: false });
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Preview for new file */}
                  {formData.ktp && (
                    <div className="mt-2 p-3 bg-teal-50 border border-teal-100 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-teal-600 p-2 rounded text-white">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-teal-800">File baru terpilih:</p>
                          <p className="text-xs text-teal-600 truncate max-w-[200px]">{formData.ktp.name}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, ktp: null })}
                        className="text-teal-800 hover:text-teal-900 text-xs font-bold"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>
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
            form="residentForm"
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
            ) : (
              <>
                {mode === 'edit' ? <Save size={18} /> : <PlusCircle size={18} />}
                {mode === 'edit' ? 'Simpan Perubahan' : 'Tambah Warga'}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ResidentFormModal;
