// src/components/Fee/Fee/FeeList.tsx
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import TanStackTable from '../../Common/TanStackTable';
import { Plus, Edit, Trash2, Eye, TrendingUp } from 'lucide-react';
import Swal from 'sweetalert2';
import FeeFormModal, { type FeeFormData } from './FeeFormModal';
import FeeDetailModal from './FeeDetailModal';

interface Fee {
  id: number;
  name: string;
  amount: number;
  due_date: string;
  payments_count: number;
  paid_count: number;
  unpaid_count: number;
  setting?: {
    name: string;
  };
}

const FeeList = () => {
  const [data, setData] = useState<Fee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // State TanStack
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, 
    pageSize: 10,
  });

  // State Form Modal
  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
  }>({
    isOpen: false,
    mode: 'create',
    isLoading: false,
    isSaving: false,
    error: null,
  });

  // State Detail Modal
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    isLoading: boolean;
    data: any | null;
  }>({
    isOpen: false,
    isLoading: false,
    data: null,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FeeFormData>({
    name: '',
    amount: '',
    due_date: new Date().toISOString().split('T')[0],
  });

  // Debounce Pencarian
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setDebouncedFilter(globalFilter);
      if (globalFilter !== '') {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [globalFilter]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = Cookies.get('access_token');
        const apiUrl = import.meta.env.VITE_API_BASE_URL;

        const params = new URLSearchParams({
          draw: '1',
          start: (pagination.pageIndex * pagination.pageSize).toString(),
          length: pagination.pageSize.toString(),
          'search[value]': debouncedFilter,
        });

        const response = await fetch(`${apiUrl}/api/fees?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const result = await response.json();
        
        setData(result.data || []);
        setTotalRecords(result.recordsFiltered || 0); 

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pagination.pageIndex, pagination.pageSize, debouncedFilter, refreshTrigger]);

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  const handleIncidental = () => {
    setSelectedId(null);
    setFormData({
      name: '',
      amount: '',
      due_date: new Date().toISOString().split('T')[0],
    });
    setFormModal({
      isOpen: true,
      mode: 'create',
      isLoading: false,
      isSaving: false,
      error: null
    });
  };

  const handleEdit = (fee: Fee) => {
    setSelectedId(fee.id);
    setFormData({
      name: fee.name,
      amount: fee.amount,
      due_date: formatDateForInput(fee.due_date),
    });
    setFormModal({
      isOpen: true,
      mode: 'edit',
      isLoading: false,
      isSaving: false,
      error: null
    });
  };

  const handleShowDetail = async (id: number) => {
    setDetailModal({ isOpen: true, isLoading: true, data: null });
    try {
      const token = Cookies.get('access_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(`${apiUrl}/api/fees/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Gagal mengambil detail tagihan');

      const result = await response.json();
      setDetailModal({ isOpen: true, isLoading: false, data: result });
    } catch (error: any) {
      setDetailModal({ isOpen: true, isLoading: false, data: null });
      Swal.fire('Error', error.message, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = formModal.mode === 'edit';
    
    setFormModal(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      const token = Cookies.get('access_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;

      const url = isEdit 
        ? `${apiUrl}/api/fees/${selectedId}`
        : `${apiUrl}/api/fees/incidental`;

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
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
          throw new Error(firstError[0] || 'Terjadi kesalahan pada server');
        }
        throw new Error(result.message || 'Terjadi kesalahan pada server');
      }

      setRefreshTrigger(prev => prev + 1);
      setFormModal(prev => ({ ...prev, isOpen: false, isSaving: false }));
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: isEdit ? 'Tagihan berhasil diperbarui' : 'Tagihan dadakan berhasil dibuat',
        confirmButtonColor: '#2563eb',
      });
    } catch (error: any) {
      setFormModal(prev => ({ ...prev, isSaving: false, error: error.message }));
    }
  };

  const handleDelete = async (fee: Fee) => {
    if (fee.paid_count > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Tidak Dapat Menghapus',
        text: 'Tagihan ini sudah memiliki pembayaran yang lunas. Silakan batalkan pelunasan terlebih dahulu jika ingin menghapus.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Hapus Tagihan?',
      text: 'Seluruh data pembayaran yang berkaitan akan ikut terhapus.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const token = Cookies.get('access_token');
        const apiUrl = import.meta.env.VITE_API_BASE_URL;

        const response = await fetch(`${apiUrl}/api/fees/${fee.id}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });

        const resultData = await response.json();

        if (!response.ok) throw new Error(resultData.message || 'Gagal menghapus data');

        setRefreshTrigger(prev => prev + 1);
        Swal.fire('Berhasil!', 'Tagihan telah dihapus.', 'success');
      } catch (error: any) {
        Swal.fire('Gagal', error.message, 'error');
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const columns: ColumnDef<Fee>[] = [
    {
      accessorKey: 'name',
      header: 'Nama Tagihan',
      cell: (info) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{String(info.getValue())}</span>
          {info.row.original.setting && (
            <span className="text-[10px] text-slate-400 italic">Auto: {info.row.original.setting.name}</span>
          )}
        </div>
      ), 
    },
    {
      accessorKey: 'amount',
      header: 'Nominal',
      cell: (info) => (
        <span className="font-bold text-blue-600">
          {formatCurrency(Number(info.getValue()))}
        </span>
      ),
    },
    {
      accessorKey: 'due_date',
      header: 'Batas Waktu',
      cell: (info) => info.getValue() || '-', 
    },
    {
      id: 'summary',
      header: 'Progres Pembayaran',
      cell: ({ row }) => {
        const total = row.original.payments_count || 0;
        const paid = row.original.paid_count || 0;
        const percent = total > 0 ? Math.round((paid / total) * 100) : 0;
        
        return (
          <div className="w-full max-w-[150px] space-y-1">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-green-600">{paid} Lunas</span>
              <span className="text-slate-400">{total} Rumah</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${percent === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-[9px] text-right text-slate-500">{percent}% Selesai</p>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleShowDetail(row.original.id)}
            className="p-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
            title="Lihat Detail Pembayaran"
          >
            <Eye size={16} />
          </button>
          <button 
            onClick={() => handleEdit(row.original)}
            className="p-1.5 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
            title="Edit Tagihan"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => handleDelete(row.original)}
            className="p-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
            title="Hapus Tagihan"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Tagihan</h1>
          <p className="text-sm text-slate-500">Kelola riwayat tagihan dan pantau progres pembayaran warga.</p>
        </div>
        <button 
          onClick={handleIncidental}
          className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <TrendingUp size={20} />
          Buat Tagihan Dadakan
        </button>
      </div>
      
      <TanStackTable
        data={data}
        columns={columns}
        loading={loading}
        totalRecords={totalRecords}
        pagination={pagination}
        setPagination={setPagination}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />

      <FeeFormModal 
        isOpen={formModal.isOpen}
        mode={formModal.mode}
        isLoading={formModal.isLoading}
        isSaving={formModal.isSaving}
        error={formModal.error}
        formData={formData}
        onClose={() => setFormModal(prev => ({ ...prev, isOpen: false }))}
        onSubmit={handleSubmit}
        setFormData={setFormData}
      />

      <FeeDetailModal 
        isOpen={detailModal.isOpen}
        isLoading={detailModal.isLoading}
        fee={detailModal.data}
        onClose={() => setDetailModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default FeeList;
