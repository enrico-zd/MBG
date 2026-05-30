## Tujuan
Menyediakan UI end-to-end untuk MBG (MVP) agar user bisa: melihat beranda, membuat & memilih project, mengunggah asset gambar, membuat Ad Job, dan memantau status job/segment dengan tampilan tema dark + aksen ungu.

## Ruang Lingkup Halaman
- `/` (Home): ringkasan MBG + CTA untuk mulai.
- `/projects`: input `userEmail`, list project milik user, dan form buat project baru.
- `/projects/[projectId]`: detail project, list asset, upload asset, CTA menuju pembuatan Ad Job untuk project ini.
- `/ad-jobs` (Dashboard): pintasan cepat untuk membuat Ad Job + menampilkan jobs terakhir untuk project terpilih (mengikuti wireframe yang sudah ada).
- `/ad-jobs/new`: form lengkap pembuatan Ad Job.
- `/ad-jobs/[jobId]`: halaman status Ad Job dan status per-segmen.

## Alur Pengguna
1. User buka `/` lalu klik CTA ke `/projects`.
2. User isi `userEmail` (disimpan di localStorage) lalu buat/ pilih project.
3. Di `/projects/[projectId]`, user upload minimal 1 asset gambar.
4. User buat Ad Job lewat `/ad-jobs/new` (prefill `projectId` dari query) atau lewat `/ad-jobs` dashboard.
5. Setelah submit, UI redirect ke `/ad-jobs/[jobId]` dan melakukan polling status untuk update progress segment.

## Integrasi API
- Projects
  - GET `/api/projects?userEmail=...` → list project
  - POST `/api/projects` body `{ userEmail, title }` → create project
  - GET `/api/projects/[projectId]` → project + assets
  - PATCH `/api/projects/[projectId]` body `{ title }` → rename project (opsional)
- Assets
  - GET `/api/projects/[projectId]/assets` → list assets (opsional karena sudah include di project detail)
  - POST `/api/projects/[projectId]/assets` multipart field `file` → upload + derive 9:16
- Template packs
  - GET `/api/template-packs` → list packs
- Ad jobs
  - POST `/api/ad-jobs` body `{ userEmail, projectId, templatePackId, targetDurationSec, quality, params }` → create
  - GET `/api/ad-jobs?projectId=...&userEmail=...` → list jobs per project
  - GET `/api/ad-jobs/[jobId]?userEmail=...` → detail job + segments

## Struktur UI (Komponen)
- Root layout
  - Top navigation: Home, Projects, Ad Jobs
  - Global style: dark background, container max-width, card, button, badge status, responsive grid
- Reusable UI building blocks
  - `Container`, `Card`, `Button`, `Input`, `Select`, `Badge`, `ProgressBar`
- Client-side state
  - `userEmail`: disimpan di localStorage dan dipakai lintas halaman
  - `selectedProjectId`: disimpan di localStorage untuk memudahkan dashboard

## Desain Visual
- Tema: dark (background #0b0d12), teks terang, border halus, aksen ungu untuk CTA.
- Layout: desktop 2 kolom untuk dashboard /ad-jobs, mobile stacked.
- Status badge: queued/running/done dengan warna berbeda.

## Perilaku Halaman Status (Polling)
- `/ad-jobs/[jobId]` melakukan fetch awal lalu polling periodik untuk refresh status segmen.
- Tombol download tampil disabled sampai status job selesai; endpoint download belum tersedia sehingga UI menampilkan placeholder.

## Kriteria Selesai
- Semua route di atas dapat dibuka tanpa error.
- CRUD dasar (create project, upload asset, create ad job) berjalan dengan API yang sudah ada.
- Halaman status job menampilkan progress segment dan update via polling.
