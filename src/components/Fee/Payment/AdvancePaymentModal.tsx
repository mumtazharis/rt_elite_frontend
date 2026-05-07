// src/components/Fee/Payment/AdvancePaymentModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, Hash, Home, Receipt, CheckCircle } from "lucide-react";
import Cookies from 'js-cookie';
import { AsyncPaginate } from 'react-select-async-paginate';

interface FeeSetting {
  id: number;
  name: string;
  is_active: boolean | number;
}

interface ResidenceOption {
  value: number;
  label: string;
}

interface AdvancePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const AdvancePaymentModal: React.FC<AdvancePaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [feeSettings, setFeeSettings] = useState<FeeSetting[]>([]);
  const [selectedResidence, setSelectedResidence] = useState<ResidenceOption | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    residence_id: '',
    fee_setting_id: '',
    number_of_periods: 1,
    payment_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen]);

  const fetchDropdownData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = Cookies.get('access_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;

      // Fetch Fee Settings
      const resFeeSettings = await fetch(`${apiUrl}/api/fee-settings?length=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataFeeSettings = await resFeeSettings.json();

      setFeeSettings((dataFeeSettings.data || []).filter((s: FeeSetting) => s.is_active === true || s.is_active === 1));

    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      setError("Gagal memuat data pilihan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const token = Cookies.get('access_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(`${apiUrl}/api/payments/pay-advance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          const firstError = Object.values(result.errors)[0] as string[];
          throw new Error(firstError[0] || 'Gagal memproses pembayaran');
        }
        throw new Error(result.message || 'Gagal memproses pembayaran');
      }

      onSuccess(result.message || 'Pembayaran dimuka berhasil diproses.');
      setFormData({
        residence_id: '',
        fee_setting_id: '',
        number_of_periods: 1,
        payment_date: new Date().toISOString().split('T')[0],
      });
      setSelectedResidence(null);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="bg-teal-100 p-2 rounded-lg">
              <Receipt className="text-teal-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Bayar Dimuka</h3>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Advance Payment Entry</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all p-1.5 rounded-lg"
            disabled={isSaving}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <div className="animate-spin h-10 w-10 mb-4 border-4 border-teal-600 border-t-transparent rounded-full"></div>
              <span className="text-sm font-medium">Memuat data pilihan...</span>
            </div>
          ) : (
            <form id="advancePaymentForm" onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded shadow-sm text-sm flex items-start gap-2">
                  <X size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5">
                  <Home size={14} className="text-slate-400" />
                  Pilih Rumah
                </label>
                <AsyncPaginate
                  value={selectedResidence}
                  loadOptions={loadResidenceOptions}
                  additional={{ page: 1 }}
                  onChange={(option: any) => {
                    setSelectedResidence(option);
                    setFormData({ ...formData, residence_id: option?.value || '' });
                  }}
                  placeholder="Cari No. Rumah atau Nama Penghuni..."
                  className="text-sm font-medium"
                  classNamePrefix="react-select"
                  noOptionsMessage={() => "Rumah tidak ditemukan"}
                  loadingMessage={() => "Mencari..."}
                  debounceTimeout={500}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5">
                  <Receipt size={14} className="text-slate-400" />
                  Jenis Iuran
                </label>
                <select 
                  value={formData.fee_setting_id}
                  onChange={(e) => setFormData({...formData, fee_setting_id: e.target.value})}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none transition-all text-sm font-medium"
                  required
                >
                  <option value="">-- Pilih Jenis Iuran --</option>
                  {feeSettings.map(setting => (
                    <option key={setting.id} value={setting.id}>{setting.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5">
                    <Hash size={14} className="text-slate-400" />
                    Jumlah Periode
                  </label>
                  <input 
                    type="number"
                    min="1"
                    max="24"
                    value={formData.number_of_periods}
                    onChange={(e) => setFormData({...formData, number_of_periods: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none transition-all text-sm font-medium"
                    required
                  />
                  <p className="text-[10px] text-slate-500 font-medium">* Maksimal 24 periode</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    Tanggal Bayar
                  </label>
                  <input 
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none transition-all text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl">
                <p className="text-xs text-teal-700 leading-relaxed font-medium">
                  <strong>Info:</strong> Pembayaran ini akan otomatis men-generate tagihan untuk {formData.number_of_periods} periode (sesuai jadwal iuran) dan langsung menandainya sebagai lunas.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button 
            type="button"
            onClick={onClose}
            className="bg-white text-slate-600 border border-slate-200 px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-50 hover:text-slate-800 transition-all"
            disabled={isSaving}
          >
            Batal
          </button>
          <button 
            type="submit"
            form="advancePaymentForm"
            className="bg-teal-600 text-white px-8 py-2.5 rounded-lg font-bold text-sm hover:bg-teal-700 active:transform active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-teal-200 disabled:bg-teal-400 disabled:shadow-none"
            disabled={isSaving || isLoading}
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Proses Bayar
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdvancePaymentModal;
