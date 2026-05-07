import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import TanStackTable from '../../Common/TanStackTable';
import { Wallet, ArrowDownRight, ArrowUpRight, Loader2, Calendar, Home, Receipt } from 'lucide-react';

interface SummaryData {
  total_income: number;
  total_expense: number;
  balance: number;
}

interface Cashbook {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  transaction_date: string;
  source: 'iuran' | 'pengeluaran_otomatis' | 'manual';
  payment?: {
    residence: {
      house_number: string;
    };
    fee: {
      name: string;
    }
  };
  expense_setting?: {
      name: string;
  };
}

const FinanceSummary = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalBalance, setTotalBalance] = useState<number>(0);

  const now = new Date();
  const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const lastDayOfMonth = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

  const [dateFrom, setDateFrom] = useState<string>(firstDayOfMonth);
  const [dateTo, setDateTo] = useState<string>(lastDayOfMonth);

  const [data, setData] = useState<Cashbook[]>([]);
  const [tableLoading, setTableLoading] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, 
    pageSize: 10,
  });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setDebouncedFilter(globalFilter);
      if (globalFilter !== '') {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [globalFilter]);

  useEffect(() => {
    fetchSummary();
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchTotalBalance();
  }, []);

  useEffect(() => {
    fetchTableData();
  }, [pagination.pageIndex, pagination.pageSize, debouncedFilter, dateFrom, dateTo]);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get('access_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;

      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await fetch(`${apiUrl}/api/cashbooks-summary?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Gagal mengambil data ringkasan');

      const result = await response.json();
      setSummary(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalBalance = async () => {
    try {
      const token = Cookies.get('access_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(`${apiUrl}/api/cashbooks/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Gagal mengambil saldo total');

      const result = await response.json();
      setTotalBalance(result.balance || 0);
    } catch (error) {
      console.error('Error fetching total balance:', error);
    }
  };

  const fetchTableData = async () => {
    setTableLoading(true);
    try {
      const token = Cookies.get('access_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;

      const params = new URLSearchParams({
        draw: '1',
        start: (pagination.pageIndex * pagination.pageSize).toString(),
        length: pagination.pageSize.toString(),
        'search[value]': debouncedFilter,
      });
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await fetch(`${apiUrl}/api/cashbooks?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Gagal mengambil data riwayat');

      const result = await response.json();
      setData(result.data || []);
      setTotalRecords(result.recordsFiltered || 0); 
    } catch (error) {
      console.error(error);
    } finally {
      setTableLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleResetFilter = () => {
    setDateFrom('');
    setDateTo('');
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
        if (entry.source === 'pengeluaran_otomatis' && entry.expense_setting) {
             return (
                 <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{entry.description}</span>
                    <span className="text-[10px] text-amber-600 uppercase tracking-wider font-bold mt-1">Otomatis ({entry.expense_setting.name})</span>
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
      accessorKey: 'type',
      header: 'Jenis',
      cell: (info) => {
          const type = info.getValue() as string;
          return <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span>
      }
    },
    {
      accessorKey: 'amount',
      header: 'Nominal',
      cell: (info) => {
          const type = info.row.original.type;
          return (
            <span className={`font-bold ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              {type === 'income' ? '+' : '-'} {formatCurrency(Number(info.getValue()))}
            </span>
          )
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ringkasan Keuangan</h1>
          <p className="text-sm text-slate-500">Pantau saldo kas dan arus uang RT.</p>
        </div>
        
        {/* Date Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 px-2">
                <Calendar size={16} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Periode:</span>
            </div>
            <input 
                type="date" 
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-sm px-2 py-1 rounded border border-slate-200 outline-none focus:border-blue-400"
            />
            <span className="text-slate-400 text-sm">-</span>
            <input 
                type="date" 
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-sm px-2 py-1 rounded border border-slate-200 outline-none focus:border-blue-400"
            />
            {(dateFrom || dateTo) && (
                 <button 
                    onClick={handleResetFilter}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2"
                 >
                    Reset
                 </button>
            )}
        </div>
      </div>

      {loading && !summary ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
            {error}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Saldo Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-20">
                <Wallet size={80} />
             </div>
             <div className="relative z-10">
                <h3 className="text-blue-100 font-medium text-sm mb-1">Total Saldo Kas</h3>
                <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
             </div>
          </div>

          {/* Income Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                  <ArrowDownRight size={24} />
              </div>
              <div>
                  <h3 className="text-slate-500 font-medium text-sm mb-1">Total Pemasukan</h3>
                  <p className="text-xl font-bold text-slate-800">{formatCurrency(summary.total_income)}</p>
              </div>
          </div>

          {/* Expense Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
                  <ArrowUpRight size={24} />
              </div>
              <div>
                  <h3 className="text-slate-500 font-medium text-sm mb-1">Total Pengeluaran</h3>
                  <p className="text-xl font-bold text-slate-800">{formatCurrency(summary.total_expense)}</p>
              </div>
          </div>
        </div>
      ) : null}

      <div className="mt-8">
         <h2 className="text-xl font-bold text-slate-800 mb-4">Riwayat Transaksi</h2>
         <TanStackTable
            data={data}
            columns={columns}
            loading={tableLoading}
            totalRecords={totalRecords}
            pagination={pagination}
            setPagination={setPagination}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
         />
      </div>

    </div>
  );
};

export default FinanceSummary;
