# PRD Lengkap — SaaS AI Video Ads Generator (Credits-Based)
> Dokumen ini mendefinisikan produk “AI Video Ads Generator” yang fokus pada pembuatan video iklan siap posting (TikTok-first) dengan model monetisasi credits. Integrasi auto-post TikTok disiapkan sebagai **Phase 2**.
---
## 0) TL;DR
User upload aset produk → pilih template pack → app membangun prompt → generate video (async job) → review & buat variasi → export (MP4) → upload ke TikTok manual (MVP) → bayar via credits berdasarkan durasi/kualitas.
---
## 1) Latar Belakang & Problem
Banyak seller/UMKM kesulitan membuat konten iklan video yang:
1) cepat dibuat, 2) konsisten kualitasnya, 3) “format TikTok”, 4) bisa diulang/diiterasi, dan 5) biayanya terkontrol.
AI video generator ada, namun sering:
- output tidak terarah untuk “ads” (lebih cocok cinematic/random),
- user bingung prompt,
- tidak ada workflow variasi (A/B/C),
- export pack tidak siap posting,
- monetisasi tidak transparan (berapa biaya untuk durasi/preset).
Produk ini memecahkan itu dengan **template pack + prompt builder + workflow iteration + export pack + credits ledger**.
---
## 2) Tujuan Produk
### 2.1 Goals (MVP)
1. **Ads-first output**: video **5–15 detik**, format **9:16 portrait (TikTok-ready, locked)**.
2. **Hybrid creation**: template pack + user dapat edit prompt/offer/CTA.
3. **Iteration loop**: generate beberapa variasi, compare, pilih, export.
4. **Credits jelas**: biaya berdasarkan durasi/preset; ada trial; ledger transparan.
5. **Reliability**: job async dengan status jelas, retry, dan policy refund saat gagal karena sistem/provider.
### 2.2 Non-goals (MVP)
- Tidak membangun shoppable landing/cart/checkout.
- Tidak integrasi TikTok Ads API (campaign management).
- Tidak auto-post TikTok di MVP (Phase 2).
- Tidak membuat editor timeline profesional (capcut-level).
### 2.3 Prinsip Produk
- **Speed > perfection** untuk MVP: user dapat hasil cepat yang “cukup bagus”.
- **Guided creation**: default yang baik + editing ringan (tanpa kompleksitas editor).
- **Transparent cost**: user tahu biaya sebelum generate.
---
## 3) Target Pengguna & Persona
1. **Seller UMKM (Primary)**  
   Kebutuhan: video promosi cepat untuk produk, bisa diulang tiap minggu, budget terbatas.
2. **Marketer/Agency (Secondary)**  
   Kebutuhan: variasi kreatif cepat untuk A/B testing manual, output siap posting, brand consistency.
3. **Content Creator (Tertiary)**  
   Kebutuhan: membuat UGC-like ads dengan hook + CTA, bahasa & tone fleksibel.
