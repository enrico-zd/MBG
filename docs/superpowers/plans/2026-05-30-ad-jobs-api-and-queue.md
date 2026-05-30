# Ad Jobs API + Queue Enqueue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambah modul queue `taskTypes` + `enqueue`, serta API routes `ad-jobs` (create, detail, list) di Next.js App Router dengan identifikasi user via `userEmail`.

**Architecture:** Route handlers memakai Prisma untuk CRUD `User`, `Project`, `AdJob`, `AdJobSegment`, dan `Task`. `POST /api/ad-jobs` membuat parent job + segments dan mengantrikan task awal per segment lewat `enqueueTask`. Semua response yang memuat BigInt di-normalisasi ke string agar aman untuk JSON.

**Tech Stack:** Next.js App Router, TypeScript, Prisma (Postgres).

---

## 0) Konvensi & Validasi

- `runtime = "nodejs"` untuk semua route handler.
- Identifikasi user via `userEmail` seperti [projects API](file:///workspace/src/app/api/projects/route.ts).
- Validasi request body/params:
  - JSON parse error → `400 { error: "invalid_json" }`
  - shape salah → `400 { error: "invalid_body" }`
  - field salah → `400 { error: "invalid_<field>" }`
- Normalisasi BigInt untuk JSON:
  - `pixverseImgId` / `pixverseVideoId` dari `AdJobSegment` dikonversi ke string.

---

## 1) Task: Implement taskTypes

**Files:**
- Create: `src/lib/queue/taskTypes.ts`

- [ ] **Step 1: Buat tipe task dan payload**

```ts
export type TaskType =
  | "pixverse.upload_image"
  | "pixverse.generate_segment"
  | "pixverse.poll_segment"
  | "video.stitch_segments"

export type UploadImageTaskPayload = { segmentId: string }
export type GenerateSegmentTaskPayload = { segmentId: string }
export type PollSegmentTaskPayload = { segmentId: string }
export type StitchSegmentsTaskPayload = { adJobId: string }
```

---

## 2) Task: Implement enqueue helper

**Files:**
- Create: `src/lib/queue/enqueue.ts`

- [ ] **Step 1: Implement enqueueTask**

```ts
import { prisma } from "@/lib/db/prisma"
import type { TaskType } from "@/lib/queue/taskTypes"

export async function enqueueTask(args: { type: TaskType; payloadJson: unknown; runAfter?: Date }) {
  return prisma.task.create({
    data: {
      type: args.type,
      payloadJson: args.payloadJson as any,
      runAfter: args.runAfter ?? new Date(),
    },
  })
}
```

---

## 3) Task: Implement `POST /api/ad-jobs` + `GET /api/ad-jobs` (list)

**Files:**
- Create: `src/app/api/ad-jobs/route.ts`

- [ ] **Step 1: GET list route**

Behavior:
- Query params wajib: `projectId`, `userEmail`
- Jika `userEmail` tidak ada user → return `{ adJobs: [] }`
- Query `adJob.findMany` filter `projectId` + `user.email`
- Include segments order `segmentIndex asc`
- Normalisasi BigInt segments

- [ ] **Step 2: POST create route**

Behavior:
- Body wajib: `userEmail`, `projectId`, `templatePackId`, `targetDurationSec (30|45)`, `quality`, `params`
- Upsert `User` by email
- Pastikan project milik user (cek `Project` by `id` dan `userId`)
- Buat `AdJob` + `AdJobSegment[]`:
  - `segmentsCount = targetDurationSec / 15`
  - `segmentDurationSec = 15`
  - `segmentIndex` 0..N-1
  - `promptFinal` dari `buildSegmentPrompt`
- Hitung `estimatedPixverseCredits` (no-audio):
  - 360p=5, 540p=7, 720p=9, 1080p=18 (per detik)
  - `credits = rate * targetDurationSec`
- Enqueue task awal per segment: `pixverse.upload_image` payload `{ segmentId }`
- Response: `201 { adJob: ... }` (dengan segments dan BigInt ternormalisasi)

---

## 4) Task: Implement `GET /api/ad-jobs/[jobId]`

**Files:**
- Create: `src/app/api/ad-jobs/[jobId]/route.ts`

- [ ] **Step 1: Implement GET detail**

Behavior:
- Optional query param: `userEmail` (kalau ada, enforce ownership via `user.email`)
- Include `segments` order `segmentIndex asc`
- Return `404 { error: "not_found" }` kalau tidak ada
- Normalisasi BigInt segments untuk JSON

---

## 5) Verifikasi

- [ ] **Step 1: Typecheck + build**

Run:

```bash
npm run build
```

Expected: sukses tanpa error TypeScript.

- [ ] **Step 2: Test suite yang ada**

Run:

```bash
npm test
```

Expected: semua test PASS.

---

## Plan Self-Review Checklist (filled)

### Spec coverage
- Queue enqueue (`taskTypes`, `enqueueTask`): Task 1–2
- Ad jobs routes (create, list by projectId+userEmail, detail): Task 3–4
- Identifikasi user via `userEmail`: Task 3–4

### Placeholder scan
- Tidak ada TODO/TBD; semua field/validasi dan behavior eksplisit.

