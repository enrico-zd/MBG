import fs from "node:fs/promises";
import path from "node:path";
import type { Campaign, Db, EventLog, VideoJob } from "@/lib/types";

const DB_DIR = path.join(process.cwd(), ".local");
const DB_PATH = path.join(DB_DIR, "adstudio-db.json");
const TMP_PATH = path.join(DB_DIR, "adstudio-db.tmp.json");

function nowIso() {
  return new Date().toISOString();
}

export function newId() {
  return crypto.randomUUID();
}

export function defaultChapters() {
  return [
    { title: "Intro", startSec: 0 },
    { title: "Features", startSec: 10 },
    { title: "Offer", startSec: 20 },
  ];
}

function defaultDb(): Db {
  return {
    meta: { version: 1 },
    user: { credits: 2 },
    campaigns: [],
    videoJobs: [],
    events: [],
  };
}

async function ensureDbFile() {
  await fs.mkdir(DB_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(defaultDb(), null, 2), "utf8");
  }
}

export async function readDb(): Promise<Db> {
  await ensureDbFile();
  const raw = await fs.readFile(DB_PATH, "utf8");
  const parsed = JSON.parse(raw) as Db;
  return parsed;
}

export async function writeDb(next: Db): Promise<void> {
  await ensureDbFile();
  const json = JSON.stringify(next, null, 2);
  await fs.writeFile(TMP_PATH, json, "utf8");
  await fs.rename(TMP_PATH, DB_PATH);
}

export async function withDb<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const db = await readDb();
  const out = await fn(db);
  await writeDb(db);
  return out;
}

export async function listCampaigns(): Promise<Campaign[]> {
  const db = await readDb();
  return db.campaigns.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getCampaignById(id: string): Promise<Campaign | undefined> {
  const db = await readDb();
  return db.campaigns.find((c) => c.id === id);
}

export async function getCampaignBySlug(slug: string): Promise<Campaign | undefined> {
  const db = await readDb();
  return db.campaigns.find((c) => c.slug === slug);
}

export async function createCampaign(input: {
  title: string;
  objective: Campaign["objective"];
  product?: Campaign["product"];
}): Promise<Campaign> {
  return withDb((db) => {
    const ts = nowIso();
    const campaign: Campaign = {
      id: newId(),
      title: input.title,
      objective: input.objective,
      status: "draft",
      createdAt: ts,
      updatedAt: ts,
      product: input.product,
      chapters: defaultChapters(),
    };
    db.campaigns.push(campaign);
    return campaign;
  });
}

export async function updateCampaign(id: string, patch: Partial<Campaign>): Promise<Campaign> {
  return withDb((db) => {
    const existing = db.campaigns.find((c) => c.id === id);
    if (!existing) throw new Error("campaign_not_found");

    Object.assign(existing, patch);
    existing.updatedAt = nowIso();
    return existing;
  });
}

export async function getCredits(): Promise<number> {
  const db = await readDb();
  return db.user.credits;
}

export async function spendCredits(amount: number): Promise<number> {
  return withDb((db) => {
    if (db.user.credits < amount) throw new Error("insufficient_credits");
    db.user.credits -= amount;
    return db.user.credits;
  });
}

export async function addCredits(amount: number): Promise<number> {
  return withDb((db) => {
    db.user.credits += amount;
    return db.user.credits;
  });
}

export async function createVideoJob(input: {
  campaignId: string;
  creditCost: number;
  pixverse: VideoJob["pixverse"];
  videoUrl?: string;
  durationSec?: number;
}): Promise<VideoJob> {
  await spendCredits(input.creditCost);

  return withDb((db) => {
    const job: VideoJob = {
      id: newId(),
      campaignId: input.campaignId,
      provider: "pixverse",
      status: "queued",
      startedAt: nowIso(),
      pixverse: input.pixverse,
      videoUrl: input.videoUrl,
      durationSec: input.durationSec,
    };
    db.videoJobs.push(job);
    const campaign = db.campaigns.find((c) => c.id === input.campaignId);
    if (campaign) campaign.videoJobId = job.id;
    return job;
  });
}

export async function getVideoJob(id: string): Promise<VideoJob | undefined> {
  const db = await readDb();
  return db.videoJobs.find((j) => j.id === id);
}

export async function updateVideoJob(id: string, patch: Partial<VideoJob>): Promise<VideoJob> {
  return withDb((db) => {
    const job = db.videoJobs.find((j) => j.id === id);
    if (!job) throw new Error("job_not_found");
    Object.assign(job, patch);
    return job;
  });
}

export async function advanceVideoJob(jobId: string): Promise<VideoJob> {
  return withDb((db) => {
    const job = db.videoJobs.find((j) => j.id === jobId);
    if (!job) throw new Error("job_not_found");

    if (job.status === "done" || job.status === "failed") return job;

    const elapsedMs = Date.now() - new Date(job.startedAt).getTime();
    if (elapsedMs < 1200) job.status = "queued";
    else if (elapsedMs < 4500) job.status = "generating";
    else {
      job.status = "done";
      job.finishedAt = nowIso();
      job.durationSec = job.durationSec ?? 35;
    }

    return job;
  });
}

export async function addEvent(input: {
  campaignId: string;
  type: EventLog["type"];
}): Promise<EventLog> {
  return withDb((db) => {
    const event: EventLog = {
      id: newId(),
      campaignId: input.campaignId,
      type: input.type,
      ts: nowIso(),
    };
    db.events.push(event);
    return event;
  });
}

export async function getCampaignAnalytics(campaignId: string) {
  const db = await readDb();
  const viewCount = db.events.filter((e) => e.campaignId === campaignId && e.type === "view")
    .length;
  const ctaCount = db.events.filter((e) => e.campaignId === campaignId && e.type === "cta_click")
    .length;
  const ctr = viewCount === 0 ? 0 : ctaCount / viewCount;

  return { viewCount, ctaCount, ctr };
}