---
## 3.1) Tech Stack (MVP)
- Frontend: **Next.js (App Router)** + **React** + **TypeScript**
- UI: **shadcn/ui** + **Tailwind CSS**
- Auth: **Auth.js**
- Database: **PostgreSQL** + **Prisma**
- Storage: object storage untuk asset & video (private) + signed URL untuk download/share
- Async jobs: worker/queue untuk generate job + polling status provider (fallback jika webhook tidak tersedia)
- Payments: dummy top-up/subscription (MVP) + integrasi pembayaran (Phase 2/1.5)
- Observability: structured logging untuk job (jobId, userId, providerJobId) + error rate dashboard minimal
---
## 4) Definisi MVP Scope (Apa yang harus ada)
### 4.1 Core Modules (MVP)
1. Auth & Account
2. Project & Asset Management
3. Template Packs + Prompt Builder (Hybrid)
4. Video Generation Pipeline (Async Jobs)
5. Review & Variations
6. Export Pack + Share Link (read-only)
7. Credits, Paywall, Ledger + Billing hooks (provider pembayaran bisa mock untuk demo)
8. Minimal Admin/Moderation & Observability
### 4.2 Out of Scope (ditunda)
- Auto-post TikTok, IG, YT (Phase 2+)
- Advanced brand kit (font upload, guideline multi-brand)
- Team collaboration (workspace, roles)
- Video editing (trim, reorder scenes, timeline)
---
## 5) User Journey (End-to-End)
### 5.1 Journey A — Generate & Export (Primary)
1. User login → melihat saldo credits + trial.
2. Create Project (judul/produk) atau langsung “Quick Generate”.
3. Upload 1–5 gambar produk (opsional: logo).
4. Pilih Template Pack (mis. “UGC Promo”, “Minimal Studio”, “Luxury”).
5. Isi/ubah: offer (diskon), bahasa, tone, CTA, target durasi.
6. Sistem menampilkan estimasi biaya credits → user konfirmasi.
7. Generate job → status (queued/generating) → done.
8. User generate 2 variasi tambahan (A/B/C).
9. User pilih yang terbaik → export MP4.
10. User download dan upload manual ke TikTok.
### 5.2 Journey B — Credits habis / Paywall
1. User klik Generate.
2. Sistem cek credits cukup?
3. Jika tidak cukup: paywall (top-up / subscription) → setelah sukses, generate bisa lanjut.
### 5.3 Journey C — Gagal Generate
1. Job failed.
2. UI menampilkan alasan (provider error/timeout/validation).
3. User bisa retry (jika safe) atau ganti pack/durasi.
4. Credits: tidak terpotong / direfund sesuai policy.
---
## 6) Fitur & Requirement Detail (dengan Acceptance Criteria)
### 6.1 Auth & Akun
**Fitur**
- Sign in via **Auth.js** (email magic link atau OAuth provider).
- Session server-side via Auth.js + Prisma (revocable session).
- Profil: plan, credits, trial ends.
**Acceptance Criteria**
- AC1: user bisa login/logout.
- AC2: user selalu melihat credits balance yang sama (konsisten dari ledger).
- AC3: endpoint projects/assets/jobs/credits menolak jika user tidak terautentikasi.

### 6.1.1 Auth.js Best Practices (Implementation Notes)
- Source of truth identitas user adalah `session.user.id` dari Auth.js; jangan mengandalkan email sebagai key.
- Session strategy direkomendasikan **database session** (bukan JWT-only) agar bisa revoke/force logout dan audit perangkat.
- Jangan simpan `creditsBalance` di session; ambil dari DB saat render / request agar tidak stale.
- Proteksi endpoint dengan `auth()` (server) dan middleware untuk route yang butuh login; share link bersifat token-based (tidak perlu session).
### 6.2 Project & Asset Management
**Fitur**
- Project sebagai container: title, notes, createdAt.
- Asset upload:
  - gambar (jpeg/png/webp), max size (mis. 10MB), max count per project (mis. 20).
- Basic asset tools (opsional MVP):
  - crop/center, remove background (Phase 2 jika sulit).
**Acceptance Criteria**
- AC1: upload validasi tipe & ukuran.
- AC2: user dapat menghapus asset; video yang sudah jadi tetap ada (tidak ikut terhapus) kecuali user delete eksplisit.
- AC3: asset disimpan dengan akses kontrol (private).
### 6.3 Template Packs + Prompt Builder (Hybrid)
**Konsep**
Template pack berisi:
- basePrompt + struktur (hook → problem → solution → offer → CTA)
- recommended defaults: language, pacing, style, music vibe (textual), subtitle style (placeholder).
**Fitur**
- List template packs + preview.
- Form “Customize”:
  - language (ID/EN), tone (friendly/professional/energetic), target audience,
  - offer/promo, CTA, product name, key benefits,
  - durasi target **(5/10/15 detik)**,
  - kualitas output (Standard/HD/Full HD).
