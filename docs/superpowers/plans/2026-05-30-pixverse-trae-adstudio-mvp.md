# Product Ads Video Campaign Studio (PixVerse × TRAE) MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build MVP end-to-end “campaign builder → creative packs → PixVerse generation (CLI + mock) → public shoppable landing → analytics → credits/paywall” sesuai PRD.

**Architecture:** Next.js App Router fullstack (route handlers + server actions) dengan Prisma SQLite. Domain dipisah di `src/modules/*` (campaigns, products, creatives, generation, landing, analytics, billing). PixVerse jalan di server-only wrapper yang bisa switch mock via env.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma + SQLite, Zod, Playwright E2E.

---

## Struktur Folder (target)

- `src/app/(auth)/login/page.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/campaigns/page.tsx`
- `src/app/(dashboard)/campaigns/new/page.tsx`
- `src/app/(dashboard)/campaigns/[campaignId]/page.tsx`
- `src/app/(dashboard)/campaigns/[campaignId]/product/page.tsx`
- `src/app/(dashboard)/campaigns/[campaignId]/creative/page.tsx`
- `src/app/(dashboard)/campaigns/[campaignId]/generate/page.tsx`
- `src/app/(dashboard)/campaigns/[campaignId]/landing/page.tsx`
- `src/app/(dashboard)/campaigns/[campaignId]/analytics/page.tsx`
- `src/app/c/[slug]/page.tsx` (public landing)
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/uploads/product-images/route.ts`
- `src/app/api/events/route.ts`
- `src/app/api/pixverse/submit/route.ts`
- `src/app/api/pixverse/poll/route.ts`
- `src/app/api/credits/upgrade/route.ts`
- `src/components/*` (shadcn + komponen app)
- `src/lib/auth/*`
- `src/lib/db/prisma.ts`
- `src/lib/env.ts`
- `src/lib/uploads/*`
- `src/lib/pixverse/*`
- `src/modules/*` (domain logic)
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `e2e/campaign-flow.spec.ts`
- `playwright.config.ts`
- `README.md`
- `.env.example`

---

### Task 1: Inisialisasi Next.js + Tailwind + shadcn + env

**Files:**
- Create: `.env.example`
- Create: `README.md`
- Modify/Create: `package.json` (via create-next-app + installs)
- Create: `src/lib/env.ts`

- [ ] **Step 1: Init Next.js App Router**

Run:

```bash
cd /workspace
CI=true npm create next-app@latest pixverse-trae-adstudio -- --ts --eslint --tailwind --app --src-dir --import-alias "@/*"
```

Expected: folder `/workspace/pixverse-trae-adstudio` dengan Next.js App Router + Tailwind.

- [ ] **Step 2: Install Prisma, Zod, shadcn/ui deps**

Run:

```bash
cd /workspace/pixverse-trae-adstudio
npm i @prisma/client zod
npm i -D prisma
```

Expected: `package-lock.json` update, Prisma CLI tersedia.

- [ ] **Step 3: Init shadcn/ui**

Run:

```bash
cd /workspace/pixverse-trae-adstudio
npx shadcn@latest init --yes
```

Expected: `components.json` dibuat, folder `src/components/ui` tersedia.

- [ ] **Step 4: Tambahkan komponen shadcn yang dipakai**

Run:

```bash
cd /workspace/pixverse-trae-adstudio
npx shadcn@latest add button card input textarea label select tabs table badge dialog dropdown-menu separator toast form
```

Expected: komponen UI muncul di `src/components/ui/*`.

- [ ] **Step 5: Tambahkan env loader**

Create `src/lib/env.ts`:

```ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  UPLOAD_DIR: z.string().min(1),
  BASE_URL: z.string().url(),
  PIXVERSE_MOCK: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  UPLOAD_DIR: process.env.UPLOAD_DIR,
  BASE_URL: process.env.BASE_URL,
  PIXVERSE_MOCK: process.env.PIXVERSE_MOCK,
});
```

- [ ] **Step 6: Tambahkan `.env.example`**

Create `.env.example`:

```env
DATABASE_URL="file:./dev.db"
UPLOAD_DIR="./public/uploads"
BASE_URL="http://localhost:3000"
PIXVERSE_MOCK="true"
```

- [ ] **Step 7: Run dev server sanity**

Run:

```bash
cd /workspace/pixverse-trae-adstudio
npm run dev
```

Expected: dev server start tanpa error.

---

### Task 2: Prisma schema + SQLite + seed (User, Campaign, Product, CreativePack, VideoAsset, LandingConfig, EventLog, Vote, Comment)

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db/prisma.ts`
- Create: `prisma/seed.ts`
- Modify: `package.json` (prisma scripts)

- [ ] **Step 1: Buat Prisma schema**

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum CampaignStatus {
  draft
  published
}

enum ObjectivePreset {
  awareness
  product_highlight
  social_proof
  promo_discount
  limited_drop
  conversion_shop_now
  bundle_offer
  retargeting
  custom
}

enum VideoStatus {
  queued
  generating
  completed
  failed
}

enum ClipType {
  hook
  feature
  offer
}

enum Variant {
  A
  B
}

enum EventType {
  view
  ctaClick
  addToCart
  checkoutClick
  voteA
  voteB
  commentCreate
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  credits   Int      @default(2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sessions  Session[]
  campaigns Campaign[]
  votes     Vote[]
  comments  Comment[]
}

model Session {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Campaign {
  id              String         @id @default(cuid())
  userId          String
  title           String
  objectivePreset ObjectivePreset
  objectiveText   String
  status          CampaignStatus @default(draft)
  publishedSlug   String?        @unique
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  product       Product?
  packConfig    PackConfig?
  videos        VideoAsset[]
  landingConfig LandingConfig?
  events        EventLog[]
  votes         Vote[]
  comments      Comment[]
}

model Product {
  id          String   @id @default(cuid())
  campaignId  String   @unique
  name        String
  priceCents  Int
  description String
  category    String
  checkoutUrl String?
  variantsJson String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  images   ProductImage[]
}

model ProductImage {
  id        String   @id @default(cuid())
  productId String
  urlPath   String
  sortOrder Int
  createdAt DateTime @default(now())

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model CreativePack {
  id                   String @id @default(cuid())
  key                  String @unique
  name                 String
  packStyle            String
  defaultTone          String
  defaultCta           String
  targetDurationSec    Int
  estimatedCreditCost  Int
  createdAt            DateTime @default(now())

  packConfigs PackConfig[]
  videos      VideoAsset[]
}

model PackConfig {
  id              String @id @default(cuid())
  campaignId      String @unique
  packId          String
  audience        String
  tone            String
  overlayLanguage String
  offer           String
  ctaText         String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  campaign Campaign    @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  pack     CreativePack @relation(fields: [packId], references: [id], onDelete: Restrict)
}

model VideoAsset {
  id             String     @id @default(cuid())
  campaignId     String
  packId         String
  variant        Variant
  clipType       ClipType
  pixverseVideoId String
  status         VideoStatus
  url            String?
  durationSec    Int
  errorReason    String?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  campaign Campaign    @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  pack     CreativePack @relation(fields: [packId], references: [id], onDelete: Restrict)

  @@unique([campaignId, variant, clipType])
}

model LandingConfig {
  id         String   @id @default(cuid())
  campaignId String   @unique
  ctaText    String
  checkoutUrl String?
  chaptersJson String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
}

model EventLog {
  id         String    @id @default(cuid())
  campaignId String
  type       EventType
  metaJson   String
  createdAt  DateTime  @default(now())

  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
}

model Vote {
  id         String   @id @default(cuid())
  campaignId String
  userId     String?
  option     Variant
  createdAt  DateTime @default(now())

  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  user     User?     @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@unique([campaignId, userId])
}

model Comment {
  id         String   @id @default(cuid())
  campaignId String
  userId     String?
  authorName String
  text       String
  createdAt  DateTime @default(now())

  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  user     User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
}
```

- [ ] **Step 2: Prisma client singleton**

Create `src/lib/db/prisma.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
+  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 3: Seed data (1 demo user + 3 creative packs)**

Create `prisma/seed.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: "demo@local" },
    update: {},
    create: { email: "demo@local", name: "Demo User", credits: 2 },
  });

  await prisma.creativePack.upsert({
    where: { key: "minimal_studio" },
    update: {},
    create: {
      key: "minimal_studio",
      name: "Minimal Studio",
      packStyle:
        "clean studio, softbox lighting, glossy surface, premium minimal",
      defaultTone: "Clean, premium, confident",
      defaultCta: "Shop Now",
      targetDurationSec: 36,
      estimatedCreditCost: 1,
    },
  });

  await prisma.creativePack.upsert({
    where: { key: "lifestyle_urban" },
    update: {},
    create: {
      key: "lifestyle_urban",
      name: "Lifestyle Urban",
      packStyle:
        "natural daylight, home kitchen / trendy table, hands only, authentic",
      defaultTone: "Friendly, authentic, everyday",
      defaultCta: "Get Yours",
      targetDurationSec: 36,
      estimatedCreditCost: 1,
    },
  });

  await prisma.creativePack.upsert({
    where: { key: "luxury_cinematic" },
    update: {},
    create: {
      key: "luxury_cinematic",
      name: "Luxury Cinematic",
      packStyle:
        "dark moody background, dramatic rim light, high contrast, subtle film grain",
      defaultTone: "Bold, luxury, cinematic",
      defaultCta: "Explore Collection",
      targetDurationSec: 36,
      estimatedCreditCost: 1,
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 4: Add prisma scripts**

Add to `package.json`:

```json
{
  "scripts": {
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "prisma db seed"
  },
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

- [ ] **Step 5: Run migrate + seed**

Run:

```bash
cd /workspace/pixverse-trae-adstudio
npx prisma migrate dev --name init
npx prisma db seed
```

Expected: `dev.db` dibuat, table terbuat, seed sukses tanpa error.

---

### Task 3: Demo auth (session cookie) + dashboard layout

**Files:**
- Create: `src/lib/auth/session.ts`
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/page.tsx`

- [ ] **Step 1: Session helpers**

Create `src/lib/auth/session.ts`:

```ts
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";

const COOKIE_NAME = "pv_session";

export async function createDemoSession() {
  const user = await prisma.user.findUnique({ where: { email: "demo@local" } });
  if (!user) throw new Error("Demo user missing");

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await prisma.session.create({
    data: { token, userId: user.id, expiresAt },
  });

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) await prisma.session.deleteMany({ where: { token } });
  jar.set(COOKIE_NAME, "", { path: "/", expires: new Date(0) });
}

export async function requireUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  return session.user;
}
```

- [ ] **Step 2: Login/logout routes**

Create `src/app/api/auth/login/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createDemoSession } from "@/lib/auth/session";

export async function POST() {
  await createDemoSession();
  return NextResponse.json({ ok: true });
}
```

Create `src/app/api/auth/logout/route.ts`:

```ts
import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";

export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Login page**

Create `src/app/(auth)/login/page.tsx`:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>PixVerse × TRAE AdStudio</CardTitle>
          <CardDescription>Demo login untuk memisahkan data per user.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/api/auth/login" method="post">
            <Button type="submit" className="w-full">Login as Demo</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 4: Dashboard layout dengan redirect**

Create `src/app/(dashboard)/layout.tsx`:

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Link href="/campaigns" className="font-semibold">AdStudio</Link>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">Credits: {user.credits}</div>
            <form action="/api/auth/logout" method="post">
              <Button type="submit" variant="outline" size="sm">Logout</Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-6">{children}</main>
    </div>
  );
}
```

Create `src/app/(dashboard)/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function DashboardIndex() {
  redirect("/campaigns");
}
```

- [ ] **Step 5: Manual verification**

Run:

```bash
cd /workspace/pixverse-trae-adstudio
npm run dev
```

Expected:
- `/login` tampil
- klik login → cookie terset → redirect ke `/campaigns` (belum dibuat di Task 4)

---

### Task 4: Campaign Builder (list + create + detail shell) + objective preset/custom

**Files:**
- Create: `src/modules/campaigns/objectives.ts`
- Create: `src/modules/campaigns/validators.ts`
- Create: `src/modules/campaigns/repo.ts`
- Create: `src/app/(dashboard)/campaigns/page.tsx`
- Create: `src/app/(dashboard)/campaigns/new/page.tsx`
- Create: `src/app/(dashboard)/campaigns/[campaignId]/page.tsx`

- [ ] **Step 1: Objective presets mapping**

Create `src/modules/campaigns/objectives.ts`:

```ts
export const objectivePresets = [
  { value: "awareness", label: "Awareness", defaultCta: "Learn More" },
  { value: "product_highlight", label: "Product Highlight", defaultCta: "See Details" },
  { value: "social_proof", label: "Social Proof", defaultCta: "See Reviews" },
  { value: "promo_discount", label: "Promo/Discount", defaultCta: "Claim Discount" },
  { value: "limited_drop", label: "Limited Drop", defaultCta: "Shop Drop" },
  { value: "conversion_shop_now", label: "Conversion (Shop Now)", defaultCta: "Shop Now" },
  { value: "bundle_offer", label: "Bundle Offer", defaultCta: "Get Bundle" },
  { value: "retargeting", label: "Retargeting", defaultCta: "Come Back" },
  { value: "custom", label: "Custom", defaultCta: "Shop Now" },
] as const;

export type ObjectivePresetValue = (typeof objectivePresets)[number]["value"];
```

- [ ] **Step 2: Validators & repo**

Create `src/modules/campaigns/validators.ts`:

```ts
import { z } from "zod";

export const createCampaignSchema = z.object({
  title: z.string().min(1).max(80),
  objectivePreset: z.enum([
    "awareness",
    "product_highlight",
    "social_proof",
    "promo_discount",
    "limited_drop",
    "conversion_shop_now",
    "bundle_offer",
    "retargeting",
    "custom",
  ]),
  objectiveText: z.string().min(1).max(240),
});
```

Create `src/modules/campaigns/repo.ts`:

```ts
import { prisma } from "@/lib/db/prisma";

export async function listCampaigns(userId: string) {
  return prisma.campaign.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCampaign(input: {
  userId: string;
  title: string;
  objectivePreset: any;
  objectiveText: string;
}) {
  return prisma.campaign.create({
    data: {
      userId: input.userId,
      title: input.title,
      objectivePreset: input.objectivePreset,
      objectiveText: input.objectiveText,
    },
  });
}

export async function getCampaignOrThrow(userId: string, campaignId: string) {
  const c = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
    include: { product: { include: { images: true } }, packConfig: { include: { pack: true } }, videos: true, landingConfig: true },
  });
  if (!c) throw new Error("Campaign not found");
  return c;
}
```

- [ ] **Step 3: Campaign list UI**

Create `src/app/(dashboard)/campaigns/page.tsx`:

```tsx
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listCampaigns } from "@/modules/campaigns/repo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CampaignsPage() {
  const user = await requireUser();
  if (!user) return null;
  const campaigns = await listCampaigns(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Buat campaign, generate video, publish landing, pantau analytics.</p>
        </div>
        <Button asChild>
          <Link href="/campaigns/new">New Campaign</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {campaigns.map((c) => (
          <Card key={c.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{c.title}</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href={`/campaigns/${c.id}`}>Open</Link>
              </Button>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Objective: {c.objectiveText}
            </CardContent>
          </Card>
        ))}
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Belum ada campaign. Klik “New Campaign”.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Campaign create UI**

Create `src/app/(dashboard)/campaigns/new/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createCampaignSchema } from "@/modules/campaigns/validators";
import { createCampaign } from "@/modules/campaigns/repo";
import { objectivePresets } from "@/modules/campaigns/objectives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default async function NewCampaignPage() {
  const user = await requireUser();
  if (!user) return null;

  async function action(formData: FormData) {
    "use server";
    const user = await requireUser();
    if (!user) return;

    const objectivePreset = String(formData.get("objectivePreset") ?? "");
    const title = String(formData.get("title") ?? "");
    const objectiveText =
      objectivePreset === "custom"
        ? String(formData.get("objectiveText") ?? "")
        : String(formData.get("objectivePresetLabel") ?? "");

    const parsed = createCampaignSchema.safeParse({
      title,
      objectivePreset,
      objectiveText,
    });
    if (!parsed.success) throw new Error("Invalid input");

    const c = await createCampaign({ userId: user.id, ...parsed.data });
    redirect(`/campaigns/${c.id}`);
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>New Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="Summer Promo - Product A" required />
            </div>

            <div className="space-y-2">
              <Label>Objective</Label>
              <input type="hidden" name="objectivePresetLabel" value="" />
              <Select name="objectivePreset" defaultValue="conversion_shop_now">
                <SelectTrigger>
                  <SelectValue placeholder="Select objective" />
                </SelectTrigger>
                <SelectContent>
                  {objectivePresets.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Jika pilih Custom, isi objective text.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="objectiveText">Custom objective text</Label>
              <Textarea id="objectiveText" name="objectiveText" placeholder="Drive conversions for busy parents with a limited-time bundle offer." />
            </div>

            <Button type="submit" className="w-full">Create</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Campaign detail shell (step links)**

Create `src/app/(dashboard)/campaigns/[campaignId]/page.tsx`:

```tsx
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getCampaignOrThrow } from "@/modules/campaigns/repo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await requireUser();
  if (!user) return null;
  const campaign = await getCampaignOrThrow(user.id, campaignId);

  const steps = [
    { href: `/campaigns/${campaignId}/product`, title: "1) Product Setup" },
    { href: `/campaigns/${campaignId}/creative`, title: "2) Creative Packs" },
    { href: `/campaigns/${campaignId}/generate`, title: "3) Generate (PixVerse)" },
    { href: `/campaigns/${campaignId}/landing`, title: "4) Landing Builder" },
    { href: `/campaigns/${campaignId}/analytics`, title: "5) Analytics" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{campaign.title}</h1>
          <p className="text-sm text-muted-foreground">Objective: {campaign.objectiveText}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/campaigns">Back</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {steps.map((s) => (
          <Card key={s.href}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{s.title}</CardTitle>
              <Button asChild size="sm">
                <Link href={s.href}>Open</Link>
              </Button>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {campaign.status === "published" ? "Published" : "Draft"}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Manual verification**

Expected:
- Create campaign dari `/campaigns/new`
- List muncul di `/campaigns`
- Detail campaign menampilkan link langkah-langkah

---

### Task 5: Product Setup (upload 1–5 images + fields + validation + persist DB + filesystem)

**Files:**
- Create: `src/lib/uploads/storage.ts`
- Create: `src/modules/products/validators.ts`
- Create: `src/modules/products/repo.ts`
- Create: `src/app/api/uploads/product-images/route.ts`
- Create: `src/app/(dashboard)/campaigns/[campaignId]/product/page.tsx`

- [ ] **Step 1: Upload storage helpers**

Create `src/lib/uploads/storage.ts`:

```ts
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { env } from "@/lib/env";

export const allowedImageTypes = ["image/png", "image/jpeg", "image/webp"] as const;
export const maxImageBytes = 5 * 1024 * 1024;
export const maxImagesCount = 5;

export async function saveUpload(file: File) {
  if (!allowedImageTypes.includes(file.type as any)) throw new Error("Invalid file type");
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.byteLength > maxImageBytes) throw new Error("File too large");

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const name = crypto.randomBytes(16).toString("hex") + "." + ext;

  const absoluteDir = path.isAbsolute(env.UPLOAD_DIR)
    ? env.UPLOAD_DIR
    : path.join(process.cwd(), env.UPLOAD_DIR);

  await mkdir(absoluteDir, { recursive: true });
  const absolutePath = path.join(absoluteDir, name);
  await writeFile(absolutePath, buf);

  const urlPath = env.UPLOAD_DIR.startsWith("./public/")
    ? env.UPLOAD_DIR.replace("./public", "") + "/" + name
    : "/uploads/" + name;

  return { urlPath, absolutePath, size: buf.byteLength };
}
```

- [ ] **Step 2: Upload route handler**

Create `src/app/api/uploads/product-images/route.ts`:

```ts
import { NextResponse } from "next/server";
import { saveUpload, maxImagesCount } from "@/lib/uploads/storage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const files = form.getAll("files").filter((v): v is File => v instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "No files" }, { status: 400 });
  if (files.length > maxImagesCount) return NextResponse.json({ error: "Too many files" }, { status: 400 });

  const saved = await Promise.all(files.map(saveUpload));
  return NextResponse.json({ files: saved.map((s) => ({ urlPath: s.urlPath })) });
}
```

- [ ] **Step 3: Product validators & repo**

Create `src/modules/products/validators.ts`:

```ts
import { z } from "zod";

export const variantsSchema = z
  .object({
    colors: z.array(z.string().min(1).max(24)).max(10),
    sizes: z.array(z.string().min(1).max(24)).max(10),
  })
  .strict();

export const productUpsertSchema = z.object({
  campaignId: z.string().min(1),
  name: z.string().min(1).max(80),
  priceCents: z.number().int().min(0).max(10_000_000),
  description: z.string().min(1).max(600),
  category: z.string().min(1).max(60),
  checkoutUrl: z.string().url().optional().or(z.literal("")),
  variants: variantsSchema,
  imageUrlPaths: z.array(z.string().min(1)).min(1).max(5),
});
```

Create `src/modules/products/repo.ts`:

```ts
import { prisma } from "@/lib/db/prisma";

export async function upsertProduct(input: {
  campaignId: string;
  name: string;
  priceCents: number;
  description: string;
  category: string;
  checkoutUrl?: string;
  variantsJson: string;
  imageUrlPaths: string[];
}) {
  return prisma.product.upsert({
    where: { campaignId: input.campaignId },
    update: {
      name: input.name,
      priceCents: input.priceCents,
      description: input.description,
      category: input.category,
      checkoutUrl: input.checkoutUrl || null,
      variantsJson: input.variantsJson,
      images: {
        deleteMany: {},
        createMany: {
          data: input.imageUrlPaths.map((p, idx) => ({
            urlPath: p,
            sortOrder: idx,
          })),
        },
      },
    },
    create: {
      campaignId: input.campaignId,
      name: input.name,
      priceCents: input.priceCents,
      description: input.description,
      category: input.category,
      checkoutUrl: input.checkoutUrl || null,
      variantsJson: input.variantsJson,
      images: {
        create: input.imageUrlPaths.map((p, idx) => ({
          urlPath: p,
          sortOrder: idx,
        })),
      },
    },
    include: { images: true },
  });
}
```

- [ ] **Step 4: Product setup UI**

Create `src/app/(dashboard)/campaigns/[campaignId]/product/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCampaignOrThrow } from "@/modules/campaigns/repo";
import { productUpsertSchema } from "@/modules/products/validators";
import { upsertProduct } from "@/modules/products/repo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function ProductSetupPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await requireUser();
  if (!user) return null;

  const campaign = await getCampaignOrThrow(user.id, campaignId);
  const existing = campaign.product;

  async function action(formData: FormData) {
    "use server";
    const user = await requireUser();
    if (!user) return;
    const campaign = await getCampaignOrThrow(user.id, campaignId);

    const price = Number(formData.get("price") ?? "0");
    const imageUrlPaths = String(formData.get("imageUrlPaths") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const variants = {
      colors: String(formData.get("colors") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      sizes: String(formData.get("sizes") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const parsed = productUpsertSchema.safeParse({
      campaignId: campaign.id,
      name: String(formData.get("name") ?? ""),
      priceCents: Math.round(price * 100),
      description: String(formData.get("description") ?? ""),
      category: String(formData.get("category") ?? ""),
      checkoutUrl: String(formData.get("checkoutUrl") ?? ""),
      variants,
      imageUrlPaths,
    });
    if (!parsed.success) throw new Error("Invalid input");

    await upsertProduct({
      campaignId: campaign.id,
      name: parsed.data.name,
      priceCents: parsed.data.priceCents,
      description: parsed.data.description,
      category: parsed.data.category,
      checkoutUrl: parsed.data.checkoutUrl || undefined,
      variantsJson: JSON.stringify(parsed.data.variants),
      imageUrlPaths: parsed.data.imageUrlPaths,
    });

    redirect(`/campaigns/${campaignId}`);
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Product Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="images">Product Images (1–5)</Label>
              <input id="images" name="images" type="file" accept="image/*" multiple className="block w-full text-sm" />
              <p className="text-xs text-muted-foreground">Upload lalu submit. MVP: paste URL paths hasil upload ke field di bawah.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrlPaths">Image URL paths (comma separated)</Label>
              <Input
                id="imageUrlPaths"
                name="imageUrlPaths"
                defaultValue={existing?.images?.map((i) => i.urlPath).join(",") ?? ""}
                placeholder="/uploads/xxx.jpg,/uploads/yyy.jpg"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={existing?.name ?? ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" name="price" type="number" step="0.01" defaultValue={existing ? (existing.priceCents / 100).toFixed(2) : ""} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" defaultValue={existing?.category ?? ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkoutUrl">Checkout URL (optional)</Label>
                <Input id="checkoutUrl" name="checkoutUrl" defaultValue={existing?.checkoutUrl ?? ""} placeholder="https://..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={existing?.description ?? ""} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="colors">Variants: colors (comma)</Label>
                <Input id="colors" name="colors" defaultValue="" placeholder="Red,Blue" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sizes">Variants: sizes (comma)</Label>
                <Input id="sizes" name="sizes" defaultValue="" placeholder="S,M,L" />
              </div>
            </div>

            <Button type="submit">Save Product</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Manual verification**

Run:

```bash
curl -s -X POST -F "files=@/workspace/doc/PRD_PixVerse_Trae_AdStudio.md" http://localhost:3000/api/uploads/product-images
```

Expected: 400 invalid file type (ini sanity bahwa validasi berjalan).

---

### Task 6: Creative Packs selection + customization (audience/tone/language/offer/cta) + defaults

**Files:**
- Create: `src/modules/creatives/validators.ts`
- Create: `src/modules/creatives/repo.ts`
- Create: `src/modules/creatives/defaults.ts`
- Create: `src/app/(dashboard)/campaigns/[campaignId]/creative/page.tsx`

- [ ] **Step 1: Defaults helpers**

Create `src/modules/creatives/defaults.ts`:

```ts
export function defaultOverlayLanguage() {
  return "English";
}

export function fallbackOffer() {
  return "";
}
```

- [ ] **Step 2: Validators & repo**

Create `src/modules/creatives/validators.ts`:

```ts
import { z } from "zod";

export const packConfigSchema = z.object({
  campaignId: z.string().min(1),
  packId: z.string().min(1),
  audience: z.string().min(1).max(80),
  tone: z.string().min(1).max(80),
  overlayLanguage: z.string().min(1).max(30),
  offer: z.string().max(80),
  ctaText: z.string().min(1).max(40),
});
```

Create `src/modules/creatives/repo.ts`:

```ts
import { prisma } from "@/lib/db/prisma";

export async function listPacks() {
  return prisma.creativePack.findMany({ orderBy: { createdAt: "asc" } });
}

export async function upsertPackConfig(input: {
  campaignId: string;
  packId: string;
  audience: string;
  tone: string;
  overlayLanguage: string;
  offer: string;
  ctaText: string;
}) {
  return prisma.packConfig.upsert({
    where: { campaignId: input.campaignId },
    update: {
      packId: input.packId,
      audience: input.audience,
      tone: input.tone,
      overlayLanguage: input.overlayLanguage,
      offer: input.offer,
      ctaText: input.ctaText,
    },
    create: {
      campaignId: input.campaignId,
      packId: input.packId,
      audience: input.audience,
      tone: input.tone,
      overlayLanguage: input.overlayLanguage,
      offer: input.offer,
      ctaText: input.ctaText,
    },
  });
}
```

- [ ] **Step 3: Creative page UI**

Create `src/app/(dashboard)/campaigns/[campaignId]/creative/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCampaignOrThrow } from "@/modules/campaigns/repo";
import { listPacks, upsertPackConfig } from "@/modules/creatives/repo";
import { packConfigSchema } from "@/modules/creatives/validators";
import { defaultOverlayLanguage } from "@/modules/creatives/defaults";
import { objectivePresets } from "@/modules/campaigns/objectives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function CreativePage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await requireUser();
  if (!user) return null;
  const campaign = await getCampaignOrThrow(user.id, campaignId);
  const packs = await listPacks();

  const selected = campaign.packConfig;

  const objectiveDefaultCta =
    objectivePresets.find((o) => o.value === campaign.objectivePreset)?.defaultCta ?? "Shop Now";

  async function action(formData: FormData) {
    "use server";
    const user = await requireUser();
    if (!user) return;
    const campaign = await getCampaignOrThrow(user.id, campaignId);

    const parsed = packConfigSchema.safeParse({
      campaignId: campaign.id,
      packId: String(formData.get("packId") ?? ""),
      audience: String(formData.get("audience") ?? ""),
      tone: String(formData.get("tone") ?? ""),
      overlayLanguage: String(formData.get("overlayLanguage") ?? ""),
      offer: String(formData.get("offer") ?? ""),
      ctaText: String(formData.get("ctaText") ?? ""),
    });
    if (!parsed.success) throw new Error("Invalid input");

    await upsertPackConfig(parsed.data);
    redirect(`/campaigns/${campaignId}`);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recommended Creative Packs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packs.map((p) => (
              <Card key={p.id} className={selected?.packId === p.id ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="text-muted-foreground">{p.packStyle}</div>
                  <div>Default tone: {p.defaultTone}</div>
                  <div>Default CTA: {p.defaultCta}</div>
                  <div>Target duration: {p.targetDurationSec}s</div>
                  <div>Est. cost: {p.estimatedCreditCost} credit</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Customize</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="packId">Selected pack (paste pack id)</Label>
              <Input id="packId" name="packId" defaultValue={selected?.packId ?? packs[0]?.id ?? ""} required />
              <p className="text-xs text-muted-foreground">MVP: pilih dengan copy pack id dari DB (atau pakai default).</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Audience</Label>
              <Input id="audience" name="audience" defaultValue={selected?.audience ?? "Busy professionals"} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Input id="tone" name="tone" defaultValue={selected?.tone ?? packs.find((p) => p.id === selected?.packId)?.defaultTone ?? packs[0]?.defaultTone ?? "Premium"} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="overlayLanguage">Overlay language</Label>
              <Input id="overlayLanguage" name="overlayLanguage" defaultValue={selected?.overlayLanguage ?? defaultOverlayLanguage()} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer">Offer (optional)</Label>
              <Textarea id="offer" name="offer" defaultValue={selected?.offer ?? ""} placeholder="Limited time: Buy 1 get 1 30% off" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ctaText">CTA text</Label>
              <Input id="ctaText" name="ctaText" defaultValue={selected?.ctaText ?? objectiveDefaultCta} required />
            </div>

            <Button type="submit">Save Creative Config</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Task 7: Prompt builder PixVerse (3 prompts HOOK/FEATURE/OFFER) + hook line + default CTA/tone fallback

**Files:**
- Create: `src/modules/generation/promptBuilder.ts`

- [ ] **Step 1: Implement prompt builder**

Create `src/modules/generation/promptBuilder.ts`:

```ts
import { ClipType } from "@prisma/client";

export function buildHookLine(objectiveText: string) {
  const t = objectiveText.toLowerCase();
  if (t.includes("discount") || t.includes("promo")) return "Limited-time deal you don’t want to miss.";
  if (t.includes("awareness")) return "Meet your new everyday essential.";
  if (t.includes("social")) return "Loved by people who want results fast.";
  if (t.includes("limited")) return "This drop won’t last long.";
  if (t.includes("bundle")) return "More value in one smart bundle.";
  if (t.includes("retarget")) return "Still thinking about it? Here’s why it’s worth it.";
  return "Upgrade your routine in seconds.";
}

export type PromptInput = {
  packStyle: string;
  objectiveText: string;
  overlayLanguage: string;
  hookLine: string;
  ctaText: string;
  productName: string;
  priceText: string;
  offerText: string;
  keyFeatures: string[];
};

function globalHeader(packStyle: string) {
  return [
    "Vertical 9:16, TikTok-ready, fast hook, readable typography overlays, safe margins top/bottom for TikTok UI.",
    "Product must match the provided image reference exactly (shape, label, colors). No distorted text, no fake logos, no watermark.",
    `Style: ${packStyle}.`,
  ].join(" ");
}

export function buildPixVersePrompt(clipType: ClipType, input: PromptInput) {
  const f = [...input.keyFeatures, "", "", ""].slice(0, 3);
  const key1 = f[0] || "a key feature";
  const key2 = f[1] || "a second key feature";
  const key3 = f[2] || "a third key feature";

  const common = [
    globalHeader(input.packStyle),
    `Objective: ${input.objectiveText}`,
    "Create a vertical 9:16 multi-shot product commercial using the provided product image as exact reference.",
    "Keep it ultra-realistic, premium, no watermark, no distorted labels.",
    `On-screen text overlays must be in ${input.overlayLanguage}.`,
  ].join(" ");

  if (clipType === "hook") {
    return [
      common,
      "Shot plan:",
      `0–3s: hook with extreme macro detail + on-screen text: “${input.hookLine}”.`,
      `3–7s: hero rotation / use moment, highlight ${key1}.`,
      `7–11s: quick cuts to reinforce ${key2} and ${key3}.`,
      `11–15s: clean hero end frame with space for text: “${input.ctaText}”.`,
    ].join("\n");
  }

  if (clipType === "feature") {
    return [
      common,
      "Shot plan:",
      "0–4s: product in use (hands only if lifestyle), show texture.",
      `4–10s: benefit sequence for ${key1}/${key2}/${key3} with short overlay text.`,
      `10–15s: hero frame + “${input.offerText || input.priceText}”.`,
    ].join("\n");
  }

  return [
    common,
    "Shot plan:",
    "0–5s: strongest hero + appetite appeal.",
    `5–10s: show offer/price with clean typography: “${input.priceText}” “${input.offerText}”.`,
    `10–15s: big CTA: “${input.ctaText}”, end on premium hero.`,
  ].join("\n");
}
```

---

### Task 8: PixVerse integration (CLI submit/poll) + Mock mode + VideoAsset persistence + status transitions

**Files:**
- Create: `src/lib/pixverse/cli.ts`
- Create: `src/modules/generation/repo.ts`
- Create: `src/app/api/pixverse/submit/route.ts`
- Create: `src/app/api/pixverse/poll/route.ts`
- Create: `src/app/(dashboard)/campaigns/[campaignId]/generate/page.tsx`

- [ ] **Step 1: PixVerse CLI wrapper (server-only)**

Create `src/lib/pixverse/cli.ts`:

```ts
import { execFile } from "child_process";
import { promisify } from "util";
import { env } from "@/lib/env";

const execFileAsync = promisify(execFile);

type SubmitResult = { video_id: string; status?: string };
type StatusResult = { video_id: string; status: string; url?: string; duration?: number; error?: string };

const MOCK_VIDEO_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

export async function pixverseSubmit(args: {
  prompt: string;
  imageUrl: string;
  aspect: "9:16";
}) {
  if (env.PIXVERSE_MOCK) {
    return { video_id: "mock_" + Math.random().toString(36).slice(2), status: "queued" } satisfies SubmitResult;
  }

  const { stdout } = await execFileAsync("pixverse", [
    "task",
    "submit",
    "--no-wait",
    "--json",
    "--aspect",
    args.aspect,
    "--image",
    args.imageUrl,
    "--prompt",
    args.prompt,
  ]);

  return JSON.parse(stdout) as SubmitResult;
}

export async function pixversePoll(videoId: string) {
  if (env.PIXVERSE_MOCK) {
    return {
      video_id: videoId,
      status: "completed",
      url: MOCK_VIDEO_URL,
      duration: 12,
    } satisfies StatusResult;
  }

  const { stdout } = await execFileAsync("pixverse", [
    "task",
    "status",
    videoId,
    "--json",
  ]);

  return JSON.parse(stdout) as StatusResult;
}
```

- [ ] **Step 2: Generation repo**

Create `src/modules/generation/repo.ts`:

```ts
import { prisma } from "@/lib/db/prisma";
import { ClipType, Variant, VideoStatus } from "@prisma/client";

export async function upsertVideoAsset(input: {
  campaignId: string;
  packId: string;
  variant: Variant;
  clipType: ClipType;
  pixverseVideoId: string;
  status: VideoStatus;
  durationSec: number;
}) {
  return prisma.videoAsset.upsert({
    where: {
      campaignId_variant_clipType: {
        campaignId: input.campaignId,
        variant: input.variant,
        clipType: input.clipType,
      },
    },
    update: {
      packId: input.packId,
      pixverseVideoId: input.pixverseVideoId,
      status: input.status,
      durationSec: input.durationSec,
    },
    create: {
      campaignId: input.campaignId,
      packId: input.packId,
      variant: input.variant,
      clipType: input.clipType,
      pixverseVideoId: input.pixverseVideoId,
      status: input.status,
      durationSec: input.durationSec,
    },
  });
}

export async function updateVideoStatus(input: {
  id: string;
  status: VideoStatus;
  url?: string;
  durationSec?: number;
  errorReason?: string;
}) {
  return prisma.videoAsset.update({
    where: { id: input.id },
    data: {
      status: input.status,
      url: input.url ?? undefined,
      durationSec: input.durationSec ?? undefined,
      errorReason: input.errorReason ?? undefined,
    },
  });
}
```

- [ ] **Step 3: Submit route**

Create `src/app/api/pixverse/submit/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { getCampaignOrThrow } from "@/modules/campaigns/repo";
import { pixverseSubmit } from "@/lib/pixverse/cli";
import { buildHookLine, buildPixVersePrompt } from "@/modules/generation/promptBuilder";
import { upsertVideoAsset } from "@/modules/generation/repo";
import { prisma } from "@/lib/db/prisma";
import { ClipType, Variant } from "@prisma/client";

export const runtime = "nodejs";

const bodySchema = z.object({
  campaignId: z.string().min(1),
  variant: z.enum(["A", "B"]).default("A"),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const campaign = await getCampaignOrThrow(user.id, parsed.data.campaignId);
  if (!campaign.product) return NextResponse.json({ error: "Missing product" }, { status: 400 });
  if (!campaign.packConfig) return NextResponse.json({ error: "Missing creative config" }, { status: 400 });

  if (user.credits <= 0) return NextResponse.json({ error: "NO_CREDITS" }, { status: 402 });

  const pack = campaign.packConfig.pack;
  const product = campaign.product;
  const productImage = product.images[0]?.urlPath;
  if (!productImage) return NextResponse.json({ error: "Missing product image" }, { status: 400 });

  const variant = parsed.data.variant as Variant;
  const hookLine = buildHookLine(campaign.objectiveText);
  const priceText = `$${(product.priceCents / 100).toFixed(2)}`;
  const keyFeatures = [product.category, "premium quality", "everyday easy"];

  const clips: ClipType[] = ["hook", "feature", "offer"];
  const results = [];

  for (const clipType of clips) {
    const prompt = buildPixVersePrompt(clipType, {
      packStyle: pack.packStyle,
      objectiveText: campaign.objectiveText,
      overlayLanguage: campaign.packConfig.overlayLanguage,
      hookLine,
      ctaText: campaign.packConfig.ctaText,
      productName: product.name,
      priceText,
      offerText: campaign.packConfig.offer,
      keyFeatures,
    });

    const submit = await pixverseSubmit({
      prompt,
      imageUrl: productImage,
      aspect: "9:16",
    });

    const va = await upsertVideoAsset({
      campaignId: campaign.id,
      packId: pack.id,
      variant,
      clipType,
      pixverseVideoId: submit.video_id,
      status: "queued",
      durationSec: 12,
    });

    results.push(va);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { credits: { decrement: 1 } },
  });

  return NextResponse.json({ ok: true, assets: results });
}
```

- [ ] **Step 4: Poll route**

Create `src/app/api/pixverse/poll/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { getCampaignOrThrow } from "@/modules/campaigns/repo";
import { pixversePoll } from "@/lib/pixverse/cli";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

const bodySchema = z.object({
  campaignId: z.string().min(1),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const campaign = await getCampaignOrThrow(user.id, parsed.data.campaignId);
  const assets = await prisma.videoAsset.findMany({
    where: { campaignId: campaign.id },
    orderBy: [{ variant: "asc" }, { clipType: "asc" }],
  });

  const updated = [];
  for (const a of assets) {
    if (a.status === "completed" || a.status === "failed") continue;
    const status = await pixversePoll(a.pixverseVideoId);

    if (status.status === "completed") {
      const u = await prisma.videoAsset.update({
        where: { id: a.id },
        data: { status: "completed", url: status.url ?? null, durationSec: Math.round(status.duration ?? a.durationSec) },
      });
      updated.push(u);
    } else if (status.status === "failed") {
      const u = await prisma.videoAsset.update({
        where: { id: a.id },
        data: { status: "failed", errorReason: status.error ?? "Unknown error" },
      });
      updated.push(u);
    } else {
      const u = await prisma.videoAsset.update({
        where: { id: a.id },
        data: { status: status.status === "generating" ? "generating" : "queued" },
      });
      updated.push(u);
    }
  }

  const finalAssets = await prisma.videoAsset.findMany({
    where: { campaignId: campaign.id },
    orderBy: [{ variant: "asc" }, { clipType: "asc" }],
  });

  return NextResponse.json({ ok: true, assets: finalAssets, updated });
}
```

- [ ] **Step 5: Generate UI page**

Create `src/app/(dashboard)/campaigns/[campaignId]/generate/page.tsx`:

```tsx
import { requireUser } from "@/lib/auth/session";
import { getCampaignOrThrow } from "@/modules/campaigns/repo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function GeneratePage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await requireUser();
  if (!user) return null;
  const campaign = await getCampaignOrThrow(user.id, campaignId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate with PixVerse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>Credits available: {user.credits}</div>
          <div className="flex gap-2">
            <form action={`/api/pixverse/submit`} method="post">
              <input type="hidden" name="campaignId" value={campaignId} />
              <input type="hidden" name="variant" value="A" />
              <Button type="button" onClick={async () => {
                const res = await fetch("/api/pixverse/submit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ campaignId, variant: "A" }) });
                if (!res.ok) alert(await res.text());
                else alert("Submitted variant A");
              }}>Generate A</Button>
            </form>
            <Button
              variant="outline"
              type="button"
              onClick={async () => {
                const res = await fetch("/api/pixverse/submit", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ campaignId, variant: "B" }),
                });
                if (!res.ok) alert(await res.text());
                else alert("Submitted variant B");
              }}
            >
              Generate B
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={async () => {
                const res = await fetch("/api/pixverse/poll", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ campaignId }),
                });
                if (!res.ok) alert(await res.text());
                else alert("Polled status");
              }}
            >
              Poll Status
            </Button>
          </div>
          <p className="text-muted-foreground">
            MVP: gunakan tombol poll untuk update status. Mock mode akan langsung completed.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Assets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {campaign.videos.length === 0 ? (
            <div className="text-sm text-muted-foreground">Belum ada video.</div>
          ) : (
            <div className="grid gap-3">
              {campaign.videos.map((v) => (
                <div key={v.id} className="text-sm">
                  <div className="font-medium">
                    {v.variant} / {v.clipType} — {v.status} — {v.durationSec}s
                  </div>
                  {v.url ? <a className="text-primary underline" href={v.url} target="_blank">Open video</a> : null}
                  {v.errorReason ? <div className="text-destructive">{v.errorReason}</div> : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Task 9: Landing Builder + Publish (slug) + Public landing shoppable (playlist/chapters/cart/checkout) + vote/comment

**Files:**
- Create: `src/modules/landing/chapters.ts`
- Create: `src/modules/landing/repo.ts`
- Create: `src/app/(dashboard)/campaigns/[campaignId]/landing/page.tsx`
- Create: `src/app/c/[slug]/page.tsx`
- Create: `src/app/api/events/route.ts`

- [ ] **Step 1: Chapters auto (Hook/Feature/Offer) + duration total**

Create `src/modules/landing/chapters.ts`:

```ts
import { ClipType, Variant, VideoAsset } from "@prisma/client";

export type Chapter = {
  title: string;
  clipType: ClipType;
  startSec: number;
  endSec: number;
};

export function buildChapters(assets: VideoAsset[], variant: Variant) {
  const ordered: ClipType[] = ["hook", "feature", "offer"];
  const clips = ordered
    .map((t) => assets.find((a) => a.variant === variant && a.clipType === t))
    .filter((a): a is VideoAsset => Boolean(a));

  let cursor = 0;
  const chapters: Chapter[] = [];
  for (const c of clips) {
    const start = cursor;
    const end = cursor + (c.durationSec || 0);
    chapters.push({
      title: c.clipType === "hook" ? "Hook" : c.clipType === "feature" ? "Feature" : "Offer",
      clipType: c.clipType,
      startSec: start,
      endSec: end,
    });
    cursor = end;
  }
  return { chapters, totalSec: cursor };
}
```

- [ ] **Step 2: Landing repo**

Create `src/modules/landing/repo.ts`:

```ts
import { prisma } from "@/lib/db/prisma";

export async function publishCampaign(input: { userId: string; campaignId: string; slug: string }) {
  return prisma.campaign.update({
    where: { id: input.campaignId, userId: input.userId },
    data: { status: "published", publishedSlug: input.slug },
  });
}

export async function upsertLandingConfig(input: {
  campaignId: string;
  ctaText: string;
  checkoutUrl?: string;
  chaptersJson: string;
}) {
  return prisma.landingConfig.upsert({
    where: { campaignId: input.campaignId },
    update: {
      ctaText: input.ctaText,
      checkoutUrl: input.checkoutUrl || null,
      chaptersJson: input.chaptersJson,
    },
    create: {
      campaignId: input.campaignId,
      ctaText: input.ctaText,
      checkoutUrl: input.checkoutUrl || null,
      chaptersJson: input.chaptersJson,
    },
  });
}

export async function getPublishedBySlug(slug: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { publishedSlug: slug, status: "published" },
    include: {
      product: { include: { images: true } },
      videos: true,
      landingConfig: true,
      votes: true,
      comments: { orderBy: { createdAt: "desc" } },
    },
  });
  return campaign;
}
```

- [ ] **Step 3: Events API**

Create `src/app/api/events/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const schema = z.object({
  campaignId: z.string().min(1),
  type: z.enum([
    "view",
    "ctaClick",
    "addToCart",
    "checkoutClick",
    "voteA",
    "voteB",
    "commentCreate",
  ]),
  meta: z.record(z.string(), z.any()).optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const ev = await prisma.eventLog.create({
    data: {
      campaignId: parsed.data.campaignId,
      type: parsed.data.type as any,
      metaJson: JSON.stringify(parsed.data.meta ?? {}),
    },
  });

  return NextResponse.json({ ok: true, eventId: ev.id });
}
```

- [ ] **Step 4: Landing builder dashboard page**

Create `src/app/(dashboard)/campaigns/[campaignId]/landing/page.tsx`:

```tsx
import crypto from "crypto";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCampaignOrThrow } from "@/modules/campaigns/repo";
import { buildChapters } from "@/modules/landing/chapters";
import { publishCampaign, upsertLandingConfig } from "@/modules/landing/repo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function LandingBuilderPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await requireUser();
  if (!user) return null;
  const campaign = await getCampaignOrThrow(user.id, campaignId);

  const { chapters, totalSec } = buildChapters(campaign.videos, "A");
  const canPublish = totalSec >= 30 && campaign.videos.filter((v) => v.variant === "A" && v.status === "completed" && v.url).length === 3;

  async function action(formData: FormData) {
    "use server";
    const user = await requireUser();
    if (!user) return;
    const campaign = await getCampaignOrThrow(user.id, campaignId);

    const slug = String(formData.get("slug") ?? "").trim() || crypto.randomBytes(6).toString("hex");
    const ctaText = String(formData.get("ctaText") ?? "").trim() || campaign.packConfig?.ctaText || "Shop Now";
    const checkoutUrl = String(formData.get("checkoutUrl") ?? "").trim() || campaign.product?.checkoutUrl || "";

    await upsertLandingConfig({
      campaignId: campaign.id,
      ctaText,
      checkoutUrl: checkoutUrl || undefined,
      chaptersJson: JSON.stringify(chapters),
    });
    await publishCampaign({ userId: user.id, campaignId: campaign.id, slug });
    redirect(`/c/${slug}`);
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Landing Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>Total duration (variant A): {totalSec}s (must be ≥ 30s)</div>
          <div>Chapters: {chapters.map((c) => c.title).join(" / ")}</div>
          <div className={canPublish ? "text-emerald-600" : "text-destructive"}>
            {canPublish ? "Ready to publish" : "Need 3 completed clips + total ≥ 30s"}
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Publish</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Public slug</Label>
              <Input id="slug" name="slug" defaultValue={campaign.publishedSlug ?? ""} placeholder="my-campaign" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaText">CTA Text</Label>
              <Input id="ctaText" name="ctaText" defaultValue={campaign.landingConfig?.ctaText ?? campaign.packConfig?.ctaText ?? "Shop Now"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkoutUrl">Checkout URL</Label>
              <Input id="checkoutUrl" name="checkoutUrl" defaultValue={campaign.landingConfig?.checkoutUrl ?? campaign.product?.checkoutUrl ?? ""} placeholder="https://..." />
            </div>
            <Button type="submit" disabled={!canPublish}>Publish Landing</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Public landing page**

Create `src/app/c/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublishedBySlug } from "@/modules/landing/repo";
import { buildChapters } from "@/modules/landing/chapters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default async function PublicLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const campaign = await getPublishedBySlug(slug);
  if (!campaign || !campaign.product || !campaign.landingConfig) notFound();

  const chapters = JSON.parse(campaign.landingConfig.chaptersJson) as Array<any>;
  const { totalSec } = buildChapters(campaign.videos, "A");
  const aClips = campaign.videos.filter((v) => v.variant === "A" && v.url).sort((a, b) => a.clipType.localeCompare(b.clipType));

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{campaign.title}</h1>
            <p className="text-sm text-muted-foreground">Total video duration: {totalSec}s</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Owner</Link>
          </Button>
        </header>

        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Video Playlist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {chapters.map((c) => (
                  <div key={c.clipType} className="text-xs px-2 py-1 rounded border text-muted-foreground">
                    {c.title}
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {aClips.map((v) => (
                  <video key={v.id} className="w-full rounded-md border" controls playsInline preload="metadata" src={v.url ?? ""} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:sticky md:top-6 h-fit">
            <CardHeader>
              <CardTitle>{campaign.product.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-lg font-semibold">${(campaign.product.priceCents / 100).toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">{campaign.product.description}</p>
              <div className="flex gap-2">
                <Button
                  className="w-full"
                  onClick={async () => {
                    await fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ campaignId: campaign.id, type: "ctaClick" }) });
                    if (campaign.landingConfig?.checkoutUrl) window.location.href = campaign.landingConfig.checkoutUrl;
                    else alert("Checkout mock");
                  }}
                >
                  {campaign.landingConfig.ctaText}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    await fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ campaignId: campaign.id, type: "addToCart" }) });
                    alert("Added to cart (local mock)");
                  }}
                >
                  Add to Cart
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ campaignId: campaign.id, type: "checkoutClick" }) });
                    if (campaign.landingConfig?.checkoutUrl) window.location.href = campaign.landingConfig.checkoutUrl;
                    else alert("Checkout click tracked");
                  }}
                >
                  Checkout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="vote">
          <TabsList>
            <TabsTrigger value="vote">Vote</TabsTrigger>
            <TabsTrigger value="comment">Comments</TabsTrigger>
          </TabsList>
          <TabsContent value="vote">
            <Card>
              <CardHeader>
                <CardTitle>A/B Voting</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button variant="outline" onClick={async () => {
                  await fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ campaignId: campaign.id, type: "voteA" }) });
                  alert("Voted A");
                }}>Vote A</Button>
                <Button variant="outline" onClick={async () => {
                  await fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ campaignId: campaign.id, type: "voteB" }) });
                  alert("Voted B");
                }}>Vote B</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="comment">
            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <form className="space-y-2" onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget as HTMLFormElement;
                  const data = new FormData(form);
                  await fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ campaignId: campaign.id, type: "commentCreate", meta: { author: String(data.get("author") || "anon"), text: String(data.get("text") || "") } }) });
                  form.reset();
                  alert("Comment tracked (stored in events)");
                }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input name="author" placeholder="Name" />
                    <Input name="email" placeholder="Email (optional)" />
                  </div>
                  <Textarea name="text" placeholder="Feedback..." required />
                  <Button type="submit">Submit</Button>
                </form>
                <div className="text-sm text-muted-foreground">
                  MVP: komentar disimpan sebagai event log; CRUD comment model ditambah di Task 10 bila diperlukan.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
```

---

### Task 10: Analytics dashboard (views/CTR/add-to-cart/checkout/vote) + credits upgrade endpoint + paywall handling

**Files:**
- Create: `src/modules/analytics/repo.ts`
- Create: `src/app/(dashboard)/campaigns/[campaignId]/analytics/page.tsx`
- Create: `src/app/api/credits/upgrade/route.ts`

- [ ] **Step 1: Analytics aggregations**

Create `src/modules/analytics/repo.ts`:

```ts
import { prisma } from "@/lib/db/prisma";

export async function getCampaignAnalytics(campaignId: string) {
  const events = await prisma.eventLog.findMany({
    where: { campaignId },
    select: { type: true },
  });

  const counts: Record<string, number> = {};
  for (const e of events) counts[e.type] = (counts[e.type] ?? 0) + 1;

  const views = counts.view ?? 0;
  const cta = counts.ctaClick ?? 0;
  const addToCart = counts.addToCart ?? 0;
  const checkout = counts.checkoutClick ?? 0;
  const voteA = counts.voteA ?? 0;
  const voteB = counts.voteB ?? 0;

  const ctaCtr = views > 0 ? cta / views : 0;

  return {
    views,
    cta,
    addToCart,
    checkout,
    voteA,
    voteB,
    ctaCtr,
  };
}
```

- [ ] **Step 2: Analytics page**

Create `src/app/(dashboard)/campaigns/[campaignId]/analytics/page.tsx`:

```tsx
import { requireUser } from "@/lib/auth/session";
import { getCampaignOrThrow } from "@/modules/campaigns/repo";
import { getCampaignAnalytics } from "@/modules/analytics/repo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await requireUser();
  if (!user) return null;
  const campaign = await getCampaignOrThrow(user.id, campaignId);
  const a = await getCampaignAnalytics(campaign.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Campaign: {campaign.title}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell>Views</TableCell><TableCell className="text-right">{a.views}</TableCell></TableRow>
              <TableRow><TableCell>CTA clicks</TableCell><TableCell className="text-right">{a.cta}</TableCell></TableRow>
              <TableRow><TableCell>CTA CTR</TableCell><TableCell className="text-right">{(a.ctaCtr * 100).toFixed(1)}%</TableCell></TableRow>
              <TableRow><TableCell>Add to cart</TableCell><TableCell className="text-right">{a.addToCart}</TableCell></TableRow>
              <TableRow><TableCell>Checkout clicks</TableCell><TableCell className="text-right">{a.checkout}</TableCell></TableRow>
              <TableRow><TableCell>Vote A</TableCell><TableCell className="text-right">{a.voteA}</TableCell></TableRow>
              <TableRow><TableCell>Vote B</TableCell><TableCell className="text-right">{a.voteB}</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Credits upgrade endpoint (mock payment)**

Create `src/app/api/credits/upgrade/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const schema = z.object({ amount: z.number().int().min(1).max(100).default(5) });

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { credits: { increment: parsed.data.amount } },
  });

  return NextResponse.json({ ok: true, credits: updated.credits });
}
```

---

### Task 11: Playwright E2E (mock mode) + basic build/lint + README end-to-end

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/campaign-flow.spec.ts`
- Modify: `package.json` (playwright scripts)
- Create/Update: `README.md`

- [ ] **Step 1: Install Playwright**

Run:

```bash
cd /workspace/pixverse-trae-adstudio
npx playwright install --with-deps
npm i -D @playwright/test
```

- [ ] **Step 2: Playwright config**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 3: E2E test (happy path)**

Create `e2e/campaign-flow.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("campaign flow mock pixverse → publish landing → events → analytics", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Login as Demo" }).click();

  await page.getByRole("link", { name: "New Campaign" }).click();
  await page.getByLabel("Title").fill("E2E Campaign");
  await page.getByText("Select objective").click();
  await page.getByRole("option", { name: "Conversion (Shop Now)" }).click();
  await page.getByRole("button", { name: "Create" }).click();

  await page.getByRole("link", { name: "1) Product Setup" }).click();
  await page.getByLabel("Image URL paths (comma separated)").fill("/uploads/sample.jpg");
  await page.getByLabel("Name").fill("Sample Product");
  await page.getByLabel("Price").fill("9.99");
  await page.getByLabel("Category").fill("Snacks");
  await page.getByLabel("Description").fill("Tasty and convenient.");
  await page.getByRole("button", { name: "Save Product" }).click();

  await page.getByRole("link", { name: "2) Creative Packs" }).click();
  await page.getByLabel("Selected pack (paste pack id)").fill("");
  await page.getByLabel("Audience").fill("Snack lovers");
  await page.getByLabel("Tone").fill("Playful, punchy");
  await page.getByLabel("Overlay language").fill("English");
  await page.getByLabel("CTA text").fill("Shop Now");
  await page.getByRole("button", { name: "Save Creative Config" }).click();

  await page.getByRole("link", { name: "3) Generate (PixVerse)" }).click();
  await page.getByRole("button", { name: "Generate A" }).click();
  await page.getByRole("button", { name: "Poll Status" }).click();

  await page.getByRole("link", { name: "4) Landing Builder" }).click();
  await expect(page.getByText("Total duration (variant A):")).toBeVisible();

  await page.getByLabel("Public slug").fill("e2e-campaign");
  await page.getByRole("button", { name: "Publish Landing" }).click();

  await page.getByText("Video Playlist").waitFor();
  await page.evaluate(async () => {
    await fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ campaignId: (window as any).__campaignId, type: "view" }),
    });
  });
});
```

- [ ] **Step 4: Add scripts**

Add to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

- [ ] **Step 5: README end-to-end**

Create `README.md`:

```md
# PixVerse × TRAE AdStudio (MVP)

## Prerequisites
- Node.js 18+
- (Optional) PixVerse CLI login via device flow (token tersimpan di ~/.pixverse/)

## Setup
```bash
cd pixverse-trae-adstudio
cp .env.example .env
npm i
npx prisma migrate dev --name init
npx prisma db seed
```

## Run
```bash
npm run dev
```

## Mock mode
Set `PIXVERSE_MOCK="true"` di `.env` untuk demo tanpa kredensial.

## E2E
```bash
npm run test:e2e
```
```

---

## Self-review checklist (coverage vs PRD)

- Campaign builder: list/create/detail + objective preset/custom (Task 4)
- Product setup: upload/validation/storage + DB (Task 5)
- Creative packs: 3 seed packs + customization defaults (Task 2 + Task 6)
- Prompt builder: HOOK/FEATURE/OFFER + hook line + CTA/tone fallback (Task 7)
- PixVerse pipeline: server-only CLI + submit/poll + status mapping + mock mode (Task 8)
- Landing shoppable: public slug + playlist + chapters + CTA/cart/checkout + voting/comment events (Task 9)
- Analytics: aggregate events + dashboard (Task 10)
- Credits gating: decrement credits per generate + upgrade endpoint (Task 8 + Task 10)
- Verifikasi: build/lint + Playwright E2E (Task 11)

