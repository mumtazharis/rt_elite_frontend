import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import TanStackTable from '../../Common/TanStackTable';
import { PlusCircle, Home, Receipt, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';
import ManualEntryFormModal, { type ManualEntryFormData } from '../Shared/ManualEntryFormModal';

interface Cashbook {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  transaction_date: string;
  source: 'iuran' | 'pengeluaran_otomatis' | 'manual';
  payment_id: number | null;
  expense_setting_id: number | null;
  payment?: {
    residence: {
      house_number: string;
      address: string;
    };
    fee: {
      name: string;
    }
  };
}

const IncomeList = () => {
  const [data, setData] = useState<Cashbook[]>([]);
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

  // Filter Tanggal (Default Bulan Ini)
  const now = new Date();
  const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const lastDayOfMonth = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

  const [dateFrom, setDateFrom] = useState<string>(firstDayOfMonth);
  const [dateTo, setDateTo] = useState<string>(lastDayOfMonth);

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
  const [formData, setFormData] = useState<ManualEntryFormData>({
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
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
          type: 'income',
        });
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);

        const response = await fetch(`${apiUrl}/api/cashbooks?${params.toString()}`, {
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
  }, [pagination.pageIndex, pagination.pageSize, debouncedFilter, refreshTrigger, dateFrom, dateTo]);

  const handleResetFilter = () => {
    setDateFrom('');
    setDateTo('');
  };

  const handleAddManual = () => {
    setSelectedId(null);
    setFormData({
      amount: '',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
    });
    setFormModal({
      isOpen: true,
      mode: 'create',
      isLoading: false,
      isSaving: false,
      error: null
    });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = formModal.mode === 'edit';
    
    setFormModal(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      const token = Cookies.get('access_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;

      const url = isEdit 
        ? `${apiUrl}/api/cashbooks/${selectedId}`
        : `${apiUrl}/api/cashbooks`;

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          type: 'income'
        })
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
        text: isEdit ? 'Pemasukan berhasil diperbarui' : 'Pemasukan manual berhasil dicatat',
        confirmButtonColor: '#2563eb',
      });
    } catch (error: any) {
      setFormModal(prev => ({ ...prev, isSaving: false, error: error.message }));
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const columns: ColumnDef<Cashbook>[] = [
    {
      accessorKey: 'transaction_date',
      header: 'Tanggal',
      cell: (info) => formatDate(info.getValue() as string), 
    },
    {
      accessorKey: 'description',
      header: 'Deskripsi',
      cell: (info) => {
        const entry = info.row.original;
        if (entry.source === 'iuran' && entry.payment) {
             return (
                 <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{entry.description}</span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            <Home size={10} /> No. {entry.payment.residence.house_number}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            <Receipt size={10} /> {entry.payment.fee.name}
                        </span>
                    </div>
                 </div>
             )
        }
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800">{String(info.getValue())}</span>
            <span className="text-[10px] text-blue-500 uppercase tracking-wider font-bold mt-1">Manual</span>
          </div>
        );
      }, 
    },
    {
      accessorKey: 'amount',
      header: 'Nominal',
      cell: (info) => (
        <span className="font-bold text-green-600">
          + {formatCurrency(Number(info.getValue()))}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Pemasukan</h1>
          <p className="text-sm text-slate-500">Pantau seluruh pemasukan kas dari iuran maupun manual.</p>
        </div>
        <button 
          onClick={handleAddManual}
          className="bg-green-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <PlusCircle size={20} />
          Tambah Pemasukan Manual
        </button>
      </div>

      {/* Date Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-2 bg-white p-3 rounded-xl shadow-sm border border-slate-100 w-fit">
          <div className="flex items-center gap-2 px-2 border-r border-slate-100 pr-4">
              <Calendar size={18} className="text-slate-400" />
              <span className="text-sm font-semibold text-slate-600">Filter Tanggal:</span>
          </div>
          <div className="flex items-center gap-2 pl-2">
              <input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="text-sm px-2 py-1.5 rounded border border-slate-200 outline-none focus:border-blue-400"
              />
              <span className="text-slate-400 text-sm">-</span>
              <input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="text-sm px-2 py-1.5 rounded border border-slate-200 outline-none focus:border-blue-400"
              />
              {(dateFrom || dateTo) && (
                   <button 
                      onClick={handleResetFilter}
                      className="ml-2 text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
                   >
                      Reset
                   </button>
              )}
          </div>
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

      <ManualEntryFormModal 
        isOpen={formModal.isOpen}
        mode={formModal.mode}
        type="income"
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

export default IncomeList;