- Prompt builder menghasilkan:
  - prompt final
  - parameter generation (aspect ratio **9:16 locked**, duration)
  - output metadata untuk audit.
**Starter Template Packs (MVP)**
- UGC Hook
- Flash Sale
- Benefit Stack
- Social Proof
- Before/After
- Premium/Luxury
**Catatan**
- Template pack adalah pilihan tombol/preset yang menentukan struktur prompt, pacing, dan default copy; user tetap hanya mengisi form yang disediakan.
**Acceptance Criteria**
- AC1: user bisa memilih pack dan edit field yang disediakan.
- AC2: prompt final selalu tersimpan bersama job (reproducibility).
- AC3: sistem menampilkan “Preview Prompt” (read-only) sebelum generate.
### 6.4 Video Generation Pipeline (Async)
**Fitur**
- Generate job async:
  - create job → enqueue → poll status / webhook → store result.
- Status: `queued | generating | done | failed | cancelled`.
- Retry rules:
  - Retry otomatis 1x untuk error transient (network/timeout).
  - Retry manual oleh user untuk kasus lainnya.
- Costing:
  - biaya credits dihitung saat create job (quote),
  - credits “ditahan” (reserve) lalu “settle” saat done, atau dibatalkan/refund saat failed.
- Video output constraints:
  - aspect ratio **9:16 (portrait) mandatory** untuk upload TikTok.
  - durasi output di-lock ke **5/10/15 detik**.
  - jika output provider tidak sesuai (rasio bukan 9:16 atau durasi bukan 5/10/15) → job `failed_invalid_output` + auto-refund.
  - audio: untuk MVP, hasil **tanpa audio** (no-audio).
**Acceptance Criteria**
- AC1: job UI menampilkan status real-time (poll tiap N detik).
- AC2: job failure menyimpan `failureCode` + `failureMessage`.
- AC3: tidak ada double-charge (idempotency).
- AC4: jika provider tidak mengembalikan output dalam TTL (20 menit), job jadi failed dan credits direfund.
### 6.5 Review, Compare, Variations
**Fitur**
- Gallery per project (grid/list).
- Compare mode (A vs B).
- “Generate Variant”:
  - reuse assets + pack + fields,
  - tweak parameter variation (seed / slight variation instruction).
**Acceptance Criteria**
- AC1: user bisa membuat minimal 3 variasi untuk satu project.
- AC2: compare view menampilkan durasi, preset, tanggal, dan caption draft.
### 6.6 Export Pack & Share
**Fitur**
- Export MP4:
  - original output provider (tanpa transcode untuk MVP).
- Share link preview (opsional MVP):
  - read-only page berisi video + download button.
  - bisa diberi expiry (24–72 jam) dan token.
**Acceptance Criteria**
- AC1: user bisa download MP4.
- AC2: share link tidak bisa di-index dan tidak bocor private assets lain.
### 6.7 Credits, Billing, Ledger
**Konsep**
Credits adalah saldo. Semua perubahan saldo wajib tercatat di ledger.
**Fitur**
- Trial credits untuk user baru.
- Pricing rule:
  - cost = f(duration, outputQuality).
  - duration ∈ {5, 10, 15} detik.
  - aspect ratio 9:16 di-lock dan tidak mempengaruhi harga.
  - output quality (selaras dengan PixVerse `quality`):
    - Standard = 540p
    - HD = 720p
    - Full HD = 1080p
  - rekomendasi pricing (contoh formula):
    - baseCredits: 5s=1, 10s=2, 15s=3
    - multiplier: 540p=1.0, 720p=1.5, 1080p=2.0
    - quoteCredits = ceil(baseCredits(duration) * multiplier(quality))
- Ledger:
  - topup/subscription + consume + refund.
- Paywall:
  - tampil jika credits < quote cost.
