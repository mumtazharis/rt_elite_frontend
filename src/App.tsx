// src/App.tsx
import { useState, useEffect } from 'react';
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
        await fetch(`${apiUrl}/api/auth/logout`, {
          method: 'POST',
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

  // Interceptor untuk menangani Token Expired (401)
  useEffect(() => {
    const originalFetch = window.fetch;
    let isRefreshing = false;
    let refreshSubscribers: ((token: string | null) => void)[] = [];

    const subscribeTokenRefresh = (cb: (token: string | null) => void) => {
      refreshSubscribers.push(cb);
    };

    const onRefreshed = (token: string | null) => {
      refreshSubscribers.forEach((cb) => cb(token));
      refreshSubscribers = [];
    };

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 401) {
        const requestUrl = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;

        // Jangan intercept jika request adalah login atau refresh itu sendiri
        if (requestUrl.includes('/auth/login') || requestUrl.includes('/refresh')) {
          return response;
        }

        const token = Cookies.get('access_token');
        if (!token) {
          handleLogout();
          return response;
        }

        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const apiUrl = import.meta.env.VITE_API_BASE_URL;
            const refreshResponse = await originalFetch(`${apiUrl}/api/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });

            if (refreshResponse.ok) {
              const data = await refreshResponse.json();
              const newToken = data.access_token || data.token;

              if (newToken) {
                Cookies.set('access_token', newToken, { 
                  expires: 1 / 24, // 1 jam
                  sameSite: 'Lax'
                });
                isRefreshing = false;
                onRefreshed(newToken);
              } else {
                throw new Error('Token not found in response');
              }
            } else {
              throw new Error('Refresh failed');
            }
          } catch (error) {
            console.error('Token refresh failed:', error);
            isRefreshing = false;
            onRefreshed(null); // Beri tahu request yang antri bahwa refresh gagal
            handleLogout();
            return response;
          }
        }

        // Tunggu sampai refresh token selesai, lalu ulangi request aslinya
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string | null) => {
            if (!newToken) {
              resolve(response); // Jika refresh gagal, kembalikan response 401 asli
              return;
            }

            let modifiedArgs = [...args];
            if (typeof modifiedArgs[0] === 'string') {
              const url = modifiedArgs[0];
              const options = (modifiedArgs[1] || {}) as RequestInit;
              const headers = new Headers(options.headers || {});
              headers.set('Authorization', `Bearer ${newToken}`);
              options.headers = headers;
              resolve(originalFetch(url, options));
            } else {
              const req = modifiedArgs[0] as Request;
              const headers = new Headers(req.headers);
              headers.set('Authorization', `Bearer ${newToken}`);
              
              resolve(originalFetch(req.url, {
                method: req.method,
                headers: headers,
                body: req.body, // Hanya aman jika body tidak ter-consume (biasanya string JSON)
                mode: req.mode,
                credentials: req.credentials,
                cache: req.cache,
                redirect: req.redirect,
                referrer: req.referrer,
                referrerPolicy: req.referrerPolicy,
              }));
            }
          });
        });
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch; // Kembalikan fetch asli saat komponen di-unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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