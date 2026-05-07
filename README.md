# OptiDash - Optical Shop Management

OptiDash adalah aplikasi manajemen toko optik modern yang mencakup fitur POS (Point of Sale), Inventaris, Manajemen Pelanggan, dan Riwayat Resep.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: SQLite dengan Drizzle ORM
- **Auth**: Better Auth
- **UI**: Tailwind CSS, Shadcn UI, Base UI
- **Icons**: Lucide React

## Cara Setup di Lokal

1. **Clone repositori**
   ```bash
   git clone <url-repo-anda>
   cd optik-66
   ```

2. **Install dependensi**
   ```bash
   npm install
   ```

3. **Setup Environment Variables**
   Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Isi `BETTER_AUTH_SECRET` dengan string acak minimal 32 karakter.

4. **Inisialisasi Database**
   Jalankan perintah berikut untuk membuat file `sqlite.db` dan menyinkronkan skema tabel:
   ```bash
   npx drizzle-kit push
   ```

5. **Jalankan Aplikasi**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## Fitur Utama
- **Dashboard**: Ringkasan performa harian dan peringatan stok.
- **Transaksi (POS)**: Pencarian pelanggan dan barang yang cepat, serta cetak laporan.
- **Inventaris**: Manajemen stok Frame, Lensa, Softlens, dan Aksesoris.
- **Pelanggan & Resep**: Database pelanggan lengkap dengan riwayat resep OD/OS.
- **Laporan**: Cetak laporan penjualan bulanan/tahunan.
- **Dark Mode**: Dukungan tema gelap dengan palet amber yang nyaman.