- Pembayaran: dummy top-up/subscription (MVP). Integrasi pembayaran real ditunda.
**Acceptance Criteria**
- AC1: user dapat melihat riwayat transaksi credits (timestamp, reason, amount).
- AC2: cost ditampilkan sebelum generate dan sama dengan yang tercatat saat consume.
- AC3: refund tercatat sebagai entry baru (delta positif), bukan edit record lama.
### 6.8 Admin & Moderation (Minimal)
**Fitur**
- Admin view untuk:
  - daftar user, job error rate, konsumsi credits.
- Moderation:
  - blokir prompt/keyword tertentu (minimal).
**Acceptance Criteria**
- AC1: admin bisa melihat job failed dengan filter failureCode.
- AC2: prompt yang melanggar policy ditolak sebelum job dibuat.
---
## 7) Edge Cases & Aturan Penting
1. **Idempotency**: create job harus punya `idempotencyKey` agar refresh tidak bikin double job.
2. **Partial failure**: job done tapi export/transcode gagal → jangan mengubah status job jadi failed; cukup “export failed”.
3. **Asset deletion**: delete asset setelah job dibuat tidak mempengaruhi job yang sudah jalan; job tetap pakai snapshot reference.
4. **Provider delay**: polling TTL; setelah TTL lewat → fail + refund.
5. **Credits race**: dua tab generate bersamaan → gunakan transaksi database/lock agar saldo tidak negatif.
6. **Abuse**: rate limit generate per user per menit/jam.
7. **Output mismatch**: jika provider mengembalikan rasio non-9:16 atau durasi non {5,10,15} → job failed + auto-refund.
8. **Ai-trace-id**: setiap request ke provider wajib pakai `Ai-trace-id` unik (UUID). Reuse dapat menghasilkan respons job lama, bukan generation baru.
---
## 8) Data Model (Lebih Detail)
### 8.1 ERD Ringkas (teks)
- User 1—N Project  
- Project 1—N Asset  
- Project 1—N GenerationJob  
- GenerationJob 1—1 VideoAsset (atau 1—N jika provider multi-output)  
- User 1—N CreditLedger  
- TemplatePack (static) di-refer oleh GenerationJob
### 8.2 Tabel/Field (Minimum)
**users**
- id (uuid), email, createdAt
- plan (free/trial/paid), trialEndsAt
- creditsBalance (derived atau cached), status (active/suspended)
**projects**
- id, userId, title, notes, createdAt, updatedAt
**assets**
- id, userId, projectId
- type (image/video/logo), url, mimeType, width, height, sizeBytes
- createdAt, deletedAt (soft delete)
**template_packs**
- id, name, tags[]
- basePrompt, defaults (json)
- createdAt, updatedAt
**generation_jobs**
- id, userId, projectId, packId
- status, provider, providerJobId
- params (json: duration, preset, language, offer, cta, etc.)
- promptFinal (text)
- quoteCredits (int), settleCredits (int)
- failureCode, failureMessage
- createdAt, startedAt, finishedAt
- idempotencyKey
**video_assets**
- id, jobId
- url, durationSeconds, resolution, fileSizeBytes, format, aspectRatio
- createdAt
**credit_ledger**
- id, userId
- delta (int, +/-), balanceAfter (optional cached)
- reason (trial_grant/topup/consume/refund/adjustment)
- refType (job/payment/admin), refId
- createdAt
**share_links (opsional)**
- id, userId, jobId, tokenHash, expiresAt, createdAt, revokedAt
---
## 9) API Draft (MVP)
> Format contoh REST. Implementasi bisa disesuaikan (tRPC/GraphQL).
### 9.1 Auth
- Auth.js routes (App Router) untuk sign-in/out dan callback provider.
- Semua API internal yang memerlukan login membaca session via Auth.js (server-side).
### 9.2 Projects & Assets
- `POST /api/projects` (create)
- `GET /api/projects`
- `GET /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/projects/:id/assets` (upload)
- `GET /api/projects/:id/assets`
- `DELETE /api/assets/:id`
### 9.3 Template Packs
- `GET /api/template-packs`
- `GET /api/template-packs/:id`
### 9.4 Generation Jobs
- `POST /api/jobs`  
  body: projectId, packId, params, idempotencyKey  
  response: jobId, quoteCredits
