# SiNotaris — Sistem Informasi Manajemen Notaris & Monitoring AJB

Aplikasi web full-stack untuk manajemen dokumen kantor notaris/PPAT dengan monitoring alur proses Akta Jual Beli (AJB) 8 tahapan. Dibangun dengan **Laravel 12 + React 18 (SPA) + MySQL 8 + Redis + Docker Compose**.

---

## Fitur Utama

### Portal Admin (Notaris / Staff)
- **Dashboard** — Statistik real-time, grafik tren, dan deadline mendatang
- **Manajemen Dokumen** — CRUD lengkap, timeline 5 tahapan, upload berkas, kode tracking
- **Monitoring AJB** — 8 tahapan terstandar (Data Masuk → Selesai di BPN), pencatatan penjual/pembeli/sertifikat/pajak
- **Manajemen Klien** — Database klien dengan riwayat dokumen
- **Laporan & Export** — Statistik, export PDF & Excel
- **Notifikasi** — Notifikasi internal & email otomatis ke klien
- **Manajemen Pengguna** — Kontrol peran (super-admin, notaris, staff, klien, kurir)
- **Pengaturan** — Konfigurasi kantor dan sistem

### Portal Klien
- **Dashboard** — Ringkasan status dokumen pribadi
- **Pelacakan Dokumen** — Progress real-time tahap demi tahap
- **Profil** — Edit info pribadi dan ubah password

### Halaman Publik
- **Beranda** — Landing page kantor
- **Lacak Dokumen** — Cek status dengan kode tracking (tanpa login)

---

## Stack Teknologi

| Komponen     | Teknologi                        |
|-------------|----------------------------------|
| Backend API  | PHP 8.3, Laravel 12, Sanctum 4.x |
| Frontend     | React 18.3, Vite 6, TailwindCSS 3 |
| Database     | MySQL 8.0                        |
| Cache/Queue  | Redis 7                          |
| Auth         | Laravel Sanctum (token)          |
| Roles        | Spatie Laravel Permission 6.x    |
| PDF Export   | DomPDF 2.x                       |
| Email        | Laravel Mail (SMTP/MailHog)      |
| Container    | Docker Compose                   |
| Node.js      | v24 LTS (≥24.x)                  |
| PHP          | 8.3                              |

---

## Prasyarat

- Docker Desktop (atau Docker Engine + Compose)
- Git

Alternatif tanpa Docker:
- PHP 8.3+, Composer 2, MySQL 8, Redis, Node.js 24+

---

## Cara Menjalankan (Docker — Disarankan)

### 1. Clone / Ekstrak Project

```bash
# Jika dari zip:
unzip sinotaris.zip && cd sinotaris

# Atau clone:
git clone <repo-url> sinotaris && cd sinotaris
```

### 2. Salin File Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Jalankan Docker Compose

```bash
docker-compose up -d
```

Tunggu 30-60 detik hingga semua service berjalan. Backend akan otomatis:
- Generate `APP_KEY`
- Menjalankan migrasi database
- Menjalankan seeder (data demo + akun default)
- Membuat symlink storage

### 4. Akses Aplikasi

| URL                          | Keterangan                    |
|-----------------------------|-------------------------------|
| http://localhost             | Aplikasi utama (via Nginx)    |
| http://localhost:3000        | Frontend langsung             |
| http://localhost:8000        | Backend API langsung          |
| http://localhost:8025        | MailHog (dev email viewer)    |
| http://localhost:8000/api/v1 | API endpoint                  |

---

## Cara Menjalankan (Tanpa Docker)

### Backend

```bash
cd backend

# Install dependencies
composer install

# Setup environment
cp .env.example .env
# Edit .env: sesuaikan DB_HOST, DB_USERNAME, DB_PASSWORD, REDIS_HOST

# Generate key
php artisan key:generate

# Migrasi & Seeder
php artisan migrate --seed

# Storage symlink
php artisan storage:link

# Jalankan server
php artisan serve --port=8000
```

### Frontend

```bash
cd frontend

# Install dependencies (butuh Node.js 24+)
npm install

# Setup environment
cp .env.example .env
# Edit: VITE_API_URL=http://localhost:8000/api/v1

# Jalankan dev server
npm run dev
```

---

## Akun Demo (Setelah Seeder Berjalan)

| Role        | Email                     | Password  | Akses                        |
|------------|---------------------------|-----------|------------------------------|
| Super Admin | admin@sinotaris.id        | password  | /admin — semua fitur         |
| Notaris     | notaris@sinotaris.id      | password  | /admin — tanpa user/setting/RBAC |
| Staff       | staff@sinotaris.id        | password  | /admin — tanpa user/setting/RBAC |
| Klien       | klien@sinotaris.id        | password  | /client — portal klien       |

---

## Struktur Project

