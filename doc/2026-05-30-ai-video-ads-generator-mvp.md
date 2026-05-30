# AI Video Ads Generator MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an MVP SaaS that generates TikTok-ready product ad videos (5/10/15s, 9:16, no-audio) from uploaded product images using PixVerse v6, with Auth.js + credits + async job worker.

**Architecture:** Next.js App Router app with Prisma/Postgres as the system of record. API routes create jobs and store state; a separate Node worker polls PixVerse results and settles credits. Assets/videos stored in private storage with signed download/share links.

**Tech Stack:** Next.js (App Router) + TypeScript, shadcn/ui + Tailwind, Auth.js + Prisma Adapter, PostgreSQL + Prisma, Sharp (image crop), Node worker, PixVerse REST API.

---

## 0) Project Structure (to be created)

- `src/app/(auth)/login/page.tsx`
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/projects/[projectId]/page.tsx`
- `src/app/s/[token]/page.tsx`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/projects/route.ts`
- `src/app/api/projects/[projectId]/assets/route.ts`
- `src/app/api/jobs/route.ts`
- `src/app/api/jobs/[jobId]/route.ts`
- `src/app/api/jobs/[jobId]/download/route.ts`
- `src/app/api/share-links/route.ts`
- `src/lib/auth.ts`
- `src/lib/db.ts`
- `src/lib/env.ts`
- `src/lib/pricing.ts`
- `src/lib/credits.ts`
- `src/lib/rate-limit.ts`
- `src/lib/storage.ts`
- `src/lib/image-preprocess.ts`
- `src/lib/pixverse.ts`
- `worker/poll-jobs.ts`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `.env.example`
- `README.md`

---

## Task 1: Scaffold Next.js + Tailwind + TypeScript

**Files:**
- Create: project scaffolding (Next.js)
- Create: `.env.example`
- Create: `README.md` (initial)

- [ ] **Step 1: Scaffold Next.js App Router project in repo root (keep `doc/` and `docs/`)**

Run:

```bash
CI=true npm create next-app@latest . -- --yes --ts --eslint --tailwind --app --src-dir --import-alias "@/*"
```

Expected: Next.js project files created and `doc/` preserved.

- [ ] **Step 2: Add baseline env example**

Create `.env.example`:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_ads?schema=public"
AUTH_SECRET="replace-me"
AUTH_URL="http://localhost:3000"
PIXVERSE_API_KEY="replace-me"
APP_BASE_URL="http://localhost:3000"
STORAGE_DRIVER="local"
LOCAL_STORAGE_DIR="./.local_storage"
SIGNED_URL_SECRET="replace-me"
```

- [ ] **Step 3: Add initial README**

Create `README.md`:

```md
# AI Video Ads Generator (MVP)

MVP: Generate TikTok-ready (9:16, 5/10/15s, no-audio) product ad videos via PixVerse v6.

## Prereqs
- Node 18+
- Postgres

## Setup
1. Copy `.env.example` to `.env` and fill values
2. Install deps: `npm install`
3. DB migrate: `npx prisma migrate dev`
4. Seed: `npx prisma db seed`
5. Dev server: `npm run dev`
6. Worker (separate terminal): `npm run worker`
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold nextjs app"
```

---

## Task 2: Install shadcn/ui and base UI components

**Files:**
- Create: `components.json` (via shadcn init)
- Modify: `src/app/globals.css` (shadcn tokens)

- [ ] **Step 1: Initialize shadcn**

Run:

```bash
CI=true npx shadcn@latest init --defaults
```

Expected: `components.json` created, Tailwind tokens applied.

- [ ] **Step 2: Add required components**

Run:

```bash
CI=true npx shadcn@latest add button card input label select textarea separator dropdown-menu dialog toast
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: init shadcn ui"
```

---

## Task 3: Setup Prisma + Postgres schema (including Auth.js tables)

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/db.ts`

- [ ] **Step 1: Install Prisma**

Run:

```bash
npm install prisma @prisma/client
npx prisma init
```

- [ ] **Step 2: Define Prisma schema**

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]

  projects      Project[]
  assets        Asset[]
  jobs          GenerationJob[]
  creditLedger  CreditLedger[]
  shareLinks    ShareLink[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String?
  access_token       String?
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?
  session_state      String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Project {
  id        String   @id @default(cuid())
  userId    String
  title     String
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  assets Asset[]
  jobs   GenerationJob[]

  @@index([userId, createdAt])
}

model Asset {
  id         String    @id @default(cuid())
  userId     String
  projectId  String
  url        String
  mimeType   String
  width      Int
  height     Int
  sizeBytes  Int
  createdAt  DateTime  @default(now())
  deletedAt  DateTime?

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId, createdAt])
}

model TemplatePack {
  id        String   @id
  name      String
  tags      String[]
  basePrompt String
  defaults  Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  jobs GenerationJob[]
}

enum JobStatus {
  queued
  generating
  done
  failed
  cancelled
}

model GenerationJob {
  id             String    @id @default(cuid())
  userId         String
  projectId      String
  packId         String
  status         JobStatus @default(queued)
  provider       String
  providerJobId  String?

  params         Json
  promptFinal    String

  quoteCredits   Int
  settleCredits  Int?

  failureCode    String?
  failureMessage String?

  createdAt      DateTime  @default(now())
  startedAt      DateTime?
  finishedAt     DateTime?

  idempotencyKey String

  user    User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  project Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  pack    TemplatePack @relation(fields: [packId], references: [id])
  video   VideoAsset?

  @@unique([userId, idempotencyKey])
  @@index([status, createdAt])
  @@index([projectId, createdAt])
}

