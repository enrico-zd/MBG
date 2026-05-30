# MBG UI Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun UI Next.js (App Router) untuk halaman `/`, `/projects`, `/projects/[projectId]`, `/ad-jobs`, `/ad-jobs/new`, dan `/ad-jobs/[jobId]` dengan tema dark + aksen ungu, terhubung ke API routes yang sudah ada.

**Architecture:** Menggunakan App Router dengan server component sebagai shell, lalu client component untuk interaksi (form, fetch, polling, localStorage). Reusable UI primitives sederhana ditempatkan di `src/components/ui/*` dan state preferensi user (userEmail, selectedProjectId) dikelola via helper `src/lib/client/userPrefs.ts`.

**Tech Stack:** Next.js App Router, React, TypeScript, Fetch API, CSS global.

---

## Struktur File (Target Akhir)

- Create: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/projects/page.tsx`
- Create: `src/app/projects/ProjectsClient.tsx`
- Create: `src/app/projects/[projectId]/page.tsx`
- Create: `src/app/projects/[projectId]/ProjectDetailClient.tsx`
- Create: `src/app/ad-jobs/page.tsx`
- Create: `src/app/ad-jobs/AdJobsDashboardClient.tsx`
- Create: `src/app/ad-jobs/new/page.tsx`
- Create: `src/app/ad-jobs/new/AdJobNewClient.tsx`
- Create: `src/app/ad-jobs/[jobId]/page.tsx`
- Create: `src/app/ad-jobs/[jobId]/AdJobDetailClient.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Container.tsx`
- Create: `src/components/ui/Field.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/ProgressBar.tsx`
- Create: `src/components/ui/Select.tsx`
- Create: `src/components/Nav.tsx`
- Create: `src/lib/client/userPrefs.ts`

## Task 1: Global layout + styling + UI primitives

**Files:**
- Create: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/components/Nav.tsx`
- Create: `src/components/ui/Container.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/Select.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/ProgressBar.tsx`
- Create: `src/components/ui/Field.tsx`

- [ ] **Step 1: Tambah global CSS**

Create `src/app/globals.css`:

```css
:root {
  color-scheme: dark;
  --bg: #0b0d12;
  --panel: rgba(255, 255, 255, 0.04);
  --panel2: rgba(255, 255, 255, 0.02);
  --border: rgba(255, 255, 255, 0.08);
  --text: #e9eefc;
  --muted: rgba(233, 238, 252, 0.7);
  --brand: #7c5cff;
  --brand2: #5fc7ff;
}

html,
body {
  padding: 0;
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Apple Color Emoji", "Segoe UI Emoji";
}

a {
  color: inherit;
  text-decoration: none;
}

* {
  box-sizing: border-box;
}
```

- [ ] **Step 2: Update RootLayout untuk import global CSS + nav**

Modify `src/app/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import "@/app/globals.css";
import { Nav } from "@/components/Nav";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Tambah komponen navigasi**

Create `src/components/Nav.tsx`:

```tsx
import Link from "next/link";

export function Nav() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        borderBottom: "1px solid var(--border)",
        background: "rgba(14,18,26,0.9)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, letterSpacing: 0.2 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "var(--brand)",
              boxShadow: "0 0 0 6px rgba(124,92,255,0.18)",
            }}
          />
          <Link href="/">MBG</Link>
        </div>
        <nav style={{ display: "flex", gap: 14, fontSize: 13, opacity: 0.9 }}>
          <Link href="/">Home</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/ad-jobs">Ad Jobs</Link>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Tambah UI primitives**

Create `src/components/ui/Container.tsx`:

```tsx
import type { ReactNode } from "react";

export function Container({ children }: { children: ReactNode }) {
  return <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 18px 28px" }}>{children}</div>;
}
```

Create `src/components/ui/Card.tsx`:

```tsx
import type { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return (
    <section style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
      {children}
    </section>
  );
}

export function CardHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: 12,
        borderBottom: "1px solid var(--border)",
        background: "var(--panel2)",
      }}
    >
      <h2 style={{ margin: 0, fontSize: 14, letterSpacing: 0.2 }}>{title}</h2>
      {right}
    </div>
  );
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div style={{ padding: 12 }}>{children}</div>;
}
```

