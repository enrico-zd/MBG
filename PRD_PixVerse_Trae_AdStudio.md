# PRD Ringkas — Product Ads Video Campaign Studio (PixVerse × TRAE)

## 1) Ringkasan
**Product Ads Video Campaign Studio** adalah web app yang membantu pemilik bisnis/brand membuat **video iklan AI berdurasi ≥30 detik** dari **gambar produk** (dan opsional teks deskripsi), lalu menggunakannya sebagai komponen inti di pengalaman produk yang fungsional: **membuat campaign, memilih objective, menghasilkan variasi kreatif rekomendasi, menambahkan CTA, publish ke landing page shoppable, dan memantau performa**.  

Track requirement: video dari PixVerse harus menjadi konten bermakna (bukan sekadar pemutar). App menyediakan fungsi nyata: **campaign builder, product interaction (detail/varian/cart), A/B creative selection, analytics, dan subscription/credits management**.

## 2) Tujuan
### Goals
1. User dapat membuat video iklan AI **≥30 detik** berbasis **product image** menggunakan PixVerse.
2. User mendapat **rekomendasi kreatif** (template/prompt/style) agar hasil video “siap pakai” untuk marketing.
3. Video terintegrasi ke pengalaman produk yang fungsional: **landing page shoppable** + CTA + (opsional) checkout sederhana.
4. Ada model bisnis yang jelas: **trial + kredit**, lalu **subscription**/top-up kredit setelah habis.
5. Menunjukkan “workflow depth” TRAE: agent membantu menyusun prompt, struktur halaman, mapping scene→hotspot, dan scaffolding UI/logic.

### 2.1 Skill SOLO yang dipakai (agar sesuai penilaian “workflow depth”)
Tujuan bagian ini: mendeskripsikan *bagaimana* TRAE SOLO dipakai untuk mempercepat implementasi dan meningkatkan kualitas hasil.

- **byted-seedance-video-generate**: referensi pola integrasi *video generation pipeline* (job → status → result), struktur prompt, dan error handling (walau output video final dari PixVerse).
- **frontend-design / frontend-skill**: panduan membuat UI builder & landing page yang terlihat production-grade (hierarchy, spacing, motion kecil, komposisi).
- **shadcn**: percepat delivery komponen UI (form upload, dialog paywall, tabs, table analytics, toast, dsb).
- **react-best-practices**: struktur Next.js/React, performa, dan pola data fetching agar demo stabil.
- **webapp-testing**: Playwright E2E test untuk flow kritikal (publish landing → CTA → cart → paywall) + screenshot untuk bukti.
- **writing-plans / test-driven-development**: breakdown task + acceptance criteria agar kerja 2 orang minim konflik.
- **security-best-practices**: checklist keamanan minimum (auth, validasi upload, rate limit endpoint generate, proteksi credits).
- **slides**: pitch deck yang selaras rubric penilaian.
- **doc-coauthoring** (opsional): merapikan PRD/README/submission write-up.
- **hook-analyzer-skill + report-generator-skill** (opsional): analisis “hook” 3 detik pertama untuk iterasi creative direction.

### Non-goals (untuk hackathon)
- Tidak membangun payment gateway produksi (cukup mock/redirect).
- Tidak membangun integrasi ke Ads platform (Meta/TikTok) secara real API; cukup “export pack” + format specs.
- Tidak mengejar video editing kompleks (timeline editor penuh).

## 3) Target pengguna & use case
### Persona
- **UMKM/Brand Owner**: butuh cepat bikin iklan dan landing.
- **Marketer**: butuh variasi kreatif dan A/B test sederhana.

### Use case utama
- Upload foto produk → pilih objective (Awareness/Conversion) → pilih rekomendasi style → generate video 30–45 detik → tambahkan CTA & highlight produk → publish landing page → bagikan link → lihat metrik.

## 4) Nilai unik (pembeda)
1. **“Recommended Creative Packs”**: sistem memberi 3 paket kreatif (mis. *Minimal Studio*, *Lifestyle Urban*, *Luxury Cinematic*) lengkap dengan prompt, caption, CTA, dan mood.
2. **Auto scene-to-hotspot plan**: berdasarkan prompt/storyboard, app membuat **chapter** dan hotspot (mis. detik 08–12 “Feature 1”, detik 20–25 “Bundle offer”).
3. **Business model-first**: trial + credit gating yang rapih, termasuk upgrade flow, dan limit jelas.

## 5) Lingkup produk (MVP untuk hackathon)

### 5.1 Informasi produk (Product Setup)
- Upload **1–5 gambar** produk (utama + variasi).
- Field: nama produk, harga, deskripsi singkat, kategori, link checkout eksternal (opsional).
- (Opsional) varian sederhana: warna/ukuran.

### 5.2 Creative Recommendations
Saat user memilih objective + kategori produk, sistem menampilkan:
- **3 recommended packs**:
  - Style video (tone, lighting, pacing)
  - Script/caption rekomendasi
  - CTA rekomendasi
  - Durasi target (30–45s)
  - Estimasi credit cost
- User bisa “Customize” (tone, bahasa, target audience, promo) sebelum generate.