model VideoAsset {
  id            String   @id @default(cuid())
  jobId         String   @unique
  url           String
  durationSeconds Int
  resolution    String
  fileSizeBytes Int?
  format        String
  aspectRatio   String
  createdAt     DateTime @default(now())

  job GenerationJob @relation(fields: [jobId], references: [id], onDelete: Cascade)
}

enum CreditReason {
  trial_grant
  consume
  refund
  adjustment
}

enum CreditRefType {
  job
  admin
}

model CreditLedger {
  id        String       @id @default(cuid())
  userId    String
  delta     Int
  reason    CreditReason
  refType   CreditRefType
  refId     String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@index([refType, refId])
}

model ShareLink {
  id        String   @id @default(cuid())
  userId    String
  jobId     String
  tokenHash String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  revokedAt DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  job  GenerationJob @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@index([jobId])
}
```

- [ ] **Step 3: Create Prisma client helper**

Create `src/lib/db.ts`:

```ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

- [ ] **Step 4: Create seed for template packs**

Create `prisma/seed.ts`:

```ts
import { prisma } from "../src/lib/db"

async function main() {
  await prisma.templatePack.upsert({
    where: { id: "ugc_hook" },
    update: {},
    create: {
      id: "ugc_hook",
      name: "UGC Hook",
      tags: ["ugc", "hook", "tiktok"],
      basePrompt:
        "Short-form UGC product ad. Hook fast, show product clearly, emphasize benefit, end with CTA.",
      defaults: {
        tone: "energetic",
        pacing: "fast",
      },
    },
  })

  await prisma.templatePack.upsert({
    where: { id: "flash_sale" },
    update: {},
    create: {
      id: "flash_sale",
      name: "Flash Sale",
      tags: ["sale", "urgency", "tiktok"],
      basePrompt:
        "Flash sale product ad with urgency. Big offer, countdown vibe, strong CTA.",
      defaults: {
        tone: "energetic",
        pacing: "fast",
      },
    },
  })

  await prisma.templatePack.upsert({
    where: { id: "benefit_stack" },
    update: {},
    create: {
      id: "benefit_stack",
      name: "Benefit Stack",
      tags: ["benefits", "tiktok"],
      basePrompt:
        "Product ad showing 3 quick benefits with clean visuals and strong clarity.",
      defaults: {
        tone: "friendly",
        pacing: "medium",
      },
    },
  })

  await prisma.templatePack.upsert({
    where: { id: "social_proof" },
    update: {},
    create: {
      id: "social_proof",
      name: "Social Proof",
      tags: ["reviews", "trust", "tiktok"],
      basePrompt:
        "Product ad that highlights social proof and trust signals, then CTA.",
      defaults: {
        tone: "friendly",
        pacing: "medium",
      },
    },
  })

  await prisma.templatePack.upsert({
    where: { id: "before_after" },
    update: {},
    create: {
      id: "before_after",
      name: "Before/After",
      tags: ["transformation", "tiktok"],
      basePrompt:
        "Before/after transformation product ad. Clear contrast, quick payoff, CTA.",
      defaults: {
        tone: "energetic",
        pacing: "fast",
      },
    },
  })

  await prisma.templatePack.upsert({
    where: { id: "premium_luxury" },
    update: {},
    create: {
      id: "premium_luxury",
      name: "Premium/Luxury",
      tags: ["luxury", "premium", "tiktok"],
      basePrompt:
        "Premium product ad with clean minimal luxury vibe, soft camera movement, CTA.",
      defaults: {
        tone: "professional",
        pacing: "slow",
      },
    },
  })
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    await prisma.$disconnect()
    throw e
  })
```

- [ ] **Step 5: Wire Prisma seed command**

Modify `package.json` to include:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Install `tsx`:

```bash
npm install -D tsx
```

- [ ] **Step 6: Run migrate + seed**

Run:

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Expected: migration applied and template packs inserted.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: add prisma schema and seed"
```

---

## Task 4: Configure Auth.js (Prisma adapter, database sessions)

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Install Auth.js**

Run:

```bash
npm install next-auth @auth/prisma-adapter
```

- [ ] **Step 2: Create Auth.js config**

Create `src/lib/auth.ts`:

```ts
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Email from "next-auth/providers/email"
import { prisma } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Email({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
})
```

- [ ] **Step 3: Add Auth route handlers**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
```

- [ ] **Step 4: Add login page**

Create `src/app/(auth)/login/page.tsx`:

```tsx
import { signIn } from "@/lib/auth"

export default function LoginPage() {
  return (
    <form
      action={async (formData) => {
        "use server"
        await signIn("email", formData)
      }}
      className="mx-auto flex w-full max-w-sm flex-col gap-4 p-6"
    >
      <h1 className="text-xl font-semibold">Sign in</h1>
      <label className="text-sm">
        Email
        <input
          className="mt-2 w-full rounded-md border bg-background px-3 py-2"
          name="email"
          type="email"
          required
        />
      </label>
      <button
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        type="submit"
      >
        Send link
      </button>
    </form>
  )
}
```

- [ ] **Step 5: Add env for Email provider (dev can be disabled)**

Update `.env.example`:

```dotenv
EMAIL_SERVER="smtp://user:pass@localhost:1025"
EMAIL_FROM="noreply@example.com"
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add authjs with prisma adapter"
```