Create `src/components/ui/Button.tsx`:

```tsx
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

export function Button({
  variant = "primary",
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    padding: "0 14px",
    borderRadius: 12,
    fontWeight: 800,
    border: 0,
    cursor: "pointer",
    gap: 8,
  };

  const v: Record<Variant, React.CSSProperties> = {
    primary: { background: "var(--brand)", color: "var(--bg)" },
    secondary: { background: "rgba(255,255,255,0.06)", color: "var(--text)", border: "1px solid rgba(255,255,255,0.12)" },
  };

  return <button {...props} style={{ ...base, ...v[variant], ...style }} />;
}
```

Create `src/components/ui/Input.tsx`:

```tsx
import type { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        height: 36,
        borderRadius: 10,
        padding: "0 10px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "var(--text)",
        outline: "none",
      }}
    />
  );
}
```

Create `src/components/ui/Select.tsx`:

```tsx
import type { SelectHTMLAttributes } from "react";

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: "100%",
        height: 36,
        borderRadius: 10,
        padding: "0 10px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "var(--text)",
        outline: "none",
      }}
    />
  );
}
```

Create `src/components/ui/Badge.tsx`:

```tsx
import type { ReactNode } from "react";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "queued" | "running" | "done" }) {
  const map: Record<string, React.CSSProperties> = {
    neutral: { borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" },
    queued: { borderColor: "rgba(124,92,255,0.35)", background: "rgba(124,92,255,0.14)" },
    running: { borderColor: "rgba(95,199,255,0.35)", background: "rgba(95,199,255,0.14)" },
    done: { borderColor: "rgba(98,255,161,0.35)", background: "rgba(98,255,161,0.12)" },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        fontSize: 12,
        ...map[tone]!,
      }}
    >
      {children}
    </span>
  );
}
```

Create `src/components/ui/ProgressBar.tsx`:

```tsx
export function ProgressBar({ value }: { value: number }) {
  const v = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <div
      style={{
        height: 8,
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <div style={{ height: "100%", width: `${v}%`, background: "linear-gradient(90deg, var(--brand), var(--brand2))" }} />
    </div>
  );
}
```

Create `src/components/ui/Field.tsx`:

```tsx
import type { ReactNode } from "react";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div style={{ background: "rgba(0,0,0,0.18)", border: "1px solid var(--border)", borderRadius: 12, padding: 10 }}>
      <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 6 }}>{label}</div>
      {children}
      {hint ? <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>{hint}</div> : null}
    </div>
  );
}
```

- [ ] **Step 5: Verifikasi build masih jalan**

Run:

```bash
npm run build
```

Expected: build sukses tanpa TypeScript error.

## Task 2: Helper preferensi user (userEmail, selectedProjectId)

**Files:**
- Create: `src/lib/client/userPrefs.ts`

- [ ] **Step 1: Tambah helper localStorage yang aman**

Create `src/lib/client/userPrefs.ts`:

```ts
const KEY_EMAIL = "mbg.userEmail";
const KEY_PROJECT = "mbg.selectedProjectId";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getUserEmail() {
  if (!canUseStorage()) return "";
  return window.localStorage.getItem(KEY_EMAIL) || "";
}

export function setUserEmail(email: string) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(KEY_EMAIL, email);
}

export function getSelectedProjectId() {
  if (!canUseStorage()) return "";
  return window.localStorage.getItem(KEY_PROJECT) || "";
}

export function setSelectedProjectId(projectId: string) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(KEY_PROJECT, projectId);
}
```

## Task 3: Home page `/` (hero + CTA)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update UI home**

Modify `src/app/page.tsx`:

