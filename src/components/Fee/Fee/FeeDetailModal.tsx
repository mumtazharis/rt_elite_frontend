// src/components/Fee/Fee/FeeDetailModal.tsx
import React from 'react';
import { X, Search } from "lucide-react";

interface Payment {
  id: number;
  status: 'lunas' | 'belum_bayar';
  primary_resident_name: string | null;
  primary_resident_phone: string | null;
  residence: {
    house_number: string;
    address: string;
  };
}

interface FeeDetail {
  id: number;
  name: string;
  amount: number;
  due_date: string;
  payments: Payment[];
}

interface FeeDetailModalProps {
  isOpen: boolean;
  isLoading: boolean;
  fee: FeeDetail | null;
  onClose: () => void;
}

const FeeDetailModal: React.FC<FeeDetailModalProps> = ({
  isOpen,
  isLoading,
  fee,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  if (!isOpen) return null;

  const filteredPayments = fee?.payments.filter(p => 
    p.residence.house_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.primary_resident_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.primary_resident_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.status.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Detail Tagihan
            </h3>
            {fee && <p className="text-sm text-slate-500">{fee.name} - {formatCurrency(fee.amount)}</p>}
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <svg className="animate-spin h-8 w-8 mb-4 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Memuat data pembayaran...</span>
            </div>
          ) : fee ? (
            <div className="space-y-4">
              {/* Search in Modal */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Cari nomor rumah atau status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                    <tr>
                       <th className="px-4 py-3">No. Rumah</th>
                       <th className="px-4 py-3">Kepala Rumah</th>
                       <th className="px-4 py-3">No. Telepon</th>
                       <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.length > 0 ? filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-50">
                         <td className="px-4 py-3 font-medium text-slate-800">{payment.residence.house_number}</td>
                         <td className="px-4 py-3 text-slate-600 font-medium">{payment.primary_resident_name || <span className="text-slate-300 italic text-[10px]">Kosong</span>}</td>
                         <td className="px-4 py-3 text-slate-500 text-xs font-mono">{payment.primary_resident_phone || <span className="text-slate-300 italic text-[10px]">-</span>}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            payment.status === 'lunas' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {payment.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">Data tidak ditemukan</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">Gagal memuat data.</div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end bg-slate-50">
          <button 
            type="button"
            onClick={onClose}
            className="bg-slate-800 text-white px-6 py-2 rounded font-medium hover:bg-slate-900 transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

export default FeeDetailModal;