- `GET /api/jobs/:id` (status + metadata)
- `POST /api/jobs/:id/retry`
- `POST /api/jobs/:id/cancel` (best-effort)
### 9.5 Export & Share
- `GET /api/jobs/:id/download` (signed URL)
- `POST /api/jobs/:id/share-link` (create share token)
- `GET /s/:token` (public preview)
### 9.6 Credits
- `GET /api/credits/balance`
- `GET /api/credits/ledger?limit=...`
---
## 10) Integrasi Provider AI Video (Abstraksi)
Untuk menghindari lock-in, buat interface provider:
- `createJob(input) -> providerJobId`
- `getJobStatus(providerJobId) -> status + progress + result`
- (opsional) `webhookHandler(payload)`
**Input minimal**
- assets (image URLs)
- prompt final
- duration target **(5/10/15 detik)**
- aspect ratio **9:16 (portrait)**
- quality preset
**Output minimal**
- video URL
- duration actual
- aspect ratio actual
- status + error
---
## 10.1 Integrasi PixVerse (MVP)
### Endpoint & Headers
- Base URL: `https://app-api.pixverse.ai/openapi/v2/`
- Header wajib:
  - `API-KEY`: API key PixVerse
  - `Ai-trace-id`: UUID unik untuk setiap request generate dan status check
- Semua respons berbentuk `{ ErrCode, ErrMsg, Resp }` dan sukses saat `ErrCode = 0`.
### Flow Image-to-Video (rekomendasi default)
1. Upload image → dapat `img_id`
   - `POST /image/upload` (multipart form-data: `image`)
2. Create generation job → dapat `video_id`
   - `POST /video/img/generate`
   - body minimal: `img_id`, `prompt`, `model`, `duration`, `quality`, `seed`
   - audio: set `generate_audio_switch=false` (jika didukung model) untuk memastikan output no-audio
   - rekomendasi model: `v6` (mendukung durasi 1–15 detik)
3. Poll result sampai selesai
   - `GET /video/result/{video_id}`
   - status penting:
     - `1`: success (field `url` tersedia)
     - `5`: generating
     - `7`: moderation failed
     - `8`: generation failed
### TikTok Constraints Enforcement (MVP)
- Durasi: request hanya mengizinkan 5/10/15 detik. Jika provider mengembalikan durasi di luar itu → fail + auto-refund.
- Rasio: target 9:16 portrait.
  - Untuk image-to-video, enforce lewat:
    - preprocessing asset (crop/pad ke portrait sebelum upload), dan
    - validasi result memakai `outputWidth`/`outputHeight` dari endpoint result.
  - Jika output bukan 9:16 → fail + auto-refund.
---
## 10.2 Job Processing Architecture (MVP)
### Rekomendasi: DB-backed Worker
- Web/API hanya membuat job record + memanggil provider generate untuk mendapatkan `providerJobId` (PixVerse `video_id`).
- Worker terpisah melakukan polling status provider tiap 3–5 detik per job sampai selesai/failed/TTL.
- Concurrency dibatasi (mis. max N job generating per user + max M global) untuk menjaga rate limit provider dan menghindari biaya tak terkontrol.
### TTL & Retry
- TTL fixed: 20 menit per job (jika lewat → fail + auto-refund).
- Retry otomatis 1x hanya untuk error transient (network/timeout). Status 7 (moderation) tidak auto-retry.
### Polling Schedule
- 0–60 detik: poll tiap 3 detik
- 60–180 detik: poll tiap 5 detik
- 180 detik–TTL: poll tiap 10 detik
---
## 10.4 Rate Limit (MVP)
- Per user:
  - max 2 job `generating` bersamaan
  - max 30 generate per hari
  - max 10 generate per jam
