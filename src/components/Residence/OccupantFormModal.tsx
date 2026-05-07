// src/components/Residence/OccupantFormModal.tsx
import React, { useState } from 'react';
import { X, Save } from "lucide-react";
import { AsyncPaginate } from 'react-select-async-paginate';
import Cookies from 'js-cookie';

export interface OccupantFormData {
  resident_id: string;
  occupant_type: 'tetap' | 'kontrak';
  is_primary_resident: boolean;
  move_in_date: string;
}

interface OccupantFormModalProps {
  isOpen: boolean;
  residenceId: string | number;
  onClose: () => void;
  onSuccess: () => void;
}

const OccupantFormModal: React.FC<OccupantFormModalProps> = ({
  isOpen,
  residenceId,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<OccupantFormData>({
    resident_id: '',
    occupant_type: 'tetap',
    is_primary_resident: false,
    move_in_date: new Date().toISOString().split('T')[0],
  });

  // State untuk menyimpan label yang terpilih agar tetap muncul di select
  const [selectedResident, setSelectedResident] = useState<any>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Fungsi untuk mencari warga dari API dengan dukungan paginasi (react-select-async-paginate)
  const loadResidents = async (searchQuery: string, _loadedOptions: any, { page }: any) => {
    try {
      const token = Cookies.get('access_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(`${apiUrl}/api/residents-select?q=${searchQuery}&page=${page}`, {
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
    } catch (err) {
      console.error("Error loading residents:", err);
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

      const response = await fetch(`${apiUrl}/api/residences/${residenceId}/occupants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Terjadi kesalahan saat menyimpan data.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Tambah Penghuni</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Pilih Warga</label>
            <AsyncPaginate
              value={selectedResident}
              loadOptions={loadResidents}
              additional={{ page: 1 }} // Mulai dari halaman 1
              onChange={(option: any) => {
                setSelectedResident(option);
                setFormData({ ...formData, resident_id: option?.value || '' });
              }}
              placeholder="Cari Nama atau NIK..."
              className="text-sm"
              classNamePrefix="react-select"
              noOptionsMessage={() => "Warga tidak ditemukan"}
              loadingMessage={() => "Mencari..."}
              debounceTimeout={500}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Tipe Penghuni</label>
            <select
              value={formData.occupant_type}
              onChange={(e) => setFormData({ ...formData, occupant_type: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
              required
            >
              <option value="tetap">Tetap</option>
              <option value="kontrak">Kontrak</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Tanggal Masuk</label>
            <input
              type="date"
              value={formData.move_in_date}
              onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-2 pb-4">
            <input
              type="checkbox"
              id="is_primary"
              checked={formData.is_primary_resident}
              onChange={(e) => setFormData({ ...formData, is_primary_resident: e.target.checked })}
              className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
            />
            <label htmlFor="is_primary" className="text-sm font-medium text-slate-700 cursor-pointer">
              Set sebagai Penghuni Utama
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
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
              className="bg-teal-600 text-white px-6 py-2 rounded font-medium hover:bg-teal-700 transition-colors shadow-sm disabled:bg-teal-400 flex items-center gap-2"
              disabled={isSaving || !formData.resident_id}
            >
              {isSaving ? 'Menyimpan...' : (
                <>
                  <Save size={18} />
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

export default OccupantFormModal;