---

## Task 5: Credits system (trial=100, pricing, ledger, idempotent settle/refund)

**Files:**
- Create: `src/lib/pricing.ts`
- Create: `src/lib/credits.ts`
- Create: `src/app/api/credits/balance/route.ts`
- Create: `src/app/api/credits/ledger/route.ts`
- Test: `src/lib/pricing.test.ts`

- [ ] **Step 1: Add pricing library and tests**

Install:

```bash
npm install -D vitest
```

Create `src/lib/pricing.ts`:

```ts
export type DurationSeconds = 5 | 10 | 15
export type Quality = "540p" | "720p" | "1080p"

export function quoteCredits(duration: DurationSeconds, quality: Quality) {
  const base = duration === 5 ? 1 : duration === 10 ? 2 : 3
  const multiplier = quality === "540p" ? 1 : quality === "720p" ? 1.5 : 2
  return Math.ceil(base * multiplier)
}
```

Create `src/lib/pricing.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { quoteCredits } from "@/lib/pricing"

describe("quoteCredits", () => {
  it("quotes 5s 540p", () => {
    expect(quoteCredits(5, "540p")).toBe(1)
  })

  it("quotes 10s 720p", () => {
    expect(quoteCredits(10, "720p")).toBe(3)
  })

  it("quotes 15s 1080p", () => {
    expect(quoteCredits(15, "1080p")).toBe(6)
  })
})
```

Add script to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run"
  }
}
```

- [ ] **Step 2: Run tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 3: Credits ledger helpers**

Create `src/lib/credits.ts`:

```ts
import { prisma } from "@/lib/db"

export async function getCreditsBalance(userId: string) {
  const agg = await prisma.creditLedger.aggregate({
    where: { userId },
    _sum: { delta: true },
  })
  return agg._sum.delta ?? 0
}

export async function grantTrialCreditsIfNone(userId: string) {
  const existing = await prisma.creditLedger.findFirst({
    where: { userId, reason: "trial_grant" },
    select: { id: true },
  })
  if (existing) return

  await prisma.creditLedger.create({
    data: {
      userId,
      delta: 100,
      reason: "trial_grant",
      refType: "admin",
      refId: "trial_100",
    },
  })
}

export async function consumeCreditsForJob(params: {
  userId: string
  jobId: string
  quoteCredits: number
}) {
  await prisma.creditLedger.create({
    data: {
      userId: params.userId,
      delta: -Math.abs(params.quoteCredits),
      reason: "consume",
      refType: "job",
      refId: params.jobId,
    },
  })
}

export async function refundCreditsForJob(params: {
  userId: string
  jobId: string
  amount: number
}) {
  const alreadyRefunded = await prisma.creditLedger.findFirst({
    where: { userId: params.userId, reason: "refund", refType: "job", refId: params.jobId },
    select: { id: true },
  })
  if (alreadyRefunded) return

  await prisma.creditLedger.create({
    data: {
      userId: params.userId,
      delta: Math.abs(params.amount),
      reason: "refund",
      refType: "job",
      refId: params.jobId,
    },
  })
}
```

- [ ] **Step 4: Credits API routes**

Create `src/app/api/credits/balance/route.ts`:

```ts
import { auth } from "@/lib/auth"
import { getCreditsBalance, grantTrialCreditsIfNone } from "@/lib/credits"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 })

  await grantTrialCreditsIfNone(session.user.id)
  const balance = await getCreditsBalance(session.user.id)
  return Response.json({ balance })
}
```

Create `src/app/api/credits/ledger/route.ts`:

```ts
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { grantTrialCreditsIfNone } from "@/lib/credits"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 })

  await grantTrialCreditsIfNone(session.user.id)
  const items = await prisma.creditLedger.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  return Response.json({ items })
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add credits pricing and ledger"
```

---

## Task 6: Local storage + signed URLs + image preprocess (crop 9:16)

**Files:**
- Create: `src/lib/env.ts`
- Create: `src/lib/storage.ts`
- Create: `src/lib/image-preprocess.ts`

- [ ] **Step 1: Install Sharp**

```bash
npm install sharp
```

- [ ] **Step 2: Env helper**

Create `src/lib/env.ts`:

```ts
export function requireEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}
```

- [ ] **Step 3: Storage abstraction (local)**

Create `src/lib/storage.ts`:

```ts
import crypto from "crypto"
import fs from "fs/promises"
import path from "path"
import { requireEnv } from "@/lib/env"

function baseDir() {
  return requireEnv("LOCAL_STORAGE_DIR")
}

export async function putObject(params: { key: string; bytes: Buffer; contentType: string }) {
  const abs = path.join(process.cwd(), baseDir(), params.key)
  await fs.mkdir(path.dirname(abs), { recursive: true })
  await fs.writeFile(abs, params.bytes)
  return { key: params.key, contentType: params.contentType }
}

export async function getObject(params: { key: string }) {
  const abs = path.join(process.cwd(), baseDir(), params.key)
  const bytes = await fs.readFile(abs)
  return { bytes }
}

export function signDownloadKey(params: { key: string; expiresAtMs: number }) {
  const secret = requireEnv("SIGNED_URL_SECRET")
  const payload = `${params.key}:${params.expiresAtMs}`
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex")
  return { key: params.key, expiresAtMs: params.expiresAtMs, sig }
}

