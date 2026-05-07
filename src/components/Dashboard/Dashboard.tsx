import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Users,
  Home as HomeIcon,
  Settings,
  Receipt,
  Loader2,
  Calendar,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface SummaryData {
  balance: number;
  total_income: number;
  total_expense: number;
  stats: {
    total_residences: number;
    total_residents: number;
  };
  active_settings: {
    fees: Array<{ id: number; name: string; amount: number; period: string }>;
    expenses: Array<{ id: number; name: string; amount: number; period: string }>;
  };
}

interface ChartItem {
  period: string;
  label: string;
  income: number;
  expense: number;
}

const Dashboard = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [chartLoading, setChartLoading] = useState<boolean>(true);
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState<string>(`${currentYear}-01`);
  const [endDate, setEndDate] = useState<string>(`${currentYear}-12`);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchChartData();
  }, [startDate, endDate]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('access_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/dashboard/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setSummary(result.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    setChartLoading(true);
    try {
      const token = Cookies.get('access_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/dashboard/chart?start_date=${startDate}-01&end_date=${endDate}-01`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setChartData(result.data.chart_data);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setChartLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && !summary) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard Keuangan</h1>
        <p className="text-slate-500 mt-1">Ringkasan operasional dan kondisi kas RT saat ini.</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Main Balance Card */}
        <div className="md:col-span-2 bg-teal-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[180px]">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Wallet size={120} />
          </div>
          <div className="relative z-10">
            <span className="text-teal-100 font-medium text-sm uppercase tracking-wider">Total Saldo Kas RT</span>
            <h2 className="text-4xl md:text-5xl font-black mt-2">{formatCurrency(summary?.balance || 0)}</h2>
          </div>
          <div className="relative z-10 flex gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <ArrowDownRight size={16} className="text-green-300" />
              </div>
              <div>
                <p className="text-[10px] text-teal-100 uppercase font-bold">Pemasukan</p>
                <p className="font-semibold text-sm">{formatCurrency(summary?.total_income || 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <ArrowUpRight size={16} className="text-red-300" />
              </div>
              <div>
                <p className="text-[10px] text-teal-100 uppercase font-bold">Pengeluaran</p>
                <p className="font-semibold text-sm">{formatCurrency(summary?.total_expense || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resident Stats */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 mb-4">
            <HomeIcon size={24} />
          </div>
          <div>
            <p className="text-slate-500 font-medium text-sm">Jumlah Rumah</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{summary?.stats.total_residences}</h3>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">Terdaftar Aktif</p>
        </div>

        {/* Resident Count */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
            <Users size={24} />
          </div>
          <div>
            <p className="text-slate-500 font-medium text-sm">Jumlah Warga</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{summary?.stats.total_residents}</h3>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">Warga Aktif</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Tren Arus Kas</h3>
              <p className="text-xs text-slate-400">Pemasukan vs Pengeluaran bulanan</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1 px-2">
              <Calendar size={14} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Periode</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-teal-400"
              />
              <span className="text-slate-300 text-xs">-</span>
              <input
                type="month"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-teal-400"
              />
            </div>
          </div>
        </div>

        <div className="h-[350px] w-full">
          {chartLoading ? (
            <div className="flex flex-col justify-center items-center h-full gap-2">
              <Loader2 className="animate-spin text-teal-600" size={24} />
              <p className="text-xs text-slate-400 font-medium italic">Mengolah data grafik...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                  labelStyle={{ marginBottom: '8px', color: '#1e293b', fontWeight: 800 }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 600 }} />
                <Bar
                  name="Pemasukan"
                  dataKey="income"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                  barSize={chartData.length > 12 ? 10 : 20}
                />
                <Bar
                  name="Pengeluaran"
                  dataKey="expense"
                  fill="#ef4444"
                  radius={[6, 6, 0, 0]}
                  barSize={chartData.length > 12 ? 10 : 20}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Settings Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Fee Settings */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Receipt size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Iuran Rutin Aktif</h3>
              <p className="text-xs text-slate-400">Pengumpulan iuran otomatis tiap bulan</p>
            </div>
          </div>
          <div className="space-y-4">
            {summary?.active_settings.fees.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Belum ada iuran rutin yang diaktifkan.</p>
            ) : (
              summary?.active_settings.fees.map((fee) => (
                <div key={fee.id} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">{fee.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{fee.period}</span>
                  </div>
                  <span className="text-teal-600 font-bold">{formatCurrency(fee.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Expense Settings */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Pengeluaran Rutin</h3>
              <p className="text-xs text-slate-400">Anggaran pengeluaran otomatis</p>
            </div>
          </div>
          <div className="space-y-4">
            {summary?.active_settings.expenses.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Belum ada pengeluaran rutin yang diaktifkan.</p>
            ) : (
              summary?.active_settings.expenses.map((exp) => (
                <div key={exp.id} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">{exp.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{exp.period}</span>
                  </div>
                  <span className="text-red-600 font-bold">{formatCurrency(exp.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;