```
sinotaris/
├── backend/                   # Laravel 12 API (PHP 8.3)
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── Auth/          # AuthController (login, logout, profil)
│   │   │   ├── Admin/         # Dashboard, Document, Ajb, Client, dll
│   │   │   └── Client/        # Portal klien
│   │   ├── Models/            # Eloquent models
│   │   └── Notifications/     # Email + DB notifications
│   ├── database/
│   │   ├── migrations/        # Skema database
│   │   └── seeders/           # Data awal
│   └── routes/api.php         # Semua API routes
├── frontend/                  # React 18 SPA (Node.js 24)
│   └── src/
│       ├── pages/
│       │   ├── admin/         # Dashboard, Documents, Ajb, dll
│       │   ├── client/        # Portal klien
│       │   └── public/        # Home, Track
│       ├── components/
│       │   └── layout/        # AdminLayout, ClientLayout
│       ├── services/api.js    # Axios wrapper (Sanctum auth)
│       └── stores/authStore.js # Zustand auth state
├── docker/
│   └── mysql/init.sql         # Database init script
├── nginx/default.conf         # Reverse proxy config
└── docker-compose.yml         # Orchestrasi semua service
```

---

## Database Schema (Ringkasan)

```
users               → Akun pengguna (semua role)
clients             → Profil klien (relasi ke user)
document_types      → Jenis dokumen (AJB, Hibah, dll)
documents           → Dokumen utama (+ kode tracking)
document_stages     → 5 tahapan tiap dokumen
document_files      → Berkas/lampiran per dokumen
ajb_cases           → Kasus AJB (relasi ke document)
ajb_sellers         → Data penjual per kasus AJB
ajb_buyers          → Data pembeli per kasus AJB
ajb_certificates    → Sertifikat tanah
ajb_tax_payments    → Pembayaran BPHTB/SSP/SPS
ajb_documents       → Dokumen pendukung AJB
ajb_steps           → 8 tahapan monitoring AJB
ajb_bpn_submissions → Data pengajuan BPN
notifications       → Notifikasi per user
activity_logs       → Audit trail semua aktivitas
system_settings     → Konfigurasi sistem
```

---

## API Endpoints (Ringkasan)

```
POST   /api/v1/auth/login            → Login
POST   /api/v1/auth/logout           → Logout
GET    /api/v1/auth/me               → Info user login
GET    /api/v1/track/:code           → Lacak dokumen (publik)

GET    /api/v1/admin/dashboard/stats → Statistik dashboard
GET    /api/v1/admin/documents       → Daftar dokumen
POST   /api/v1/admin/documents       → Buat dokumen
GET    /api/v1/admin/documents/:id   → Detail dokumen
PUT    /api/v1/admin/documents/:id/stage → Update tahapan

GET    /api/v1/admin/ajb             → Daftar kasus AJB
POST   /api/v1/admin/ajb             → Buat kasus AJB
PUT    /api/v1/admin/ajb/:id/step/:n → Update tahapan AJB
POST   /api/v1/admin/ajb/:id/tax-payment → Catat pembayaran pajak

GET    /api/v1/admin/clients         → Daftar klien
GET    /api/v1/admin/reports/*       → Laporan & export
GET    /api/v1/admin/users           → Manajemen user

GET    /api/v1/client/dashboard      → Dashboard klien
GET    /api/v1/client/documents      → Dokumen klien
```

---

## Alur Proses AJB (8 Tahapan)

| Tahap | Nama                          | Deskripsi                                 |
|-------|-------------------------------|-------------------------------------------|
| 1     | Data Masuk                    | Data penjual, pembeli, sertifikat masuk   |
| 2     | Cek Sertifikat                | Verifikasi keaslian sertifikat tanah      |
| 3     | Pembayaran Pajak (BPHTB & SSP)| Bayar pajak pembeli (BPHTB) & penjual    |
| 4     | Pembuatan Akta Jual Beli      | Penandatanganan akta oleh notaris/PPAT    |
| 5     | Input Akta AJB ke Sistem BPN  | Entry data di sistem BPN                  |
| 6     | Pengiriman Dokumen ke BPN     | Berkas fisik dikirim ke kantor BPN        |
| 7     | Proses di BPN                 | BPN memproses balik nama sertifikat       |
| 8     | Pembayaran SPS & Selesai      | Bayar SPS, sertifikat baru diserahkan     |

---

## Commands Berguna

```bash
# Melihat log semua service
docker-compose logs -f

# Masuk ke container backend
docker exec -it sinotaris_backend bash

# Jalankan ulang seeder
docker exec sinotaris_backend php artisan db:seed

# Rebuild container setelah perubahan
docker-compose up -d --build

# Hentikan semua service
docker-compose down

# Reset database (hapus semua data)
docker-compose down -v
docker-compose up -d
```

---

## Versi

| Komponen  | Versi   |
|-----------|---------|
| PHP       | 8.3     |
| Laravel   | 12.x    |
| Composer  | 2.8.x   |
| Node.js   | 24.x    |
| npm       | 10.x+   |
| MySQL     | 8.0     |
| Redis     | 7.x     |

---

© 2024 SiNotaris — Sistem Informasi Manajemen Notaris