export function verifySignedKey(params: { key: string; expiresAtMs: number; sig: string }) {
  if (Date.now() > params.expiresAtMs) return false
  const secret = requireEnv("SIGNED_URL_SECRET")
  const payload = `${params.key}:${params.expiresAtMs}`
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex")
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(params.sig))
}
```

- [ ] **Step 4: Image preprocess crop to 9:16**

Create `src/lib/image-preprocess.ts`:

```ts
import sharp from "sharp"

export async function cropToPortrait916(params: { bytes: Buffer }) {
  const img = sharp(params.bytes)
  const meta = await img.metadata()
  if (!meta.width || !meta.height) throw new Error("invalid_image")

  const targetRatio = 9 / 16
  const srcRatio = meta.width / meta.height

  let width = meta.width
  let height = meta.height
  if (srcRatio > targetRatio) {
    width = Math.floor(meta.height * targetRatio)
  } else if (srcRatio < targetRatio) {
    height = Math.floor(meta.width / targetRatio)
  }

  const left = Math.floor((meta.width - width) / 2)
  const top = Math.floor((meta.height - height) / 2)

  const out = await img
    .extract({ left, top, width, height })
    .resize(1080, 1920, { fit: "cover" })
    .webp({ quality: 90 })
    .toBuffer()

  return { bytes: out, width: 1080, height: 1920, mimeType: "image/webp" }
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add local storage, signed url, portrait crop"
```

---

## Task 7: PixVerse client (v6 lock, no-audio, upload + generate + result)

**Files:**
- Create: `src/lib/pixverse.ts`

- [ ] **Step 1: Implement PixVerse REST client**

Create `src/lib/pixverse.ts`:

```ts
import crypto from "crypto"
import { requireEnv } from "@/lib/env"

const BASE_URL = "https://app-api.pixverse.ai/openapi/v2"

type PixVerseResp<T> = { ErrCode?: number; ErrMsg?: string; Resp?: T }

function traceId() {
  return crypto.randomUUID()
}

async function pixverseFetch<T>(url: string, init: RequestInit) {
  const apiKey = requireEnv("PIXVERSE_API_KEY")
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      "API-KEY": apiKey,
      "Ai-trace-id": traceId(),
    },
  })
  const json = (await res.json()) as PixVerseResp<T>
  if (!json || json.ErrCode !== 0 || !json.Resp) {
    throw new Error(`pixverse_error:${json?.ErrCode ?? "unknown"}:${json?.ErrMsg ?? "unknown"}`)
  }
  return json.Resp
}

export async function pixverseUploadImage(params: { bytes: Buffer; filename: string }) {
  const form = new FormData()
  const blob = new Blob([params.bytes])
  form.append("image", blob, params.filename)
  return pixverseFetch<{ img_id: number; img_url?: string }>(`${BASE_URL}/image/upload`, {
    method: "POST",
    body: form,
  })
}

export type PixVerseQuality = "540p" | "720p" | "1080p"

