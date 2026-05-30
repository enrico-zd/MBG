# PRD Lengkap — SaaS AI Video Ads Generator (Credits-Based)

> Dokumen ini mendefinisikan produk “AI Video Ads Generator” yang fokus pada pembuatan video iklan siap posting (TikTok-first) dengan model monetisasi credits. Integrasi auto-post TikTok disiapkan sebagai **Phase 2**.

---

## 0) TL;DR
User upload aset produk → pilih template pack → app membangun prompt → generate video (async job) → review & buat variasi → export (MP4 + caption + hashtag + thumbnail) → upload ke TikTok manual (MVP) → bayar via credits berdasarkan durasi/preset.

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
1. **Ads-first output**: video 15–45 detik, format 9:16, cocok untuk TikTok/Shorts/Reels.
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
9. User pilih yang terbaik → export pack (MP4 + caption + hashtag + thumbnail).
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
- Sign up / Login via email (magic link/OTP) atau OAuth (opsional).
- Profil: plan, credits, trial ends.

**Acceptance Criteria**
- AC1: user bisa login/logout.
- AC2: user selalu melihat credits balance yang sama (konsisten dari ledger).
- AC3: endpoint generate menolak jika user tidak terautentikasi.

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
  - durasi target (15/30/45 detik),
  - preset kualitas (standard/high).
- Prompt builder menghasilkan:
  - prompt final
  - parameter generation (aspect ratio 9:16, duration)
  - output metadata untuk audit.

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

**Acceptance Criteria**
- AC1: job UI menampilkan status real-time (poll tiap N detik).
- AC2: job failure menyimpan `failureCode` + `failureMessage`.
- AC3: tidak ada double-charge (idempotency).
- AC4: jika provider tidak mengembalikan output dalam TTL (mis. 20 menit), job jadi failed dan credits direfund.

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
  - original output atau transcode (opsional).
- Generate caption draft:
  - dari pack + offer + CTA.
- Hashtag recommendation:
  - generik + kategori produk (rule-based untuk MVP).
- Thumbnail:
  - ambil frame awal / tengah (opsional).
- Share link preview (opsional MVP):
  - read-only page berisi video + caption + download button.
  - bisa diberi expiry (24–72 jam) dan token.

**Acceptance Criteria**
- AC1: user bisa download MP4.
- AC2: caption & hashtag bisa di-copy.
- AC3: share link tidak bisa di-index dan tidak bocor private assets lain.

### 6.7 Credits, Billing, Ledger
**Konsep**
Credits adalah saldo. Semua perubahan saldo wajib tercatat di ledger.

**Fitur**
- Trial credits untuk user baru.
- Pricing rule:
  - cost = f(duration, presetQuality, resolution optional).
- Ledger:
  - topup/subscription + consume + refund.
- Paywall:
  - tampil jika credits < quote cost.
- Webhook pembayaran (Phase 1.5 jika diperlukan) atau mock untuk demo.

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
- url, durationSeconds, resolution, fileSizeBytes, format
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
- `POST /api/auth/login` (send OTP/magic link)
- `POST /api/auth/verify` (verify token)
- `POST /api/auth/logout`

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
- `POST /api/jobs/:id/export` (opsional jika perlu transcode)
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
- duration target
- aspect ratio 9:16
- quality preset

**Output minimal**
- video URL
- duration actual
- status + error

---

## 11) UX / UI Requirements (Ringkas tapi preskriptif)

### Halaman/Screen (MVP)
1. Login + onboarding (trial credits)
2. Dashboard: Projects + tombol Quick Generate
3. Project detail: Assets + Generated videos
4. Template pack picker + Customize form
5. Generation progress screen (job list + status)
6. Review & Compare (A vs B)
7. Export modal (MP4 + caption + hashtag)
8. Credits & Billing screen (ledger + topup)

### UX rules
- Selalu tampilkan **quote cost** sebelum generate.
- Saat generating: tampilkan estimasi waktu + tips (tidak blank).
- Setelah done: tampilkan CTA “Generate Variant”.

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

---

## 18) Open Questions (untuk diputuskan)
1. Provider AI video yang dipakai di MVP (PixVerse/alternatif) dan limit kuota?
2. Payment provider yang digunakan untuk topup/subscription?
3. Apakah “Quick Generate” tanpa project perlu, atau wajib project?
4. Apakah share link perlu expiry default (mis. 72 jam)?
5. Durasi yang disupport di MVP: 15/30/45 saja atau bebas (dengan rounding)?