```tsx
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <main>
      <Container>
        <div style={{ display: "grid", gap: 14 }}>
          <Card>
            <CardHeader title="MBG — AI Video Ads Generator (MVP)" right={<span style={{ fontSize: 12, opacity: 0.75 }}>9:16 • 30–45s • no-audio</span>} />
            <CardBody>
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
                Buat video iklan produk vertikal dengan template pack, dibagi menjadi beberapa segmen, diproses oleh PixVerse, lalu distitch menjadi MP4 final.
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <Link href="/projects">
                  <Button type="button">Mulai</Button>
                </Link>
                <Link href="/ad-jobs">
                  <Button variant="secondary" type="button">
                    Buka Ad Jobs
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
            <Card>
              <CardHeader title="1) Project" />
              <CardBody>
                <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>Buat project untuk tiap brand/produk dan simpan asset gambar.</p>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="2) Ad Job" />
              <CardBody>
                <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
                  Pilih template pack, isi bahasa/tone/benefit/offer/CTA, lalu submit untuk membuat job + segments.
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="3) Monitor" />
              <CardBody>
                <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>Pantau status per segmen dan unduh output saat selesai.</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
```

- [ ] **Step 2: Quick verify**

Run:

```bash
npm run build
```

Expected: build sukses.

## Task 4: Projects page `/projects` (email + list + create)

**Files:**
- Create: `src/app/projects/page.tsx`
- Create: `src/app/projects/ProjectsClient.tsx`

- [ ] **Step 1: Server page shell**

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

- [ ] **Step 2: Client page untuk fetch + create**

