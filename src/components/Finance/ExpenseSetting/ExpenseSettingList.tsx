import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import TanStackTable from '../../Common/TanStackTable';
import { PlusCircle, Edit, Trash2, Power } from 'lucide-react';
import Swal from 'sweetalert2';
import ExpenseSettingFormModal, { type ExpenseSettingFormData } from './ExpenseSettingFormModal';
import { useNavigate } from 'react-router-dom';

interface ExpenseSetting {
  id: number;
  name: string;
  amount: number;
  period: 'monthly' | 'yearly';
  is_active: boolean;
  cashbooks_count: number;
}

const ExpenseSettingList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ExpenseSetting[]>([]);
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

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [canChangePeriod, setCanChangePeriod] = useState<boolean>(true);
  const [formData, setFormData] = useState<ExpenseSettingFormData>({
    name: '',
    amount: '',
    period: 'monthly',
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

        const response = await fetch(`${apiUrl}/api/expense-settings?${params.toString()}`, {
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

  const handleAdd = () => {
    setSelectedId(null);
    setCanChangePeriod(true);
    setFormData({
      name: '',
      amount: '',
      period: 'monthly',
    });
    setFormModal({
      isOpen: true,
      mode: 'create',
      isLoading: false,
      isSaving: false,
      error: null
    });
  };

  const handleEdit = (setting: ExpenseSetting) => {
    setSelectedId(setting.id);
    setCanChangePeriod(setting.cashbooks_count === 0);
    setFormData({
      name: setting.name,
      amount: setting.amount.toString(),
      period: setting.period,
    });
    setFormModal({
      isOpen: true,
      mode: 'edit',
      isLoading: false,
      isSaving: false,
      error: null
    });
  };

  const handleToggleActive = async (setting: ExpenseSetting) => {
    const action = setting.is_active ? 'Nonaktifkan' : 'Aktifkan';
    
    const result = await Swal.fire({
      title: `${action} Pengaturan?`,
      text: `Pengaturan pengeluaran ini akan ${setting.is_active ? 'berhenti' : 'mulai'} dieksekusi secara otomatis.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: setting.is_active ? '#f59e0b' : '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: `Ya, ${action}`,
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const token = Cookies.get('access_token');
        const apiUrl = import.meta.env.VITE_API_BASE_URL;

        const response = await fetch(`${apiUrl}/api/expense-settings/${setting.id}/toggle-active`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });

        if (!response.ok) throw new Error('Gagal mengubah status');

        setRefreshTrigger(prev => prev + 1);
        Swal.fire('Berhasil!', `Status telah diubah.`, 'success');
      } catch (error: any) {
        Swal.fire('Gagal', error.message, 'error');
      }
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
        ? `${apiUrl}/api/expense-settings/${selectedId}`
        : `${apiUrl}/api/expense-settings`;

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
        if (response.status === 409) {
             throw new Error(result.message);
        }
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
        text: result.message,
        confirmButtonColor: '#2563eb',
      });
    } catch (error: any) {
      setFormModal(prev => ({ ...prev, isSaving: false, error: error.message }));
    }
  };

  const handleDelete = async (setting: ExpenseSetting) => {
    if (setting.cashbooks_count > 0) {
        Swal.fire({
          icon: 'error',
          title: 'Tidak Dapat Menghapus',
          text: 'Pengaturan ini tidak dapat dihapus karena sudah memiliki riwayat pengeluaran kas.',
          confirmButtonColor: '#2563eb',
        });
        return;
    }

    const result = await Swal.fire({
      title: 'Hapus Pengaturan?',
      text: 'Pengaturan pengeluaran rutin ini akan dihapus secara permanen.',
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

        const response = await fetch(`${apiUrl}/api/expense-settings/${setting.id}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });

        const resultData = await response.json();

        if (!response.ok) {
             if (response.status === 409) throw new Error(resultData.message);
             throw new Error(resultData.message || 'Gagal menghapus data');
        }

        setRefreshTrigger(prev => prev + 1);
        Swal.fire('Berhasil!', 'Pengaturan telah dihapus.', 'success');
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

  const columns: ColumnDef<ExpenseSetting>[] = [
    {
      accessorKey: 'name',
      header: 'Nama Pengeluaran',
      cell: (info) => (
        <span className="font-semibold text-slate-800">{String(info.getValue())}</span>
      ), 
    },
    {
      accessorKey: 'amount',
      header: 'Nominal',
      cell: (info) => (
        <span className="font-bold text-slate-700">
          {formatCurrency(Number(info.getValue()))}
        </span>
      ),
    },
    {
      accessorKey: 'period',
      header: 'Periode',
      cell: (info) => {
          const val = info.getValue() as string;
          return <span className="capitalize text-slate-600">{val === 'monthly' ? 'Bulanan' : 'Tahunan'}</span>
      }, 
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: (info) => {
        const isActive = info.getValue() as boolean;
        return (
          <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
            {isActive ? 'AKTIF' : 'NONAKTIF'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
           <button 
            onClick={() => handleToggleActive(row.original)}
            className={`p-1.5 rounded-md transition-colors ${row.original.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
            title={row.original.is_active ? 'Nonaktifkan' : 'Aktifkan'}
          >
            <Power size={16} />
          </button>
          <button 
            onClick={() => handleEdit(row.original)}
            className="p-1.5 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
            title="Edit Pengaturan"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => handleDelete(row.original)}
            className="p-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
            title="Hapus Pengaturan"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <button 
          onClick={() => navigate('/keuangan/pengeluaran')}
          className="text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
        >
          &larr; Kembali ke Pengeluaran
        </button>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pengaturan Pengeluaran Rutin</h1>
          <p className="text-sm text-slate-500">Atur jadwal pengeluaran otomatis untuk kas RT.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-teal-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <PlusCircle size={20} />
          Tambah Pengaturan
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

      <ExpenseSettingFormModal 
        isOpen={formModal.isOpen}
        mode={formModal.mode}
        isLoading={formModal.isLoading}
        isSaving={formModal.isSaving}
        error={formModal.error}
        formData={formData}
        canChangePeriod={canChangePeriod}
        onClose={() => setFormModal(prev => ({ ...prev, isOpen: false }))}
        onSubmit={handleSubmit}
        setFormData={setFormData}
      />
    </div>
  );
};

export default ExpenseSettingList;
