// src/App.tsx
import { useState } from 'react';
import Cookies from 'js-cookie'; // Import js-cookie
import Layout from './components/Layout/Layout';
import Login from './components/Login/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(Cookies.get('access_token')));

  // Fungsi Logout
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
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Selamat Datang di RT Elite!</h1>
        <button 
          onClick={handleLogout} 
          style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>
      <p>
        Anda telah berhasil masuk. Token Anda sekarang disimpan dengan aman di <strong>Cookies</strong>.
      </p>
    </Layout>
  );
}

export default App;