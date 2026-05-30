# Ad Jobs New Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambah halaman `/ad-jobs/new` untuk membuat Ad Job dengan mengambil daftar project + template packs, submit ke `POST /api/ad-jobs`, lalu redirect ke `/ad-jobs/[jobId]`.

**Architecture:** Halaman server `page.tsx` hanya menyiapkan shell dan merender client component. `AdJobNewClient` meng-handle state form, load data lewat fetch ke API existing, submit create job, menyimpan preferensi user (email/project) ke local storage, lalu navigasi ke halaman detail job.

**Tech Stack:** Next.js App Router, React, TypeScript.

---

## File Structure

- Create: `src/app/ad-jobs/new/page.tsx` — server page shell.
- Create: `src/app/ad-jobs/new/AdJobNewClient.tsx` — client form + fetch + submit.

---

## Task 1: Create server page shell

**Files:**
- Create: `src/app/ad-jobs/new/page.tsx`

- [ ] **Step 1: Implement page.tsx**

```tsx
import { Container } from "@/components/ui/Container";
import { AdJobNewClient } from "@/app/ad-jobs/new/AdJobNewClient";

export default function AdJobNewPage() {
  return (
    <main>
      <Container>
        <AdJobNewClient />
      </Container>
    </main>
  );
}
```

---

## Task 2: Create client form for create AdJob

**Files:**
- Create: `src/app/ad-jobs/new/AdJobNewClient.tsx`

- [ ] **Step 1: Implement AdJobNewClient**

Requirements:
- Load projects: `GET /api/projects?userEmail=...`
- Load template packs: `GET /api/template-packs`
- Prefill project dari query `?projectId=...` atau dari `userPrefs`
- Submit: `POST /api/ad-jobs` body `{ userEmail, projectId, templatePackId, targetDurationSec, quality, params }`
- On success: `router.push("/ad-jobs/[jobId]")`

Code reference: ikuti style komponen existing [AdJobsDashboardClient.tsx](file:///workspace/src/app/ad-jobs/AdJobsDashboardClient.tsx) dan spesifikasi Task 7 di [2026-05-30-mbg-ui-pages.md](file:///workspace/docs/superpowers/plans/2026-05-30-mbg-ui-pages.md#L1091-L1390).

---

## Task 3: Verifikasi build

- [ ] **Step 1: Run build**

Run:

```bash
npm run build
```

Expected: sukses tanpa error TypeScript.

---

## Plan Self-Review Checklist (filled)

### Spec coverage
- Create `/ad-jobs/new` server shell: Task 1
- Load projects + template packs: Task 2
- Submit ke `/api/ad-jobs` lalu redirect: Task 2
- Build verification: Task 3

### Placeholder scan
- Tidak ada TODO/TBD; paths, API endpoints, dan behavior eksplisit.