### 5.3 Video Generation (PixVerse)
- Input minimal: product image + prompt yang dihasilkan dari pack.
- Output: video URL/file (mp4) durasi ≥30 detik.
- Status: queued → generating → done/failed.
- Error handling: retry, ganti pack, reduce complexity.

### 5.4 Landing Page Builder (beyond playback)
Landing page campaign memuat:
- Player video + **chapters** (scene navigation).
- Panel produk:
  - detail + varian + qty
  - **Add to Cart** (cart lokal sederhana)
  - tombol **Checkout** (mock atau redirect ke link eksternal)
- CTA sticky (mis. “Shop Now”, “Get Bundle”, “Claim Discount”).
- Section komentar/voting:
  - voting: “creative A vs B” (jika ada 2 video)
  - komentar: feedback campaign

### 5.5 Campaign & Analytics
Metrik MVP:
- Views, watch time (approx), CTR tombol CTA
- Add-to-cart count, checkout click count
- Vote result (A/B) & sentiment komentar (simple)

### 5.6 Trial, Credits, Subscription (Business side)
- **Trial**: user baru mendapat N credits (mis. 1–2 kali generate).
- Setiap generate mengurangi credits sesuai durasi/preset.
- Saat **credits habis** atau **trial berakhir**:
  - UI menampilkan blokir jelas (“Generate terkunci”)
  - CTA upgrade: pilih paket subscription / top-up
  - Fallback: tetap bisa akses campaign yang sudah dibuat (read-only)

## 6) User Flow (end-to-end)

### Flow A — Buat campaign dengan rekomendasi (primary)
1. **Login/Onboarding** → lihat sisa trial/credits
2. **Create Campaign**
3. **Product Setup**: upload gambar produk + isi nama/harga/deskripsi
4. **Select Objective**: Awareness / Conversion
5. **Recommended Packs** muncul (3 opsi) → user pilih 1
6. **Customize** (opsional): bahasa, tone, promo, CTA
7. **Generate Video (PixVerse)** → progress status
8. **Review Result**
   - accept / regenerate (pakai credits)
   - generate variasi B untuk A/B (opsional)
9. **Landing Builder**
   - chapters/hotspots (auto, bisa edit ringan)
   - set CTA + link checkout
10. **Publish** → dapat link landing
11. **Analytics**: lihat views/CTR/add-to-cart/vote

### Flow B — Credits habis / trial berakhir
1. User klik **Generate / Regenerate**
2. Sistem cek **credits & trial**
3. Jika tidak cukup:
   - tampilkan modal paywall: paket + benefit + CTA upgrade
   - opsi “Not now” → kembali ke campaign (tanpa generate)

### Flow C — Viewer experience (landing)
1. Buka landing link
2. Nonton video (≥30 detik) + navigasi chapter
3. Klik CTA / hotspot → lihat detail produk
4. Add to cart → checkout (mock/redirect)
5. Vote creative (jika ada) + komentar

## 7) Requirement fungsional (ringkas)
- Upload gambar produk & simpan katalog produk campaign
- Generate prompt dari pack + input user
- Integrasi PixVerse: create job, poll status, simpan hasil video
- Landing page publish (public URL) + player + chapter nav
- Cart sederhana + checkout click tracking
- Voting & komentar (basic CRUD)
- Analytics dashboard (aggregate)
- Credits/subscription gating (state + UI)

## 8) Requirement non-fungsional
- Responsif (mobile-first)
- Waktu load landing cepat; video via streaming/CDN link
- Keamanan minimal: auth, rate limit generate, validasi input
- Observability: log job PixVerse dan error reason

## 9) Data model (minimal)
- User: id, plan, credits, trialEndsAt
- Campaign: id, userId, title, objective, status, publishedUrl
- Product: id, campaignId, name, price, images[], variants[]
- CreativePack: id, name, preset, basePrompt, recommendedCTA
- VideoAsset: id, campaignId, packId, pixverseJobId, url, duration, status
- LandingConfig: campaignId, chapters[], hotspots[], ctaText, checkoutUrl
- EventLog: campaignId, type(view/cta/cart/checkout), ts
- Vote: campaignId, option(A/B), count/userVotes
- Comment: campaignId, userId/anon, text, ts

## 10) MVP UI Screens
1. Onboarding + Credits status
2. Campaign list + Create
3. Product setup form
4. Recommended packs picker + customize
5. Generation progress + result review (A/B)
6. Landing builder (light edit)
7. Publish success + share link
8. Analytics dashboard
9. Paywall modal (upgrade/top-up)

## 11) Milestone implementasi (hackathon-friendly)
- M1: Campaign + product setup + pack recommendations (static rules)  
  *Skill:* writing-plans/test-driven-development, shadcn
- M2: PixVerse generation pipeline (job + polling + result)  
  *Skill:* byted-seedance-video-generate (referensi pipeline), security-best-practices
- M3: Landing publish + chapters + CTA + cart mock  
  *Skill:* frontend-design/frontend-skill, shadcn, react-best-practices
- M4: Credits gating + paywall UI + analytics tracking  
  *Skill:* shadcn (dialog/table), security-best-practices
- M5: Polish UX + demo script + “TRAE workflow” highlights + E2E test  
  *Skill:* webapp-testing, slides (pitch), doc-coauthoring (opsional), hook-analyzer/report-generator (opsional)
