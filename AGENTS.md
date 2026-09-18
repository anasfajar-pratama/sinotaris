# AGENTS.md — SiNotaris

## Project Overview

SiNotaris = sistem informasi manajemen notaris/PPAT (monitoring dokumen & AJB).
Monorepo berisi beberapa direktori; **hanya 2 yang merupakan kode aktif**:

| Direktori | Peran | Repo git |
|-----------|-------|----------|
| `api-sinotaris/` | **Backend Laravel 12 API — KANONIK & LIVE** | ya, branch `aktordandokumen` |
| `frontend/` | **React 18 + Vite SPA — LIVE** | ya, branch `aktordandokumen` |
| `backend/` | Salinan LAMA parsial backend utk Docker. **TIDAK dipakai saat ini.** | bukan repo git |
| `docker/`, `nginx/`, `docker-compose.yml` | Docker setup lama (masih menunjuk `./backend`) | - |

- Frontend `.env` → `VITE_API_URL=http://localhost:8000/api/v1/`
- Backend `.env` (api-sinotaris) → MySQL `db_sinotaris` (127.0.0.1, root tanpa password)
- `catatan` (file di root, tanpa ekstensi) = daftar permintaan/status proses user — **baca file ini dulu** sebelum kerja.

## Cara Menjalankan (lokal, bukan Docker)

- Backend: `cd api-sinotaris && php artisan serve` (port 8000) — pakai PHP XAMPP
- Frontend: `cd frontend && npm run dev` (port 3000)
- Docker daemon biasanya TIDAK berjalan; docker-compose yang ada mengarah ke `backend/` yang ketinggalan zaman — jangan asumsikan Docker aktif.

## Konvensi & Arsitektur Penting

- Backend pakai **Spatie roles/permissions**. Route admin `role:super-admin|notaris|staff` + `permission:*`.
  - `GET /admin/employees` → daftar pegawai (non-klien, aktif) utk dropdown PIC. **Satu-satunya** sumber "master pegawai" yang boleh diakses staff.
  - `GET /admin/users` → manajemen user, HANYA super-admin|notaris (jangan dipakai utk dropdown PIC).
- Model dokumen:
  - `Document` → `stages` (DocumentStage), `actors`/`assets`/`orderDocuments` (data pihak & berkas), `files`.
  - `DocumentStage`: kolom `pic_id` (→ users), `handled_by`, `started_at`, `completed_at`, `sla_days`; relasi `pic`, `handler`, `documents` (StageDocument).
  - `StageDocument` (tabel `stage_documents`) = berkas pendukung per tahap; serialisasi punya `url`.
- Endpoint tahapan:
  - `PUT /admin/documents/{id}/stage` body `{stage_number, status(pending|in_progress|completed), notes, pic_id}`.
  - **Aturan timestamp**: `started_at` di-set hanya saat transisi status → in_progress; `completed_at` hanya saat transisi → completed. Update PIC/notes pd status sama TIDAK boleh menimpa timestamp.
  - **PIC terkunci setelah stage completed**: backend tolak (422) bila `pic_id` diubah pada stage berstatus `completed`; frontend tampilkan teks (bukan dropdown) utk stage selesai.
  - **Riwayat PIC / pindah tugas**: tabel `document_stage_pics` (model `DocumentStagePic`, relasi `picHistory` → JSON `pic_history`) mencatat tiap penugasan/pindah (`assigned`/`transferred` + user + assigner + note + assigned_at). Frontend: tombol "Pindah Tugas" + **tombol Simpan per stage** (1 submit utk notes+PIC, bukan auto-submit per ganti PIC).
  - `POST/DELETE /admin/documents/{id}/stages/{stageId}/documents(/{fileId})` → upload/hapus berkas pendukung tahap.
- Upload dokumen kelengkapan (Order/Pihak/Aset) TIDAK dibatasi status dokumen — tombol Upload/Ubah/Hapus & preview tetap tampil walau dokumen bukan draft.
- Dashboard admin punya filter **periode waktu** dalam satu card di ujung kanan (dropdown "Pilih Periode Waktu" + sub-input di dalam card): day (date YYYY-MM-DD), week (year+week 1-53), month (year+month), year. Backend `DashboardController@periodScope` menerapkannya ke stats/chart/activity; tren chart menyesuaikan (14 hari/8 minggu/6-12 bulan).
- Semua upload file lewat `App\Support\FileConverter::store()` → **gambar (jpg/png) dikonversi ke `.webp`**; pdf/docx disimpan apa adanya. `isImageUrl` di frontend harus dukung `.webp`.
- Model dokumen-berkas (`DocumentFile`, `OrderDocument`, `OrderActorDocument`, `OrderAssetDocument`, `StageDocument`) punya `$appends=['url']` + accessor `getUrlAttribute()` → `asset('storage/...')`.
- Frontend `src/services/api.js` mengekspor `storageUrl()` utk menormalisasi URL `/storage` ke origin backend.
- `Document::generateDocNumber()` & `generateTrackingCode()` memakai `withTrashed()` — nomor dokumen soft-deleted tetap dihitung agar tidak duplicate key.

## Status Pekerjaan (per 2026-09-03, BELUM di-commit)

Fitur catatan: PIC per tahap + pindah tugas & riwayat PIC + berkas pendukung + datetime mulai/selesai di Timeline Proses, dan filter periode waktu di Dashboard admin.

- Backend `api-sinotaris/` & frontend `frontend/` punya perubahan belum di-commit (branch `aktordandokumen`). JANGAN commit tanpa diminta user.
- Migrasi `2026_09_03_000002_create_document_stage_pics_table` sudah dijalankan.
- Sudah diverifikasi E2E: employees endpoint, set PIC, pindah tugas (riwayat), started/completed_at, upload/hapus stage documents, filter dashboard (day/week/month/year).
- Sisa potensial: `backend/` (Docker) belum disinkron; user belum memutuskan.

## Perintah Berguna

- Lint PHP: `php -l <file>` (dari `api-sinotaris/`)
- Cek migrasi: `php artisan migrate:status`
- Daftar route: `php artisan route:list`
- Build/cek frontend: Vite dev di `frontend/` (`npm run dev`); transform cek via `curl http://localhost:3000/src/pages/...`
- Login API test: `POST /api/v1/auth/login` `{email, password}` (akun demo `admin@sinotaris.id` / `password`); token dipakai header `Authorization: Bearer <token>`.