Create `src/app/projects/ProjectsClient.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { getUserEmail, setUserEmail, setSelectedProjectId } from "@/lib/client/userPrefs";

type Project = { id: string; title: string; createdAt?: string; updatedAt?: string };

export function ProjectsClient() {
  const [userEmail, setUserEmailState] = useState("");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUserEmailState(getUserEmail() || "demo@example.com");
  }, []);

  const canLoad = useMemo(() => userEmail.includes("@"), [userEmail]);

  async function load() {
    if (!canLoad) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?userEmail=${encodeURIComponent(userEmail)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "failed");
      setProjects(Array.isArray(data?.projects) ? data.projects : []);
      setUserEmail(userEmail);
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    if (!canLoad) return;
    if (title.trim().length < 1) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userEmail, title: title.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "failed");
      setTitle("");
      setUserEmail(userEmail);
      await load();
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 14 }}>
      <Card>
        <CardHeader title="Projects" right={<Button variant="secondary" type="button" onClick={load} disabled={!canLoad || loading}>Refresh</Button>} />
        <CardBody>
          <div style={{ display: "grid", gap: 10 }}>
            <Field label="userEmail">
              <Input value={userEmail} onChange={(e) => setUserEmailState(e.target.value)} placeholder="nama@contoh.com" />
            </Field>
            <Field label="Buat project">
              <div style={{ display: "flex", gap: 10 }}>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nama project" />
                <Button type="button" onClick={createProject} disabled={!canLoad || loading || title.trim().length < 1}>
                  Buat
                </Button>
              </div>
            </Field>
            {error ? <div style={{ color: "#ff8a8a", fontSize: 12 }}>{error}</div> : null}
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
              Tips: email ini dipakai sebagai identitas user (MVP) dan disimpan di browser.
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Daftar Project" right={<span style={{ fontSize: 12, opacity: 0.7 }}>{projects.length} items</span>} />
        <CardBody>
          <div style={{ display: "grid", gap: 10 }}>
            {projects.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Belum ada project. Buat satu di panel kiri.</div>
            ) : (
              projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  onClick={() => setSelectedProjectId(p.id)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: "rgba(0,0,0,0.20)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontWeight: 800 }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{p.id}</div>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>Open</span>
                </Link>
              ))
            )}
          </div>
        </CardBody>
      </Card>

      <style jsx>{`
        @media (max-width: 980px) {
          div[style*="grid-template-columns: 420px 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 3: Manual verify**

Run:

```bash
npm run dev
```

Expected: `/projects` bisa load list project untuk email dan create project baru.

## Task 5: Project detail `/projects/[projectId]` (assets + upload + CTA)

**Files:**
- Create: `src/app/projects/[projectId]/page.tsx`
- Create: `src/app/projects/[projectId]/ProjectDetailClient.tsx`

- [ ] **Step 1: Server page shell**

Create `src/app/projects/[projectId]/page.tsx`:

```tsx
import { Container } from "@/components/ui/Container";
import { ProjectDetailClient } from "@/app/projects/[projectId]/ProjectDetailClient";

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <main>
      <Container>
        <ProjectDetailClient projectId={projectId} />
      </Container>
    </main>
  );
}
```

- [ ] **Step 2: Client page untuk fetch project + upload asset**

Create `src/app/projects/[projectId]/ProjectDetailClient.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { getUserEmail } from "@/lib/client/userPrefs";

type Asset = { id: string; createdAt?: string; mimeType?: string; width?: number; height?: number; sizeBytes?: string | number };
type Project = { id: string; title: string; assets?: Asset[] };

export function ProjectDetailClient({ projectId }: { projectId: string }) {
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    setUserEmail(getUserEmail() || "demo@example.com");
  }, []);

  const assets = useMemo(() => (Array.isArray(project?.assets) ? project!.assets! : []), [project]);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "failed");
      setProject(data?.project || null);
      setTitle(typeof data?.project?.title === "string" ? data.project.title : "");
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  async function rename() {
    if (title.trim().length < 1) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "failed");
      await load();
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  async function upload() {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/assets`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "failed");
      setFile(null);
      await load();
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [projectId]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 14 }}>
      <Card>
        <CardHeader
          title="Project Detail"
          right={
            <Button variant="secondary" type="button" onClick={load} disabled={loading}>
              Refresh
            </Button>
          }
        />
        <CardBody>
          <div style={{ display: "grid", gap: 10 }}>
            <Field label="projectId">
              <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace" }}>
                {projectId}
              </div>
            </Field>
            <Field label="Title">
              <div style={{ display: "flex", gap: 10 }}>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                <Button type="button" onClick={rename} disabled={loading || title.trim().length < 1}>
                  Simpan
                </Button>
              </div>
            </Field>
            <Field label="Upload asset gambar" hint="Sistem akan menyimpan original + derived 9:16 JPG untuk PixVerse.">
              <div style={{ display: "grid", gap: 10 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  style={{ color: "var(--muted)" }}
                />
                <Button type="button" onClick={upload} disabled={loading || !file}>
                  Upload
                </Button>
              </div>
            </Field>
            {error ? <div style={{ color: "#ff8a8a", fontSize: 12 }}>{error}</div> : null}
            <Link href={`/ad-jobs/new?projectId=${encodeURIComponent(projectId)}`} style={{ display: "inline-flex" }}>
              <Button type="button" disabled={!userEmail.includes("@")}>
                Buat Ad Job
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Assets" right={<span style={{ fontSize: 12, opacity: 0.7 }}>{assets.length} items</span>} />
        <CardBody>
          <div style={{ display: "grid", gap: 10 }}>
            {assets.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Belum ada asset. Upload minimal 1 gambar.</div>
            ) : (
              assets.map((a) => (
                <div
                  key={a.id}
                  style={{ padding: 12, borderRadius: 12, background: "rgba(0,0,0,0.20)", border: "1px solid var(--border)", display: "grid", gap: 6 }}
                >
                  <div style={{ fontWeight: 800 }}>asset_{a.id.slice(0, 6)}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {a.mimeType || "image"} • {a.width || "?"}×{a.height || "?"} • {typeof a.sizeBytes === "string" ? a.sizeBytes : a.sizeBytes?.toString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>

      <style jsx>{`
        @media (max-width: 980px) {
          div[style*="grid-template-columns: 420px 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 3: Manual verify**

Expected: Upload asset sukses dan assets list ter-update.

## Task 6: Dashboard `/ad-jobs` (create shortcut + recent jobs)

**Files:**
- Create: `src/app/ad-jobs/page.tsx`
- Create: `src/app/ad-jobs/AdJobsDashboardClient.tsx`

- [ ] **Step 1: Server page shell**

Create `src/app/ad-jobs/page.tsx`:

```tsx
import { Container } from "@/components/ui/Container";
import { AdJobsDashboardClient } from "@/app/ad-jobs/AdJobsDashboardClient";

export default function AdJobsPage() {
  return (
    <main>
      <Container>
        <AdJobsDashboardClient />
      </Container>
    </main>
  );
}
```

- [ ] **Step 2: Client dashboard (pilih email + project, list jobs, link ke create)**

Create `src/app/ad-jobs/AdJobsDashboardClient.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { getSelectedProjectId, getUserEmail, setSelectedProjectId, setUserEmail } from "@/lib/client/userPrefs";

type Project = { id: string; title: string };
type Segment = { id: string; segmentIndex: number; status: string };
type AdJob = { id: string; status: string; targetDurationSec: number; quality: string; templatePackId: string; estimatedPixverseCredits?: number; segments?: Segment[] };

export function AdJobsDashboardClient() {
  const [userEmail, setUserEmailState] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [adJobs, setAdJobs] = useState<AdJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUserEmailState(getUserEmail() || "demo@example.com");
    setProjectId(getSelectedProjectId() || "");
  }, []);

  const canLoadProjects = useMemo(() => userEmail.includes("@"), [userEmail]);
  const canLoadJobs = useMemo(() => userEmail.includes("@") && projectId.length > 0, [userEmail, projectId]);

  async function loadProjects() {
    if (!canLoadProjects) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?userEmail=${encodeURIComponent(userEmail)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "failed");
      const list = Array.isArray(data?.projects) ? data.projects : [];
      setProjects(list);
      setUserEmail(userEmail);
      if (!projectId && list[0]?.id) {
        setProjectId(list[0].id);
        setSelectedProjectId(list[0].id);
      }
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadJobs() {
    if (!canLoadJobs) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/ad-jobs?projectId=${encodeURIComponent(projectId)}&userEmail=${encodeURIComponent(userEmail)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "failed");
      setAdJobs(Array.isArray(data?.adJobs) ? data.adJobs : []);
      setSelectedProjectId(projectId);
      setUserEmail(userEmail);
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userEmail.includes("@")) loadProjects();
  }, [userEmail]);

  useEffect(() => {
    if (canLoadJobs) loadJobs();
  }, [projectId]);

  function badgeTone(status: string) {
    if (status === "queued") return "queued";
    if (status === "running") return "running";
    if (status === "done") return "done";
    return "neutral";
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 14 }}>
      <Card>
        <CardHeader title="Ad Jobs" right={<Button variant="secondary" type="button" onClick={loadJobs} disabled={!canLoadJobs || loading}>Refresh</Button>} />
        <CardBody>
          <div style={{ display: "grid", gap: 10 }}>
            <Field label="userEmail">
              <Input value={userEmail} onChange={(e) => setUserEmailState(e.target.value)} />
            </Field>
            <Field label="project">
              <Select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setSelectedProjectId(e.target.value);
                }}
              >
                <option value="" disabled>
                  Pilih project
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            </Field>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/projects">
                <Button variant="secondary" type="button">
                  Kelola Projects
                </Button>
              </Link>
              <Link href={projectId ? `/ad-jobs/new?projectId=${encodeURIComponent(projectId)}` : "/ad-jobs/new"}>
                <Button type="button" disabled={!userEmail.includes("@")}>
                  Buat Ad Job
                </Button>
              </Link>
            </div>
            {error ? <div style={{ color: "#ff8a8a", fontSize: 12 }}>{error}</div> : null}
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
              Dashboard ini menampilkan jobs untuk project terpilih.
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Jobs (Recent)" right={<span style={{ fontSize: 12, opacity: 0.7 }}>{adJobs.length} items</span>} />
        <CardBody>
          <div style={{ display: "grid", gap: 10 }}>
            {!canLoadJobs ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Pilih email dan project untuk melihat jobs.</div>
            ) : adJobs.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Belum ada ad job untuk project ini.</div>
            ) : (
              adJobs.map((j) => (
                <Link
                  key={j.id}
                  href={`/ad-jobs/${j.id}`}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: "rgba(0,0,0,0.20)",
                    border: "1px solid var(--border)",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace", fontSize: 12, opacity: 0.9 }}>
                      {j.id}
                    </div>
                    <Badge tone={badgeTone(j.status)}>{j.status}</Badge>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12, color: "var(--muted)" }}>
                    <span>{j.targetDurationSec}s</span>
                    <span>{j.quality}</span>
                    <span>{j.templatePackId}</span>
                    <span>credits est: {typeof j.estimatedPixverseCredits === "number" ? j.estimatedPixverseCredits : "-"}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardBody>
      </Card>

      <style jsx>{`
        @media (max-width: 980px) {
          div[style*="grid-template-columns: 420px 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
```

## Task 7: Halaman create `/ad-jobs/new` (form lengkap)

**Files:**
- Create: `src/app/ad-jobs/new/page.tsx`
- Create: `src/app/ad-jobs/new/AdJobNewClient.tsx`

- [ ] **Step 1: Server page shell**

Create `src/app/ad-jobs/new/page.tsx`:

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

- [ ] **Step 2: Client form untuk create AdJob**

Create `src/app/ad-jobs/new/AdJobNewClient.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getSelectedProjectId, getUserEmail, setSelectedProjectId, setUserEmail } from "@/lib/client/userPrefs";

type Project = { id: string; title: string };
type TemplatePack = { id: string; name: string };

type Quality = "360p" | "540p" | "720p" | "1080p";
type Tone = "friendly" | "professional" | "energetic";
type Language = "id" | "en";

export function AdJobNewClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [userEmail, setUserEmailState] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [templatePacks, setTemplatePacks] = useState<TemplatePack[]>([]);
  const [templatePackId, setTemplatePackId] = useState("ugc_promo");
  const [targetDurationSec, setTargetDurationSec] = useState<30 | 45>(30);
  const [quality, setQuality] = useState<Quality>("720p");
  const [language, setLanguage] = useState<Language>("id");
  const [tone, setTone] = useState<Tone>("friendly");
  const [productName, setProductName] = useState("Produk A");
  const [offer, setOffer] = useState("Diskon 20%");
  const [cta, setCta] = useState("Beli sekarang");
  const [benefitsText, setBenefitsText] = useState("Cepat\nMurah\nAman");
  const [targetAudience, setTargetAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => userEmail.includes("@") && projectId.length > 0, [userEmail, projectId]);

  useEffect(() => {
    const email = getUserEmail() || "demo@example.com";
    setUserEmailState(email);
    const qpProjectId = sp.get("projectId") || "";
    const savedProjectId = getSelectedProjectId() || "";
    setProjectId(qpProjectId || savedProjectId);
  }, []);

  async function loadProjects() {
    if (!userEmail.includes("@")) return;
    setError(null);
    try {
      const res = await fetch(`/api/projects?userEmail=${encodeURIComponent(userEmail)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "failed");
      const list = Array.isArray(data?.projects) ? data.projects : [];
      setProjects(list);
      setUserEmail(userEmail);
      if (!projectId && list[0]?.id) {
        setProjectId(list[0].id);
        setSelectedProjectId(list[0].id);
      }
    } catch (e: any) {
      setError(e?.message || "failed");
    }
  }

  async function loadPacks() {
    setError(null);
    try {
      const res = await fetch("/api/template-packs", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error("failed");
      setTemplatePacks(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "failed");
    }
  }

  useEffect(() => {
    if (userEmail.includes("@")) loadProjects();
  }, [userEmail]);

  useEffect(() => {
    loadPacks();
  }, []);

  async function submit() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const benefits = benefitsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/ad-jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userEmail,
          projectId,
          templatePackId,
          targetDurationSec,
          quality,
          params: {
            language,
            tone,
            productName,
            benefits,
            offer,
            cta,
            targetAudience: targetAudience.trim().length ? targetAudience.trim() : undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "failed");
      const jobId = data?.adJob?.id;
      if (typeof jobId !== "string") throw new Error("missing_jobId");

      setUserEmail(userEmail);
      setSelectedProjectId(projectId);
      router.push(`/ad-jobs/${encodeURIComponent(jobId)}`);
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 14 }}>
      <Card>
        <CardHeader title="Buat Ad Job" right={<span style={{ fontSize: 12, opacity: 0.75 }}>tema dark + ungu</span>} />
        <CardBody>
          <div style={{ display: "grid", gap: 10 }}>
            <Field label="userEmail">
              <Input value={userEmail} onChange={(e) => setUserEmailState(e.target.value)} />
            </Field>
            <Field label="project">
              <Select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setSelectedProjectId(e.target.value);
                }}
              >
                <option value="" disabled>
                  Pilih project
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="templatePack">
              <Select value={templatePackId} onChange={(e) => setTemplatePackId(e.target.value)}>
                {templatePacks.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="duration">
                <Select value={targetDurationSec} onChange={(e) => setTargetDurationSec(Number(e.target.value) === 45 ? 45 : 30)}>
                  <option value={30}>30s</option>
                  <option value={45}>45s</option>
                </Select>
              </Field>
              <Field label="quality">
                <Select value={quality} onChange={(e) => setQuality(e.target.value as Quality)}>
                  <option value="360p">360p</option>
                  <option value="540p">540p</option>
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                </Select>
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="language">
                <Select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
                  <option value="id">id</option>
                  <option value="en">en</option>
                </Select>
              </Field>
              <Field label="tone">
                <Select value={tone} onChange={(e) => setTone(e.target.value as Tone)}>
                  <option value="friendly">friendly</option>
                  <option value="professional">professional</option>
                  <option value="energetic">energetic</option>
                </Select>
              </Field>
            </div>
            <Field label="productName">
              <Input value={productName} onChange={(e) => setProductName(e.target.value)} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="offer">
                <Input value={offer} onChange={(e) => setOffer(e.target.value)} />
              </Field>
              <Field label="cta">
                <Input value={cta} onChange={(e) => setCta(e.target.value)} />
              </Field>
            </div>
            <Field label="benefits (1 per line)">
              <textarea
                value={benefitsText}
                onChange={(e) => setBenefitsText(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 86,
                  borderRadius: 10,
                  padding: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "var(--text)",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </Field>
            <Field label="targetAudience (opsional)">
              <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Contoh: ibu muda, mahasiswa, pekerja kantoran..." />
            </Field>
            {error ? <div style={{ color: "#ff8a8a", fontSize: 12 }}>{error}</div> : null}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button type="button" onClick={submit} disabled={!canSubmit || loading}>
                Generate Video
              </Button>
              <Button variant="secondary" type="button" onClick={() => router.push("/ad-jobs")} disabled={loading}>
                Kembali
              </Button>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
              Submit akan membuat AdJob + segments dan enqueue task <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace" }}>pixverse.upload_image</span>.
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Catatan" />
        <CardBody>
          <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.7 }}>
            <div>- Untuk MVP ini, sistem belum meminta pemilihan “asset utama” saat create AdJob.</div>
            <div>- Upload asset dilakukan di halaman Project Detail.</div>
            <div>- Setelah job dibuat, buka halaman status untuk memantau segment.</div>
          </div>
        </CardBody>
      </Card>

      <style jsx>{`
        @media (max-width: 980px) {
          div[style*="grid-template-columns: 420px 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
```

## Task 8: Halaman status `/ad-jobs/[jobId]` (polling + segments)

**Files:**
- Create: `src/app/ad-jobs/[jobId]/page.tsx`
- Create: `src/app/ad-jobs/[jobId]/AdJobDetailClient.tsx`

- [ ] **Step 1: Server page shell**

Create `src/app/ad-jobs/[jobId]/page.tsx`:

```tsx
import { Container } from "@/components/ui/Container";
import { AdJobDetailClient } from "@/app/ad-jobs/[jobId]/AdJobDetailClient";

export default async function AdJobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return (
    <main>
      <Container>
        <AdJobDetailClient jobId={jobId} />
      </Container>
    </main>
  );
}
```

- [ ] **Step 2: Client detail dengan polling**

Create `src/app/ad-jobs/[jobId]/AdJobDetailClient.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Field } from "@/components/ui/Field";
import { getUserEmail } from "@/lib/client/userPrefs";

type Segment = { id: string; segmentIndex: number; status: string; promptFinal?: string | null; pixverseImgId?: string | null; pixverseVideoId?: string | null };
type AdJob = {
  id: string;
  status: string;
  quality: string;
  targetDurationSec: number;
  templatePackId: string;
  estimatedPixverseCredits?: number;
  generateAudio?: boolean;
  createdAt?: string;
  segments: Segment[];
};

export function AdJobDetailClient({ jobId }: { jobId: string }) {
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adJob, setAdJob] = useState<AdJob | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setUserEmail(getUserEmail() || "demo@example.com");
  }, []);

  const segments = useMemo(() => (Array.isArray(adJob?.segments) ? adJob!.segments : []), [adJob]);
  const doneCount = useMemo(() => segments.filter((s) => s.status === "done").length, [segments]);
  const progress = useMemo(() => (segments.length ? Math.round((doneCount / segments.length) * 100) : 0), [segments.length, doneCount]);

  function tone(status: string) {
    if (status === "queued") return "queued";
    if (status === "running") return "running";
    if (status === "done") return "done";
    return "neutral";
  }

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const qp = userEmail.includes("@") ? `?userEmail=${encodeURIComponent(userEmail)}` : "";
      const res = await fetch(`/api/ad-jobs/${encodeURIComponent(jobId)}${qp}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "failed");
      setAdJob(data?.adJob || null);
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [jobId, userEmail]);

  useEffect(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => load(), 3500);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [jobId, userEmail]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 14 }}>
      <Card>
        <CardHeader title="Job Detail" right={<Button variant="secondary" type="button" onClick={load} disabled={loading}>Refresh</Button>} />
        <CardBody>
          <div style={{ display: "grid", gap: 10 }}>
            <Field label="jobId">
              <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace" }}>
                {jobId}
              </div>
            </Field>
            {adJob ? (
              <>
                <Field label="Status">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <Badge tone={tone(adJob.status)}>{adJob.status}</Badge>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{progress}%</span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <ProgressBar value={progress} />
                  </div>
                </Field>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12, color: "var(--muted)" }}>
                  <span>{adJob.targetDurationSec}s</span>
                  <span>{adJob.quality}</span>
                  <span>{adJob.templatePackId}</span>
                  <span>credits est: {typeof adJob.estimatedPixverseCredits === "number" ? adJob.estimatedPixverseCredits : "-"}</span>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button variant="secondary" type="button" disabled>
                    Download (soon)
                  </Button>
                  <Link href="/ad-jobs">
                    <Button variant="secondary" type="button">
                      Back
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Memuat data job…</div>
            )}
            {error ? <div style={{ color: "#ff8a8a", fontSize: 12 }}>{error}</div> : null}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Segments" right={<span style={{ fontSize: 12, opacity: 0.7 }}>{segments.length} items</span>} />
        <CardBody>
          <div style={{ display: "grid", gap: 10 }}>
            {segments.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Belum ada segment.</div>
            ) : (
              segments.map((s) => (
                <div key={s.id} style={{ padding: 12, borderRadius: 12, background: "rgba(0,0,0,0.20)", border: "1px solid var(--border)", display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div style={{ fontWeight: 800 }}>Segment {s.segmentIndex}</div>
                    <Badge tone={tone(s.status)}>{s.status}</Badge>
                  </div>
                  <ProgressBar value={s.status === "done" ? 100 : s.status === "running" ? 55 : 12} />
                  <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                    pixverseImgId: {s.pixverseImgId || "—"} • pixverseVideoId: {s.pixverseVideoId || "—"}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>

      <style jsx>{`
        @media (max-width: 980px) {
          div[style*="grid-template-columns: 420px 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
```

## Task 9: Verification (build + minimal smoke)

**Files:**
- None

- [ ] **Step 1: Typecheck & build**

Run:

```bash
npm run build
```

Expected: sukses.

- [ ] **Step 2: Run unit tests**

Run:

```bash
npm test
```

Expected: semua tests di `tests/*.test.ts` PASS.

---

## Self-Review Checklist

- Spec coverage: semua route yang disebut di spec ada implementasinya (home, projects, project detail, ad-jobs dashboard, ad-jobs new, ad-job detail).
- No placeholders: tidak ada TODO/TBD di plan dan code snippets.
- Konsistensi API: query param `userEmail` dipakai sesuai API, route path sesuai `src/app/api/*`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-30-mbg-ui-pages.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