- Global:
  - max 20 job `generating` bersamaan
- API:
  - `POST /api/jobs`: max 1 request per 10 detik per user (burst control)
---
## 10.3 Retention Policy (MVP)
- Asset upload: disimpan 30 hari, atau sampai user delete.
- Video result: disimpan 30 hari, atau sampai user delete.
- Share link: expiry default 72 jam + bisa revoke manual.
## 11) UX / UI Requirements (Ringkas tapi preskriptif)
### Halaman/Screen (MVP)
1. Login + onboarding (trial credits)
2. Dashboard: Projects + tombol Quick Generate
3. Project detail: Assets + Generated videos
4. Template pack picker + Customize form
5. Generation progress screen (job list + status)
6. Review & Compare (A vs B)
7. Export modal (MP4 download + share link)
8. Credits & Billing screen (ledger + topup)
### UX rules
- Selalu tampilkan **quote cost** sebelum generate.
- Saat generating: tampilkan estimasi waktu + tips (tidak blank).
- Setelah done: tampilkan CTA “Generate Variant”.
- Form duration harus berupa pilihan **5/10/15 detik**.
- Jangan tampilkan opsi rasio video (selalu **9:16 portrait**).
---
## 12) Observability, Analytics (Internal)
**Yang dicatat**
- job created/started/done/failed
- latency per provider
- refund rate
- credits consumption per user/day
- template pack usage
**Tools**
- structured logging (jobId, userId, providerJobId)
- basic dashboard error rate (admin)
---
## 13) Security & Compliance (Minimum)
- Validasi upload (mime sniffing, virus scan opsional).
- Signed URL untuk download; asset private tidak boleh public.
- Rate limit generate per user/IP.
- Prompt filtering minimal (blocklist).
- Audit trail untuk admin adjustments credits.
---
## 14) Testing Strategy (MVP)
- Unit test:
  - pricing function (credits cost)
  - prompt builder (deterministik)
  - ledger posting (double-charge prevention)
- Integration test:
  - create job → status update → store output
- E2E smoke (Playwright):
  - login → upload asset → generate → export
---
## 15) Rollout Plan
1. Private alpha: limit user + quota.
2. Beta: tambah topup + monitoring.
3. Public: perketat abuse prevention + scale provider quota.
---
## 16) Roadmap
### Phase 2 — Auto-post TikTok (API)
- OAuth connect TikTok.
- Publish flow (select video → caption/hashtag → post).
- Status publish + retry + logging.
> Catatan: sangat bergantung kebijakan akses API TikTok.
### Phase 3 — Multi-platform Share
- IG Reels, YT Shorts, X, dsb (jika API memungkinkan).
### Phase 4 — Creative Intelligence
- Hook scoring, rekomendasi perbaikan prompt, auto-variant generation.
---
## 17) Risiko & Mitigasi
1. **Akses API TikTok** (Phase 2) sulit → siapkan fallback manual upload (sudah MVP).
2. **Biaya provider AI tinggi** → pricing credits harus adaptif + limiter durasi.
3. **Output quality tidak konsisten** → template packs + constraint prompt + iterative variants.
4. **Abuse (spam generate)** → rate limit + CAPTCHA (opsional) + risk scoring.
5. **Mismatch durasi/rasio** → kontrak output 9:16 + 5/10/15, fallback policy yang jelas (fail+refund vs transcode Phase 2).
---
## 18) Open Questions (untuk diputuskan)
1. Provider AI video yang dipakai di MVP (PixVerse/alternatif) dan limit kuota?
2. Payment provider yang digunakan untuk topup/subscription?
3. Apakah “Quick Generate” tanpa project perlu, atau wajib project?
4. Apakah share link perlu expiry default (mis. 72 jam)?
5. Jika provider mengembalikan durasi/rasio berbeda, apakah MVP: (a) fail+refund, atau (b) transcode/trim otomatis?
