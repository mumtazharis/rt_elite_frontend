// src/App.tsx
import { useState } from 'react';
import Cookies from 'js-cookie'; // Import js-cookie
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Login from './components/Login/Login';
import ResidentList from './components/Residents/ResidentList';
import ResidenceList from './components/Residence/ResidenceList';
import ResidenceDetail from './components/Residence/ResidenceDetail';
import Dashboard from './components/Dashboard/Dashboard';
import FeeSettingList from './components/Fee/Setting/FeeSettingList';
import FeeList from './components/Fee/Fee/FeeList';
import PaymentList from './components/Fee/Payment/PaymentList';

// Finance Components
import FinanceSummary from './components/Finance/Summary/FinanceSummary';
import IncomeList from './components/Finance/Income/IncomeList';
import ExpenseList from './components/Finance/Expense/ExpenseList';
import ExpenseSettingList from './components/Finance/ExpenseSetting/ExpenseSettingList';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(Cookies.get('access_token')));

  // Fungsi Logout
  const handleLogout = async () => {
    try {
      // 1. Ambil token dari cookies
      const token = Cookies.get('access_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      // 2. Jika token ada, panggil API logout
      if (token) {
        await fetch(`${apiUrl}`, {
          method: 'POST', // Endpoint logout biasanya menggunakan POST
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}` // Sertakan token agar backend tahu siapa yang logout
          }
        });
      }
    } catch (error) {
      // Log error jika koneksi gagal, tapi tetap lanjutkan proses hapus data lokal
      console.error('Gagal melakukan logout di server:', error);
    } finally {
      // 3. Pastikan data lokal selalu dihapus, terlepas dari API berhasil atau gagal (misal: internet putus)
      Cookies.remove('access_token');
      localStorage.removeItem('user_data');

      // 4. Kembalikan ke halaman login
      setIsAuthenticated(false);
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <Router>
      <Layout onLogout={handleLogout}>
        <Routes>
          {/* Default Route: Redirect ke /dashboard jika url hanya / */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Daftar Halaman */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/warga" element={<ResidentList />} />
          <Route path="/rumah" element={<ResidenceList />} />
          <Route path="/rumah/:id" element={<ResidenceDetail />} />
          {/* Route halaman yang belum dibuat */}
          <Route path="/iuran/setting" element={<FeeSettingList />} />
          <Route path="/iuran/tagihan" element={<FeeList />} />
          <Route path="/iuran/pembayaran" element={<PaymentList />} />
          
          <Route path="/keuangan/ringkasan" element={<FinanceSummary />} />
          <Route path="/keuangan/pemasukan" element={<IncomeList />} />
          <Route path="/keuangan/pengeluaran" element={<ExpenseList />} />
          <Route path="/keuangan/pengeluaran/setting" element={<ExpenseSettingList />} />

          {/* Halaman 404 jika URL tidak ditemukan */}
          <Route path="*" element={<div className="text-center mt-10 text-xl font-bold">404 - Halaman Tidak Ditemukan</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;