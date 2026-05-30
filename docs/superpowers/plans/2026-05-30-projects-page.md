# Projects Page (/projects) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan halaman `/projects` yang memungkinkan user memasukkan `userEmail`, menampilkan daftar project milik user, membuat project baru, dan menyimpan `selectedProjectId` saat memilih project.

**Architecture:** `src/app/projects/page.tsx` sebagai server component shell, `src/app/projects/ProjectsClient.tsx` sebagai client component untuk interaksi (localStorage + fetch). UI memanfaatkan primitives di `src/components/ui/*`.

**Tech Stack:** Next.js App Router, React, TypeScript, Fetch API.

---

## Struktur File (Target Akhir)

- Create: `src/app/projects/page.tsx`
- Create: `src/app/projects/ProjectsClient.tsx`

## Task 1: Server page shell

**Files:**
- Create: `src/app/projects/page.tsx`

- [ ] **Step 1: Buat halaman server untuk mount client**

Create `src/app/projects/page.tsx`:

```tsx
import { Container } from "@/components/ui/Container";
import { ProjectsClient } from "@/app/projects/ProjectsClient";

export default function ProjectsPage() {
  return (
    <main>
      <Container>
        <ProjectsClient />
      </Container>
    </main>
  );
}
```

- [ ] **Step 2: Verifikasi build**

Run:

```bash
npm run build
```

Expected: build sukses.

## Task 2: Client interaksi (email + list + create + select)

**Files:**
- Create: `src/app/projects/ProjectsClient.tsx`

- [ ] **Step 1: Buat client component untuk:**
- [ ] Simpan/load `userEmail` ke localStorage via `src/lib/client/userPrefs.ts`
- [ ] Fetch daftar project dari `GET /api/projects?userEmail=...`
- [ ] Create project via `POST /api/projects` (body: `{ userEmail, title }`)
- [ ] Simpan `selectedProjectId` saat klik project
- [ ] Layout responsif via grid `repeat(auto-fit, minmax(320px, 1fr))`

- [ ] **Step 2: Verifikasi build**

Run:

```bash
npm run build
```

Expected: build sukses.
