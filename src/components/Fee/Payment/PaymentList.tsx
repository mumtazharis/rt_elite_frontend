// src/components/Fee/Payment/PaymentList.tsx
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import TanStackTable from '../../Common/TanStackTable';
import { CheckCircle, XCircle, Home, Receipt, PlusCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import AdvancePaymentModal from './AdvancePaymentModal';

interface Payment {
  id: number;
  status: 'lunas' | 'belum_bayar';
  payment_date: string | null;
  residence: {
    house_number: string;
    address: string;
  };
  primary_resident_name: string | null;
  primary_resident_phone: string | null;
  fee: {
    name: string;
    amount: number;
  };
  issued_at: string | null;
}

const PaymentList = () => {
  const [data, setData] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState<boolean>(false);

  // State TanStack
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Optional filter
  const [statusFilter, setStatusFilter] = useState<string>('');

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
          status: statusFilter,
        });

        const response = await fetch(`${apiUrl}/api/payments?${params.toString()}`, {
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
  }, [pagination.pageIndex, pagination.pageSize, debouncedFilter, refreshTrigger, statusFilter]);

  const handlePay = async (id: number) => {
    const { value: paymentDate } = await Swal.fire({
      title: 'Tandai Lunas?',
      text: 'Pilih tanggal pembayaran untuk pencatatan kas.',
      icon: 'question',
      input: 'date',
      inputValue: new Date().toISOString().split('T')[0],
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Lunas',
      cancelButtonText: 'Batal',
    });

    if (paymentDate) {
      try {
        const token = Cookies.get('access_token');
        const apiUrl = import.meta.env.VITE_API_BASE_URL;

        const response = await fetch(`${apiUrl}/api/payments/${id}/pay`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ payment_date: paymentDate })
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.message || 'Gagal memproses pembayaran');

        setRefreshTrigger(prev => prev + 1);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: result.message,
          confirmButtonColor: '#10b981',
        });
      } catch (error: any) {
        Swal.fire('Gagal', error.message, 'error');
      }
    }
  };

  const handleUnpay = async (id: number) => {
    const result = await Swal.fire({
      title: 'Batalkan Pelunasan?',
      text: 'Status akan kembali menjadi belum bayar dan catatan kas terkait akan dihapus.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Batalkan',
      cancelButtonText: 'Kembali'
    });

    if (result.isConfirmed) {
      try {
        const token = Cookies.get('access_token');
        const apiUrl = import.meta.env.VITE_API_BASE_URL;

        const response = await fetch(`${apiUrl}/api/payments/${id}/unpay`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });

        const resultData = await response.json();

        if (!response.ok) throw new Error(resultData.message || 'Gagal membatalkan pelunasan');

        setRefreshTrigger(prev => prev + 1);
        Swal.fire('Berhasil!', 'Pelunasan telah dibatalkan.', 'success');
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

  const columns: ColumnDef<Payment>[] = [
    {
      id: 'residence',
      header: 'Rumah',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1 font-semibold text-slate-800">
            <Home size={14} className="text-slate-400" />
            <span>No. {row.original.residence.house_number}</span>
          </div>
          <span className="text-[10px] text-slate-400 line-clamp-1">{row.original.residence.address}</span>
        </div>
      ),
    },
    {
      id: 'primary_resident',
      header: 'Kepala Rumah',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-700 text-sm">{row.original.primary_resident_name || <span className="text-slate-300 italic">Kosong</span>}</span>
          <span className="text-[10px] text-slate-500 font-mono">{row.original.primary_resident_phone || '-'}</span>
        </div>
      ),
    },
    {
      id: 'fee',
      header: 'Tagihan',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1 font-medium text-slate-700 text-sm">
            <Receipt size={14} className="text-slate-400" />
            <span>{row.original.fee.name}</span>
          </div>
          <span className="text-xs font-bold text-blue-600">{formatCurrency(row.original.fee.amount)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'issued_at',
      header: 'Tgl Tagihan',
      cell: (info) => info.getValue() || <span className="text-slate-300 italic">-</span>,
    },
    {
      accessorKey: 'payment_date',
      header: 'Tgl Bayar',
      cell: (info) => info.getValue() || <span className="text-slate-300 italic">-</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info) => {
        const val = info.getValue() as string;
        const isLunas = val === 'lunas';
        return (
          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isLunas ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {val.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const isLunas = row.original.status === 'lunas';
        return (
          <div className="flex items-center gap-2">
            {!isLunas ? (
              <button
                onClick={() => handlePay(row.original.id)}
                className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-md hover:bg-green-100 transition-colors text-xs font-bold border border-green-200"
              >
                <CheckCircle size={14} />
                Tandai Lunas
              </button>
            ) : (
              <button
                onClick={() => handleUnpay(row.original.id)}
                className="flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors text-xs font-bold border border-red-200"
              >
                <XCircle size={14} />
                Batalkan
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pembayaran Iuran</h1>
          <p className="text-sm text-slate-500">Catat pembayaran masuk dari warga secara real-time.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAdvanceModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all text-sm shadow-md shadow-blue-100"
          >
            <PlusCircle size={18} />
            Bayar Dimuka
          </button>

          <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${statusFilter === '' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter('lunas')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${statusFilter === 'lunas' ? 'bg-green-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Lunas
            </button>
            <button
              onClick={() => setStatusFilter('belum_bayar')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${statusFilter === 'belum_bayar' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Belum Bayar
            </button>
          </div>
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

      <AdvancePaymentModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        onSuccess={(message) => {
          setRefreshTrigger(prev => prev + 1);
          Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: message,
            confirmButtonColor: '#10b981',
          });
        }}
      />
    </div>
  );
};

export default PaymentList;