export async function pixverseGenerateImageToVideo(params: {
  imgId: number
  prompt: string
  duration: 5 | 10 | 15
  quality: PixVerseQuality
  seed?: number
}) {
  return pixverseFetch<{ video_id: number }>(`${BASE_URL}/video/img/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      img_id: params.imgId,
      prompt: params.prompt,
      model: "v6",
      duration: params.duration,
      quality: params.quality,
      seed: params.seed ?? 0,
      generate_audio_switch: false,
    }),
  })
}

export type PixVerseResult = {
  status: number
  url?: string
  outputWidth?: number
  outputHeight?: number
}

export async function pixverseGetVideoResult(videoId: number) {
  return pixverseFetch<PixVerseResult>(`${BASE_URL}/video/result/${videoId}`, {
    method: "GET",
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add pixverse client"
```

---

## Task 8: Projects + Assets API (upload 1–5 images)

**Files:**
- Create: `src/app/api/projects/route.ts`
- Create: `src/app/api/projects/[projectId]/assets/route.ts`

- [ ] **Step 1: Projects API**

Create `src/app/api/projects/route.ts`:

```ts
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 })
  const items = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  return Response.json({ items })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 })
  const body = (await req.json()) as { title?: string; notes?: string }
  const title = body.title?.trim() || `Quick — ${new Date().toISOString()}`
  const project = await prisma.project.create({
    data: { userId: session.user.id, title, notes: body.notes?.trim() || null },
  })
  return Response.json({ project })
}
```

- [ ] **Step 2: Assets upload API (crop to 9:16, store locally)**

Create `src/app/api/projects/[projectId]/assets/route.ts`:

```ts
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { cropToPortrait916 } from "@/lib/image-preprocess"
import { putObject } from "@/lib/storage"

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 })
  const { projectId } = await ctx.params

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
  if (!project) return Response.json({ error: "not_found" }, { status: 404 })

  const form = await req.formData()
  const file = form.get("file")
  if (!(file instanceof File)) return Response.json({ error: "invalid_file" }, { status: 400 })
  if (file.size > 10 * 1024 * 1024) return Response.json({ error: "file_too_large" }, { status: 400 })

  const bytes = Buffer.from(await file.arrayBuffer())
  const cropped = await cropToPortrait916({ bytes })
  const key = `assets/${session.user.id}/${projectId}/${crypto.randomUUID()}.webp`
  await putObject({ key, bytes: cropped.bytes, contentType: cropped.mimeType })

  const asset = await prisma.asset.create({
    data: {
      userId: session.user.id,
      projectId,
      url: key,
      mimeType: cropped.mimeType,
      width: cropped.width,
      height: cropped.height,
      sizeBytes: cropped.bytes.length,
    },
  })

  return Response.json({ asset })
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add projects and asset upload"
```

---

## Task 9: Job creation API (quote credits, idempotency, call PixVerse generate)

**Files:**
- Create: `src/lib/rate-limit.ts`
- Create: `src/app/api/jobs/route.ts`
- Create: `src/app/api/jobs/[jobId]/route.ts`

- [ ] **Step 1: Rate limit helper (DB counting)**

Create `src/lib/rate-limit.ts`:

```ts
import { prisma } from "@/lib/db"

export async function assertJobCreateRateLimit(userId: string) {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [hourCount, dayCount, generatingCount] = await Promise.all([
    prisma.generationJob.count({ where: { userId, createdAt: { gte: oneHourAgo } } }),
    prisma.generationJob.count({ where: { userId, createdAt: { gte: oneDayAgo } } }),
    prisma.generationJob.count({ where: { userId, status: "generating" } }),
  ])

  if (generatingCount >= 2) throw new Error("rate_limit_concurrency_user")
  if (hourCount >= 10) throw new Error("rate_limit_hour")
  if (dayCount >= 30) throw new Error("rate_limit_day")
}
```

- [ ] **Step 2: Implement Jobs create**

Create `src/app/api/jobs/route.ts`:

```ts
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { quoteCredits, type DurationSeconds, type Quality } from "@/lib/pricing"
import { getCreditsBalance, grantTrialCreditsIfNone, consumeCreditsForJob } from "@/lib/credits"
import { pixverseUploadImage, pixverseGenerateImageToVideo } from "@/lib/pixverse"
import { getObject } from "@/lib/storage"
import { assertJobCreateRateLimit } from "@/lib/rate-limit"

type Body = {
  projectId: string
  packId: string
  duration: DurationSeconds
  quality: Quality
  productName: string
  offer?: string
  cta?: string
  tone?: string
  language?: "id" | "en"
  benefits?: string[]
  idempotencyKey: string
}

function buildPrompt(input: Body, pack: { name: string; basePrompt: string }) {
  const benefits = (input.benefits ?? []).slice(0, 3).filter(Boolean)
  const parts = [
    pack.basePrompt,
    `Pack: ${pack.name}`,
    `Product: ${input.productName}`,
    benefits.length ? `Benefits: ${benefits.join(" | ")}` : "",
    input.offer ? `Offer: ${input.offer}` : "",
    input.cta ? `CTA: ${input.cta}` : "",
    `Language: ${input.language ?? "id"}`,
    `Tone: ${input.tone ?? "energetic"}`,
    `Constraints: 9:16 portrait, ${input.duration}s, no audio, TikTok pacing, show product clearly, no watermark.`,
  ].filter(Boolean)
  return parts.join("\n")
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 })
  const body = (await req.json()) as Body

  await grantTrialCreditsIfNone(session.user.id)
  await assertJobCreateRateLimit(session.user.id)

  const pack = await prisma.templatePack.findUnique({ where: { id: body.packId } })
  if (!pack) return Response.json({ error: "invalid_pack" }, { status: 400 })

  const project = await prisma.project.findFirst({
    where: { id: body.projectId, userId: session.user.id },
    select: { id: true },
  })
  if (!project) return Response.json({ error: "invalid_project" }, { status: 400 })

  const quote = quoteCredits(body.duration, body.quality)
  const balance = await getCreditsBalance(session.user.id)
  if (balance < quote) return Response.json({ error: "insufficient_credits", quote, balance }, { status: 402 })

  const existing = await prisma.generationJob.findUnique({
    where: { userId_idempotencyKey: { userId: session.user.id, idempotencyKey: body.idempotencyKey } },
  })
  if (existing) return Response.json({ jobId: existing.id, quoteCredits: existing.quoteCredits })

  const promptFinal = buildPrompt(body, { name: pack.name, basePrompt: pack.basePrompt })

  const firstAsset = await prisma.asset.findFirst({
    where: { projectId: project.id, userId: session.user.id, deletedAt: null },
    orderBy: { createdAt: "asc" },
  })
  if (!firstAsset) return Response.json({ error: "no_assets" }, { status: 400 })

  const job = await prisma.generationJob.create({
    data: {
      userId: session.user.id,
      projectId: project.id,
      packId: pack.id,
      status: "generating",
      provider: "pixverse",
      params: {
        duration: body.duration,
        quality: body.quality,
        productName: body.productName,
        offer: body.offer ?? null,
        cta: body.cta ?? null,
      },
      promptFinal,
      quoteCredits: quote,
      idempotencyKey: body.idempotencyKey,
      startedAt: new Date(),
    },
  })

  await consumeCreditsForJob({ userId: session.user.id, jobId: job.id, quoteCredits: quote })

  const assetBytes = await getObject({ key: firstAsset.url })
  const uploaded = await pixverseUploadImage({ bytes: assetBytes.bytes, filename: "image.webp" })
  const gen = await pixverseGenerateImageToVideo({
    imgId: uploaded.img_id,
    prompt: promptFinal,
    duration: body.duration,
    quality: body.quality,
  })

  await prisma.generationJob.update({
    where: { id: job.id },
    data: { providerJobId: String(gen.video_id) },
  })

  return Response.json({ jobId: job.id, quoteCredits: quote })
}
```

- [ ] **Step 3: Job status endpoint**

Create `src/app/api/jobs/[jobId]/route.ts`:

```ts
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(_: Request, ctx: { params: Promise<{ jobId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 })
  const { jobId } = await ctx.params
  const job = await prisma.generationJob.findFirst({
    where: { id: jobId, userId: session.user.id },
    include: { video: true, pack: true },
  })
  if (!job) return Response.json({ error: "not_found" }, { status: 404 })
  return Response.json({ job })
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add job create and status api"
```

---

## Task 10: Worker to poll PixVerse results (TTL=20m, schedule 3s/5s/10s)

**Files:**
- Create: `worker/poll-jobs.ts`
- Modify: `package.json` scripts

- [ ] **Step 1: Implement worker**

Create `worker/poll-jobs.ts`:

```ts
import { prisma } from "../src/lib/db"
import { pixverseGetVideoResult } from "../src/lib/pixverse"
import { refundCreditsForJob } from "../src/lib/credits"

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function is916(w?: number, h?: number) {
  if (!w || !h) return false
  return Math.abs(w / h - 9 / 16) < 0.02
}

function isValidDurationSeconds(s?: number) {
  return s === 5 || s === 10 || s === 15
}

async function tick() {
  const globalGenerating = await prisma.generationJob.count({ where: { status: "generating" } })
  if (globalGenerating > 20) return

  const jobs = await prisma.generationJob.findMany({
    where: { status: "generating", provider: "pixverse", providerJobId: { not: null } },
    orderBy: { startedAt: "asc" },
    take: 20,
  })

  for (const job of jobs) {
    const startedAt = job.startedAt?.getTime() ?? job.createdAt.getTime()
    const ageMs = Date.now() - startedAt
    const ttlMs = 20 * 60 * 1000

    if (ageMs > ttlMs) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          failureCode: "timeout_ttl",
          failureMessage: "Timed out waiting for PixVerse result",
          finishedAt: new Date(),
        },
      })
      await refundCreditsForJob({ userId: job.userId, jobId: job.id, amount: job.quoteCredits })
      continue
    }

    const videoId = Number(job.providerJobId)
    if (!Number.isFinite(videoId)) continue

    let resp
    try {
      resp = await pixverseGetVideoResult(videoId)
    } catch (e) {
      continue
    }

    if (resp.status === 5) continue

    if (resp.status === 7) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          failureCode: "moderation_failed",
          failureMessage: "PixVerse moderation failed",
          finishedAt: new Date(),
        },
      })
      await refundCreditsForJob({ userId: job.userId, jobId: job.id, amount: job.quoteCredits })
      continue
    }

    if (resp.status === 8 || !resp.url) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          failureCode: "generation_failed",
          failureMessage: "PixVerse generation failed",
          finishedAt: new Date(),
        },
      })
      await refundCreditsForJob({ userId: job.userId, jobId: job.id, amount: job.quoteCredits })
      continue
    }

    const ratioOk = is916(resp.outputWidth, resp.outputHeight)
    if (!ratioOk) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          failureCode: "failed_invalid_output",
          failureMessage: "Invalid aspect ratio (expected 9:16)",
          finishedAt: new Date(),
        },
      })
      await refundCreditsForJob({ userId: job.userId, jobId: job.id, amount: job.quoteCredits })
      continue
    }

    const expectedDuration = (job.params as any)?.duration
    if (!isValidDurationSeconds(expectedDuration)) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          failureCode: "failed_invalid_job_params",
          failureMessage: "Invalid requested duration",
          finishedAt: new Date(),
        },
      })
      await refundCreditsForJob({ userId: job.userId, jobId: job.id, amount: job.quoteCredits })
      continue
    }

    await prisma.videoAsset.create({
      data: {
        jobId: job.id,
        url: resp.url,
        durationSeconds: expectedDuration,
        resolution: `${resp.outputWidth ?? 0}x${resp.outputHeight ?? 0}`,
        format: "mp4",
        aspectRatio: "9:16",
      },
    })

    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "done",
        finishedAt: new Date(),
        settleCredits: job.quoteCredits,
      },
    })
  }
}

async function main() {
  while (true) {
    await tick()
    await sleep(3000)
  }
}

main()
  .catch(async () => {
    await prisma.$disconnect()
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

- [ ] **Step 2: Add worker script**

Modify `package.json`:

```json
{
  "scripts": {
    "worker": "tsx worker/poll-jobs.ts"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add job polling worker"
```

---

## Task 11: Download + Share Link (72h) + Public page

**Files:**
- Create: `src/app/api/jobs/[jobId]/download/route.ts`
- Create: `src/app/api/share-links/route.ts`
- Create: `src/app/s/[token]/page.tsx`

- [ ] **Step 1: Download proxy**

Create `src/app/api/jobs/[jobId]/download/route.ts`:

```ts
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(_: Request, ctx: { params: Promise<{ jobId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 })
  const { jobId } = await ctx.params
  const job = await prisma.generationJob.findFirst({
    where: { id: jobId, userId: session.user.id },
    include: { video: true },
  })
  if (!job?.video?.url) return Response.json({ error: "not_ready" }, { status: 400 })
  return Response.redirect(job.video.url)
}
```

- [ ] **Step 2: Share link create**

Create `src/app/api/share-links/route.ts`:

```ts
import crypto from "crypto"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

function hashToken(t: string) {
  return crypto.createHash("sha256").update(t).digest("hex")
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 })
  const body = (await req.json()) as { jobId: string }
  const job = await prisma.generationJob.findFirst({
    where: { id: body.jobId, userId: session.user.id, status: "done" },
    include: { video: true },
  })
  if (!job?.video) return Response.json({ error: "not_ready" }, { status: 400 })

  const token = crypto.randomBytes(24).toString("hex")
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)

  await prisma.shareLink.create({
    data: { userId: session.user.id, jobId: job.id, tokenHash, expiresAt },
  })

  return Response.json({ token, expiresAt })
}
```

- [ ] **Step 3: Public page**

Create `src/app/s/[token]/page.tsx`:

```tsx
import crypto from "crypto"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"

function hashToken(t: string) {
  return crypto.createHash("sha256").update(t).digest("hex")
}

export default async function SharePage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params
  const tokenHash = hashToken(token)
  const link = await prisma.shareLink.findFirst({
    where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    include: { job: { include: { video: true } } },
  })
  if (!link?.job?.video?.url) return notFound()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold">Shared video</h1>
      <video controls playsInline className="w-full rounded-lg border">
        <source src={link.job.video.url} type="video/mp4" />
      </video>
      <a
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        href={link.job.video.url}
      >
        Download
      </a>
      <meta name="robots" content="noindex,nofollow" />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add share link and download"
```

---

## Task 12: UI screens (Dashboard, Project detail, Quick Generate)

**Files:**
- Create: `src/app/(app)/dashboard/page.tsx`
- Create: `src/app/(app)/projects/[projectId]/page.tsx`
- Modify: `src/app/layout.tsx` (basic layout)

- [ ] **Step 1: Add app layout with nav**

Modify `src/app/layout.tsx` to include:

```tsx
import "./globals.css"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "AI Video Ads Generator",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between p-4">
            <Link href="/dashboard" className="font-semibold">
              AI Video Ads
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/credits">Credits</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl p-4">{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Dashboard page (list projects, create quick project)**

Create `src/app/(app)/dashboard/page.tsx`:

```tsx
import Link from "next/link"
import { auth } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    return (
      <div className="p-6">
        <Link className="underline" href="/login">
          Login
        </Link>
      </div>
    )
  }

  const res = await fetch(`${process.env.APP_BASE_URL}/api/projects`, { cache: "no-store" })
  const data = (await res.json()) as { items: Array<{ id: string; title: string }> }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <form
          action={async () => {
            "use server"
            await fetch(`${process.env.APP_BASE_URL}/api/projects`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
              cache: "no-store",
            })
          }}
        >
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Quick Generate
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {data.items.map((p) => (
          <Link key={p.id} className="rounded-lg border p-4 hover:bg-muted" href={`/projects/${p.id}`}>
            <div className="font-medium">{p.title}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Project detail (upload asset + create job form + job list)**

Create `src/app/(app)/projects/[projectId]/page.tsx`:

```tsx
import { auth } from "@/lib/auth"

export default async function ProjectPage(props: { params: Promise<{ projectId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return null

  const { projectId } = await props.params

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Project</h1>

      <form
        action={async (formData) => {
          "use server"
          const file = formData.get("file") as File | null
          if (!file) return
          const fd = new FormData()
          fd.set("file", file)
          await fetch(`${process.env.APP_BASE_URL}/api/projects/${projectId}/assets`, {
            method: "POST",
            body: fd,
            cache: "no-store",
          })
        }}
        className="rounded-lg border p-4"
      >
        <div className="flex flex-col gap-3">
          <div className="font-medium">Upload image (auto-crop 9:16)</div>
          <input name="file" type="file" accept="image/*" required />
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Upload
          </button>
        </div>
      </form>

      <div className="rounded-lg border p-4">
        <div className="font-medium">Generate (TODO UI form)</div>
        <div className="text-sm text-muted-foreground">
          Implement pack picker + form + quote + confirm as client component in next task iteration.
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add basic dashboard and project pages"
```

---

## Task 13: Replace TODO with real Generate form (pack buttons + quote + create job + poll)

**Files:**
- Create: `src/app/(app)/projects/[projectId]/GeneratePanel.tsx`
- Modify: `src/app/(app)/projects/[projectId]/page.tsx`

- [ ] **Step 1: Add client GeneratePanel**

Create `src/app/(app)/projects/[projectId]/GeneratePanel.tsx`:

```tsx
"use client"

import { useEffect, useMemo, useState } from "react"

type Pack = { id: string; name: string }

type Quality = "540p" | "720p" | "1080p"
type Duration = 5 | 10 | 15

function quoteCredits(duration: Duration, quality: Quality) {
  const base = duration === 5 ? 1 : duration === 10 ? 2 : 3
  const multiplier = quality === "540p" ? 1 : quality === "720p" ? 1.5 : 2
  return Math.ceil(base * multiplier)
}

export function GeneratePanel(props: { projectId: string }) {
  const [packs, setPacks] = useState<Pack[]>([])
  const [packId, setPackId] = useState("ugc_hook")
  const [productName, setProductName] = useState("")
  const [duration, setDuration] = useState<Duration>(5)
  const [quality, setQuality] = useState<Quality>("540p")
  const [jobId, setJobId] = useState<string | null>(null)
  const [job, setJob] = useState<any>(null)
  const [err, setErr] = useState<string | null>(null)

  const quote = useMemo(() => quoteCredits(duration, quality), [duration, quality])

  useEffect(() => {
    fetch("/api/template-packs")
      .then((r) => r.json())
      .then((d) => setPacks(d.items ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!jobId) return
    const t = setInterval(() => {
      fetch(`/api/jobs/${jobId}`)
        .then((r) => r.json())
        .then((d) => setJob(d.job))
        .catch(() => {})
    }, 2000)
    return () => clearInterval(t)
  }, [jobId])

  async function submit() {
    setErr(null)
    const idem = crypto.randomUUID()
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: props.projectId,
        packId,
        duration,
        quality,
        productName,
        idempotencyKey: idem,
        language: "id",
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setErr(data.error || "error")
      return
    }
    setJobId(data.jobId)
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="font-medium">Generate</div>

      <div className="flex flex-wrap gap-2">
        {packs.map((p) => (
          <button
            key={p.id}
            className={`rounded-md border px-3 py-2 text-sm ${p.id === packId ? "bg-muted" : ""}`}
            onClick={() => setPackId(p.id)}
            type="button"
          >
            {p.name}
          </button>
        ))}
      </div>

      <label className="text-sm">
        Product name
        <input className="mt-2 w-full rounded-md border px-3 py-2" value={productName} onChange={(e) => setProductName(e.target.value)} />
      </label>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          Duration
          <select className="mt-2 w-full rounded-md border px-3 py-2" value={duration} onChange={(e) => setDuration(Number(e.target.value) as Duration)}>
            <option value={5}>5s</option>
            <option value={10}>10s</option>
            <option value={15}>15s</option>
          </select>
        </label>

        <label className="text-sm">
          Quality
          <select className="mt-2 w-full rounded-md border px-3 py-2" value={quality} onChange={(e) => setQuality(e.target.value as Quality)}>
            <option value={"540p"}>Standard (540p)</option>
            <option value={"720p"}>HD (720p)</option>
            <option value={"1080p"}>Full HD (1080p)</option>
          </select>
        </label>

        <div className="text-sm">
          Quote: <span className="font-medium">{quote}</span> credits
        </div>
      </div>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={submit} type="button" disabled={!productName}>
        Generate
      </button>

      {job ? (
        <div className="rounded-md border p-3 text-sm">
          <div>Status: {job.status}</div>
          {job.video?.url ? (
            <div className="mt-2 flex flex-col gap-2">
              <video controls playsInline className="w-full rounded-lg border">
                <source src={job.video.url} type="video/mp4" />
              </video>
              <a className="underline" href={`/api/jobs/${job.id}/download`}>
                Download
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 2: Add template packs API**

Create `src/app/api/template-packs/route.ts`:

```ts
import { prisma } from "@/lib/db"

export async function GET() {
  const items = await prisma.templatePack.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })
  return Response.json({ items })
}
```

- [ ] **Step 3: Wire GeneratePanel into project page**

Modify `src/app/(app)/projects/[projectId]/page.tsx` to include:

```tsx
import { GeneratePanel } from "./GeneratePanel"
```

and replace the TODO block with:

```tsx
<GeneratePanel projectId={projectId} />
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add generate panel ui"
```

---

## Task 14: Final hardening pass (errors, moderation messaging, cleanup)

**Files:**
- Modify: `worker/poll-jobs.ts` (explicit error messages)
- Modify: API routes to return consistent error shapes
- Create: `src/app/(app)/credits/page.tsx`

- [ ] **Step 1: Credits page**

Create `src/app/(app)/credits/page.tsx`:

```tsx
import { auth } from "@/lib/auth"

export default async function CreditsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const [balanceRes, ledgerRes] = await Promise.all([
    fetch(`${process.env.APP_BASE_URL}/api/credits/balance`, { cache: "no-store" }),
    fetch(`${process.env.APP_BASE_URL}/api/credits/ledger`, { cache: "no-store" }),
  ])
  const balance = (await balanceRes.json()) as { balance: number }
  const ledger = (await ledgerRes.json()) as { items: Array<{ id: string; delta: number; reason: string; createdAt: string }> }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Credits</h1>
      <div className="rounded-lg border p-4">
        <div className="text-sm text-muted-foreground">Balance</div>
        <div className="text-2xl font-semibold">{balance.balance}</div>
      </div>
      <div className="rounded-lg border p-4">
        <div className="font-medium">Ledger</div>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          {ledger.items.map((i) => (
            <div key={i.id} className="flex items-center justify-between">
              <div>{i.reason}</div>
              <div className={i.delta >= 0 ? "text-emerald-700" : "text-red-700"}>{i.delta}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run smoke test**

Run:

```bash
npm run dev
```

In another terminal:

```bash
npm run worker
```

Manual verification:
- Login
- Create Quick project
- Upload image
- Generate 5s 540p
- Wait status becomes done
- Download works
- Share link works and expires after 72h

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add credits page and mvp polish"
```

---

## Self-Review (Plan vs PRD Coverage)

- Auth.js: configured with Prisma adapter and database sessions; endpoints protected via `auth()`.
- Credits: trial grant (100), quote pricing, consume on job create, refund on fail/invalid/timeout.
- PixVerse: v6 lock, duration 5/10/15, no-audio switch, async result polling.
- Constraints: 9:16 enforced via crop preprocess and output validation.
- Worker: DB-backed polling with TTL=20m and polling schedule.
- Rate limit: concurrency and per-hour/per-day caps.
- Share link: token hash, 72h expiry, noindex.

---

Plan complete and saved to `docs/superpowers/plans/2026-05-30-ai-video-ads-generator-mvp.md`.

Two execution options:
1) Subagent-Driven (recommended)
2) Inline Execution

Which approach?
