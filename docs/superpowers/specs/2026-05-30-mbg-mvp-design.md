# MBG (My Brand Gue) — MVP Design (PixVerse v6 Image-to-Video Ads Generator)

## 1) Ringkasan
MBG adalah web app untuk membuat video iklan produk (TikTok-first) dari 1–5 foto produk. Generasi video dilakukan via PixVerse v6 (image-to-video). Karena PixVerse v6 memiliki batas durasi 1–15 detik per request, MBG menghasilkan iklan 30–45 detik dengan cara membuat beberapa segmen (≤15s) lalu menggabungkan (stitch) segmen menjadi satu MP4 final (tanpa audio pada MVP).

Yang dimock pada MVP: credits internal MBG, billing/topup, template packs bisa berupa seed data sederhana.

## 2) Target Output MVP
- Platform: web app responsive
- Provider: PixVerse v6, image-to-video
- Durasi final: 30 detik dan 45 detik
- Rasio: 9:16 (dipaksa dengan pre-processing gambar menjadi canvas 9:16 sebelum upload ke PixVerse)
- Audio: off (generate segmen tanpa audio; output final tanpa audio)
- Workflow: upload assets → pilih template pack (mock) → isi offer/CTA → generate async → review → export MP4 + caption/hashtag (mock/rule-based)

## 3) Keputusan Teknis Kunci
### 3.1 9:16 untuk image-to-video v6
Karena parameter aspect ratio tidak tercantum pada endpoint image-to-video v6, MBG memaksa input menjadi 9:16:
- Buat “derived image” dari foto produk: letakkan foto asli di tengah, background blur/padding untuk mengisi canvas 9:16.
- Upload derived image ke PixVerse sehingga output cenderung mengikuti framing vertikal.

### 3.2 Durasi 30–45 detik via stitching
- 30 detik: 2 segmen × 15 detik
- 45 detik: 3 segmen × 15 detik
- Tiap segmen adalah request PixVerse terpisah, lalu di-stitch (concatenate) menjadi 1 video final.

### 3.3 Status async via polling worker
- Setelah create generate, PixVerse mengembalikan `video_id`.
- Worker MBG melakukan polling `GET /openapi/v2/video/result/{id}` hingga status terminal:
  - 1 = done (ada URL)
  - 7 = moderation failed
  - 8 = failed
- Polling memakai interval bertahap (backoff) dan TTL per segmen.

### 3.4 Mock yang tetap terukur
Walau credits MBG dimock, MBG tetap menghitung estimasi “biaya PixVerse credits” untuk transparansi dan kontrol biaya:
- v6 no-audio per detik: 360p=5, 540p=7, 720p=9, 1080p=18
- total_pixverse_credits = sum(durasi_segmen_detik × rate_quality)

## 4) Arsitektur Sistem (MVP)
### 4.1 Komponen
- Web App (Next.js)
  - UI wizard: upload → template pack → customize → generate → review → export
  - API routes (server actions / route handlers) untuk membuat project, upload asset, start job, lihat status, export
- Database (Postgres)
  - Menyimpan user, project, asset, parent job, segment job, output files, prompt
- Worker (Node.js process terpisah dari web)
  - Menangani queue: upload-to-pixverse, generate segment, poll status, download URL, stitch
- Object Storage (S3-compatible atau lokal untuk MVP)
  - Menyimpan asset user (private) dan output video segmen + final

### 4.2 Pola Queue
Queue sederhana berbasis Postgres:
- Tabel `tasks` berisi pekerjaan yang perlu dieksekusi worker.
- Worker mengambil task dengan locking (SKIP LOCKED), menandai progress, retry jika transient.

## 5) Flow End-to-End
### 5.1 Create Project & Upload Asset
1. User membuat project (atau quick-generate yang otomatis membuat project).
2. User upload 1–5 image.
3. Server menyimpan original image (private).
4. Server membuat derived 9:16 image untuk tiap image yang dipilih sebagai “hero”.

### 5.2 Start Generate (Parent Job)
1. User memilih template pack (mock) + mengisi field: productName, benefits, offer, CTA, tone, language.
2. Server membuat `ad_job` (parent) dengan `targetDuration=30|45`, `quality`, `audio=false`, `status=queued`.
3. Server membuat `ad_job_segments` sesuai target duration (2 atau 3 segmen), masing-masing status queued.
4. Server mengantrikan tasks untuk worker:
  - Upload derived image ke PixVerse → `img_id`
  - Generate segmen 1..N → `video_id`
  - Poll status segmen 1..N hingga done/failed
  - Stitch segmen jadi final

### 5.3 Polling Status ke UI
UI memanggil endpoint status internal MBG:
- parent job status + daftar segmen (status, progress)

### 5.4 Export
Saat parent job done:
- User bisa download final MP4 (signed URL)
- Caption + hashtag ditampilkan (mock/rule-based)

## 6) Integrasi PixVerse v6 (MVP)
### 6.1 Header Wajib
- `API-KEY`: dari PixVerse platform
- `Ai-trace-id`: UUID unik per request (jangan reuse)

