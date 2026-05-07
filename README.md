# RT Elite - Frontend (React)

Dokumen ini berisi panduan untuk mempersiapkan dan menjalankan frontend aplikasi RT Elite di lingkungan lokal (development).

## Persyaratan Sistem

Pastikan sistem Anda memenuhi persyaratan berikut sebelum menjalankan aplikasi:
- Node.js (disarankan versi 18 atau yang lebih baru)
- npm (Node Package Manager)

## Langkah-langkah Menjalankan Project

1. Lakukan clone `git clone https://github.com/mumtazharis/rt_elite_frontend` kemudian masuk ke direktori:
   `cd rt_elite_frontend`
2. Pastikan Anda berada di direktori frontend:
   `cd frontend/rt_elite_frontend`
3. Instal dependensi Node.js dengan menjalankan perintah:
   `npm install`
4. Buat file `.env` di dalam root direktori frontend dan tambahkan baris berikut agar frontend dapat terhubung dengan API backend (sesuaikan `http://127.0.0.1:8000`):
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000
   ```
   Pastikan backend Laravel Anda sudah berjalan di URL tersebut.
5. Jalankan development server untuk frontend:
   `npm run dev`
6. Server frontend akan berjalan dan dapat diakses melalui browser di alamat yang muncul di terminal (biasanya `http://localhost:5173`).
