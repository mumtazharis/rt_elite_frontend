import React from 'react';
import { X, Save, Loader2 } from 'lucide-react';

export interface ExpenseSettingFormData {
  name: string;
  amount: string;
  period: 'monthly' | 'yearly';
}

interface Props {
  isOpen: boolean;
  mode: 'create' | 'edit';
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  formData: ExpenseSettingFormData;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  setFormData: React.Dispatch<React.SetStateAction<ExpenseSettingFormData>>;
  canChangePeriod?: boolean; // Dari backend: period cannot be changed if cashbook entries have been generated
}

const ExpenseSettingFormModal: React.FC<Props> = ({
  isOpen,
  mode,
  isLoading,
  isSaving,
  error,
  formData,
  onClose,
  onSubmit,
  setFormData,
  canChangePeriod = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {mode === 'create' ? 'Tambah Pengaturan Pengeluaran' : 'Edit Pengaturan Pengeluaran'}
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="animate-spin text-teal-500" size={32} />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Nama Pengeluaran
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Gaji Satpam"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Nominal
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-medium sm:text-sm">Rp</span>
                  </div>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow text-sm"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Periode
                </label>
                <select
                  required
                  disabled={!canChangePeriod}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow text-sm disabled:bg-slate-100 disabled:text-slate-500"
                  value={formData.period}
                  onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value as 'monthly' | 'yearly' }))}
                >
                  <option value="monthly">Bulanan</option>
                  <option value="yearly">Tahunan</option>
                </select>
                {!canChangePeriod && (
                    <p className="text-xs text-amber-600 mt-1">Periode tidak dapat diubah karena pengaturan ini sudah digunakan dalam transaksi kas.</p>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-teal-200"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Simpan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseSettingFormModal;
