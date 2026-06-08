### Product Requirements Document (PRD): OptiDash

**Fase:** V1.0 (Single Store & Single Role)

---

### A. Tujuan Produk
Membangun sistem informasi pengelolaan toko kacamata yang menyederhanakan pencatatan stok, riwayat resep pelanggan, dan transaksi harian bagi staf, serta menghasilkan laporan bulanan yang akurat dan rapi dalam format *hardcopy* untuk pemilik toko.

### B. Pengguna / Aktor
*   **Staf Toko (Single User):** Pengguna tunggal yang melakukan seluruh operasional input data harian dan mencetak laporan bulanan.

---

### C. App Flow (Alur Aplikasi)
*   **Autentikasi (Login):** Staf masuk menggunakan satu akun kredensial.
*   **Dashboard Utama:** Staf melihat ringkasan transaksi harian dan daftar stok menipis.
*   **Penanganan Transaksi:** Staf memasukkan data pelanggan, resep mata, item pesanan, dan memproses pembayaran.
*   **Manajemen Inventaris:** Staf memperbarui stok barang masuk atau mengubah detail item.
*   **Pembuatan Laporan:** Staf memilih rentang waktu dan mencetak laporan bulanan berformat *hardcopy*.

---

### D. Core Features (Fitur Utama)
*   **Manajemen Transaksi (POS):** Pencatatan penjualan dengan kalkulasi subtotal, diskon, total, dan status pembayaran.
*   **Rekam Medis Kacamata:** Formulir penyimpanan ukuran resep mata pelanggan.
*   **Manajemen Inventaris:** Sistem CRUD untuk stok Frame, Lensa, Softlens, dan Aksesoris.
*   **Peringatan Stok Rendah:** Indikator visual otomatis untuk barang yang hampir habis.
*   **Generator Laporan:** Rekapitulasi penjualan dan pergerakan stok dengan tampilan yang dikhususkan untuk mesin cetak.

---

### E. Persyaratan Fungsional (Functional Requirements)

| Modul | Deskripsi Kebutuhan |
| :--- | :--- |
| **Autentikasi** | Halaman login tunggal dengan Better Auth tanpa fitur registrasi publik. |
| **Dashboard** | Menampilkan total pendapatan harian dan peringatan stok di bawah 5 item. |
| **Pelanggan & Resep** | Menyimpan profil pelanggan dan detail resep mata (OD/OS: SPH, CYL, AXIS, ADD, Visus; serta jarak pupil/PD). |
| **Inventaris** | Menambah, mengedit, menghapus, dan melihat barang (SKU, Nama, Kategori, Harga, Stok). Pengurangan stok terjadi otomatis setelah transaksi. |
| **Transaksi** | Membuat nota otomatis, menautkan pelanggan/resep, dan menampung banyak item dalam satu pesanan. |
| **Pelaporan** | Filter bulan/tahun untuk menarik data pendapatan, transaksi, dan mutasi stok. Menyediakan antarmuka cetak bersih. |

---

### F. Persyaratan Non-Fungsional (Non-Functional Requirements)
*   **UI/UX:** Antarmuka sederhana tanpa submenu kompleks, memanfaatkan navigasi *sidebar* datar.
*   **Performa:** Waktu respons interaksi halaman dan penyimpanan data di bawah 1 detik.
*   **Keamanan:** Enkripsi *password* staf di *database* dan *auto-logout* untuk sesi *login* lewat Better Auth.

---

### G. Arsitektur Sistem (Client-Server 3-Tier)
*   **Presentation Tier (Frontend):** Next.js (React 19) dengan Tailwind CSS dan Shadcn UI untuk interaksi staf yang responsif.
*   **Application Tier (Backend):** Next.js API Routes (Route Handlers) terintegrasi dengan Better Auth untuk keamanan sesi dan Drizzle ORM untuk transaksi database.
*   **Data Tier (Database):** Database SQLite lokal (`sqlite.db`) untuk pengelolaan data relational (Users, Customers, Prescriptions, Inventory, Transactions).

---

### H. Aliran Data (Data Flow)

| Proses | Input | Pemrosesan (Backend) | Output |
| :--- | :--- | :--- | :--- |
| **Transaksi Harian** | Data pelanggan, resep mata, item pesanan | Menyimpan profil/resep, mencatat transaksi, mengurangi stok otomatis | Struk digital/nota rincian pesanan di layar |
| **Restock Barang** | SKU, nama, kategori, jumlah barang masuk | Validasi ketersediaan SKU, membuat entri baru atau menambah jumlah stok lama | Pembaruan tabel inventaris dan *dashboard* |
| **Cetak Laporan** | Parameter bulan dan tahun | Menarik data transaksi selesai, menghitung pendapatan bersih/kotor | Halaman HTML siap cetak untuk diserahkan ke pemilik |

---

### I. Batasan Desain (Design Constraints)
*   **Fokus Desktop:** Antarmuka dioptimalkan secara ketat untuk layar monitor berorientasi *landscape* (resolusi minimal 1366x768).
*   **Optimasi Cetak:** Aturan CSS `@media print` wajib diterapkan untuk menyembunyikan elemen UI (navigasi, tombol, *background*) sehingga laporan tercetak rapi dengan tinta hitam putih di kertas A4.
*   **Navigasi Minimalis:** *Sidebar* tunggal untuk mempercepat perpindahan staf antar modul operasional.
*   **Entri Cepat:** Urutan *tabindex* pada formulir disusun logis agar staf bisa berpindah antar kolom input menggunakan tombol `Tab` pada *keyboard*.

---

### J. Batasan Teknis (Technical Constraints)
*   **Lingkungan Eksekusi:** Harus berjalan mulus di *browser* standar (Chrome, Edge, Firefox) yang memiliki fitur dialog cetak bawaan yang stabil.
*   **Deployment:** Infrastruktur aplikasi harus mendukung penerapan secara lokal (*localhost*) di komputer toko atau via deployment hosting (Vercel) dengan integrasi database.
*   **Single-Tenancy:** Sistem berjalan murni tanpa sistem manajemen peran (Role-Based Access Control) yang kompleks.