### 6.2 Endpoint yang Dipakai
1) Upload image:
- `POST https://app-api.pixverse.ai/openapi/v2/image/upload`
- output: `img_id`, `img_url`

2) Generate image-to-video:
- `POST https://app-api.pixverse.ai/openapi/v2/video/img/generate`
- input minimal: `duration`, `img_id`, `model: "v6"`, `prompt`, `quality`, `generate_audio_switch:false`
- output: `video_id`

3) Get status/result:
- `GET https://app-api.pixverse.ai/openapi/v2/video/result/{id}`
- status: 1 done, 5 generating, 7 moderation failed, 8 failed
- output: `url` jika done

### 6.3 Prompt Strategy (Ads-first, Segment-based)
Struktur prompt dibuat per segmen dengan constraint yang jelas dan konsisten:
- Segmen 1 (Hook): fokus problem + curiosity + produk muncul cepat
- Segmen 2 (Proof/Benefit): 2–3 key benefits, visual detail produk
- Segmen 3 (Offer/CTA): offer, urgency, CTA jelas
Parameter dari form user disuntikkan ke template prompt. Template packs disimpan sebagai konfigurasi (mock seed).

## 7) Model Data (MVP)
### 7.1 Tabel
**users**
- id (uuid), email, created_at

**projects**
- id, user_id, title, created_at, updated_at

**assets**
- id, user_id, project_id
- original_url, derived_9x16_url
- mime_type, width, height, size_bytes
- created_at, deleted_at

**ad_jobs** (parent)
- id, user_id, project_id
- status: queued|running|done|failed|cancelled
- target_duration_sec: 30|45
- quality: 360p|540p|720p|1080p
- generate_audio: false (MVP)
- template_pack_id (mock string)
- params_json (offer/cta/language/tone/etc)
- estimated_pixverse_credits
- created_at, started_at, finished_at
- failure_code, failure_message

**ad_job_segments**
- id, ad_job_id, segment_index
- duration_sec (<=15)
- pixverse_img_id (nullable)
- pixverse_video_id (nullable)
- pixverse_status (nullable int)
- status: queued|uploading|generating|polling|done|failed
- prompt_final
- segment_video_url (storage URL)
- created_at, started_at, finished_at
- failure_code, failure_message

**tasks** (queue)
- id, type, payload_json
- status: queued|running|done|failed
- run_after (timestamp)
- attempts, last_error
- locked_at, locked_by
- created_at, updated_at

## 8) API Internal (MBG)
Format REST sederhana (MVP).

### 8.1 Auth
- `POST /api/auth/login` (mock email login atau implementasi minimal sesuai stack)

### 8.2 Project & Asset
- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects/:id/assets` (upload)

### 8.3 Template Packs (Mock)
- `GET /api/template-packs`

### 8.4 Generate Ads Job
- `POST /api/ad-jobs`
  - body: projectId, templatePackId, targetDurationSec(30/45), quality, fields
  - response: jobId
- `GET /api/ad-jobs/:id`
  - response: job + segments status
- `POST /api/ad-jobs/:id/cancel` (best-effort; mark cancelled; worker stop enqueue berikutnya)

### 8.5 Export
- `GET /api/ad-jobs/:id/download` → signed URL

## 9) Worker Behavior (MVP)
### 9.1 Task Types
- `pixverse.upload_image`
- `pixverse.generate_segment`
- `pixverse.poll_segment`
- `video.stitch_segments`

### 9.2 Retry Rules
- Transient (network/timeout): retry dengan backoff, max attempts
- Moderation failed (status 7): fail tanpa retry
- Generation failed (status 8): retry 1x opsional (MVP: 1x), lalu fail

### 9.3 TTL
- TTL per segmen: jika masih status 5 lewat batas waktu → fail segmen dan fail parent.

## 10) UI (MVP)
### 10.1 Screen
- Login (minimal)
- Dashboard: list project + “Create”
- Project detail: assets + list ad jobs
- Create ad job wizard:
  - Step 1 upload/select asset
  - Step 2 pilih template pack (mock)
  - Step 3 isi fields + pilih durasi (30/45) + quality + estimasi credits
  - Step 4 generating (progress segmen)
- Review: preview final, download, caption/hashtag

## 11) Security & Ops (MVP)
- Simpan PixVerse API key sebagai secret server-side (env var), tidak pernah ke browser.
- Semua asset user private; download via signed URL.
- Rate limit internal endpoint generate per user.
- Idempotency key untuk create job agar double submit tidak buat job ganda.

## 12) Testing (MVP)
- Unit: credits estimator, prompt builder, image 9:16 preprocessor
- Integration: create job → enqueue tasks → segment done → stitch done
- E2E (smoke): upload asset → generate 30s → download

## 13) Open Items (Non-blocking, bisa setelah MVP jalan)
- Webhook PixVerse untuk replace polling
- Audio strategy (bgm/sfx) + stitching audio
- Team/workspace, billing real, admin dashboard
