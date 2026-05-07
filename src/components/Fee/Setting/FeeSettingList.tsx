// src/components/Fee/Setting/FeeSettingList.tsx
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import TanStackTable from '../../Common/TanStackTable';
import { Edit, Trash2, Power, PlusCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import FeeSettingFormModal, { type FeeSettingFormData } from './FeeSettingFormModal';

interface FeeSetting {
  id: number;
  name: string;
  amount: number;
  period: 'monthly' | 'yearly' | 'incidental';
  due_date: string;
  is_active: boolean | number;
  fees_count: number;
}

const FeeSettingList = () => {
  const [data, setData] = useState<FeeSetting[]>([]);
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

  // State Modal
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
  const [formData, setFormData] = useState<FeeSettingFormData>({
    name: '',
    amount: '',
    period: 'monthly',
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

        const response = await fetch(`${apiUrl}/api/fee-settings?${params.toString()}`, {
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

  const handleAdd = () => {
    setSelectedId(null);
    setFormData({
      name: '',
      amount: '',
      period: 'monthly',
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

  const handleEdit = (setting: FeeSetting) => {
    setSelectedId(setting.id);
    setFormData({
      name: setting.name,
      amount: setting.amount,
      period: setting.period,
      due_date: formatDateForInput(setting.due_date),
    });
    setFormModal({
      isOpen: true,
      mode: 'edit',
      isLoading: false,
      isSaving: false,
      error: null
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = formModal.mode === 'edit';
    if (isEdit && !selectedId) return;

    setFormModal(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      const token = Cookies.get('access_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;

      const url = isEdit 
        ? `${apiUrl}/api/fee-settings/${selectedId}`
        : `${apiUrl}/api/fee-settings`;

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
        text: isEdit ? 'Setting iuran berhasil diperbarui' : 'Setting iuran berhasil ditambahkan',
        confirmButtonColor: '#2563eb',
      });
    } catch (error: any) {
      setFormModal(prev => ({ ...prev, isSaving: false, error: error.message }));
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean | number) => {
    const isActive = (currentStatus === true || currentStatus === 1);
    const action = isActive ? 'Nonaktifkan' : 'Aktifkan';
    
    const result = await Swal.fire({
      title: `${action} Setting Iuran?`,
      text: isActive 
        ? 'Setting yang tidak aktif tidak akan men-generate tagihan baru secara otomatis.'
        : 'Setting akan kembali aktif dan men-generate tagihan sesuai jadwal.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isActive ? '#ef4444' : '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: `Ya, ${action}`,
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const token = Cookies.get('access_token');
        const apiUrl = import.meta.env.VITE_API_BASE_URL;

        const response = await fetch(`${apiUrl}/api/fee-settings/${id}/toggle-active`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.message || 'Gagal mengubah status');

        setRefreshTrigger(prev => prev + 1);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: result.message,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      } catch (error: any) {
        Swal.fire('Gagal', error.message, 'error');
      }
    }
  };

  const handleDelete = async (setting: FeeSetting) => {
    if (setting.fees_count > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Tidak Dapat Menghapus',
        text: 'Setting iuran ini sudah pernah digunakan untuk generate tagihan. Silakan nonaktifkan saja jika tidak lagi digunakan.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Hapus Setting Iuran?',
      text: 'Data yang sudah dihapus tidak dapat dikembalikan.',
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

        const response = await fetch(`${apiUrl}/api/fee-settings/${setting.id}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });

        const resultData = await response.json();

        if (!response.ok) throw new Error(resultData.message || 'Gagal menghapus data');

        setRefreshTrigger(prev => prev + 1);
        Swal.fire('Berhasil!', 'Setting iuran telah dihapus.', 'success');
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

  const columns: ColumnDef<FeeSetting>[] = [
    {
      accessorKey: 'name',
      header: 'Nama Iuran',
      cell: (info) => info.getValue() || '-', 
    },
    {
      accessorKey: 'amount',
      header: 'Jumlah',
      cell: (info) => (
        <span className="font-semibold text-blue-700">
          {formatCurrency(Number(info.getValue()))}
        </span>
      ),
    },
    {
      accessorKey: 'period',
      header: 'Periode',
      cell: (info) => {
        const val = String(info.getValue());
        const labels: Record<string, string> = {
          monthly: 'Bulanan',
          yearly: 'Tahunan',
          incidental: 'Insidental'
        };
        return <span className="capitalize">{labels[val] || val}</span>;
      },
    },
    {
      accessorKey: 'due_date',
      header: 'Jatuh Tempo',
      cell: (info) => info.getValue() || '-', 
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: (info) => {
        const val = info.getValue();
        const isActive = (val === true || val === 1);
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isActive ? 'Aktif' : 'Non-Aktif'}
          </span>
        );
      },
    },
    {
      accessorKey: 'fees_count',
      header: 'Total Tagihan',
      cell: (info) => (
        <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-600">
          {Number(info.getValue())} Kali
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const isActive = (row.original.is_active === true || row.original.is_active === 1);
        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleToggleActive(row.original.id, row.original.is_active)}
              className={`p-1.5 rounded-md transition-colors ${isActive ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
              title={isActive ? "Nonaktifkan" : "Aktifkan"}
            >
              <Power size={16} />
            </button>
            <button 
              onClick={() => handleEdit(row.original)}
              className="p-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
              title="Edit"
            >
              <Edit size={16} />
            </button>
            <button 
              onClick={() => handleDelete(row.original)}
              className="p-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
              title="Hapus"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Setting Jadwal Iuran</h1>
        <button 
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <PlusCircle size={20} />
          Tambah Setting
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
        getRowClass={(row) => !(row.is_active === true || row.is_active === 1) ? 'opacity-60 grayscale-[0.5]' : ''}
      />

      <FeeSettingFormModal 
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
    </div>
  );
};

export default FeeSettingList;
