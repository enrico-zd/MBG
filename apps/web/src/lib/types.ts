export type Objective = "awareness" | "conversion";

export type CampaignStatus = "draft" | "published";

export type CreativePackId = "minimal-studio" | "lifestyle-urban" | "luxury-cinematic";

export type EventType = "view" | "cta_click";

export type CampaignChapter = {
  title: string;
  startSec: number;
};

export type Product = {
  name: string;
  price: string;
  description: string;
  category: string;
  imageUrls: string[];
};

export type VideoJobStatus = "queued" | "generating" | "done" | "failed";

export type VideoJob = {
  id: string;
  campaignId: string;
  provider: "pixverse";
  status: VideoJobStatus;
  startedAt: string;
  finishedAt?: string;
  error?: string;
  videoUrl?: string;
  durationSec?: number;
  pixverse?: {
    imageId: number;
    videoId: number;
    model: string;
    quality: string;
    prompt: string;
  };
};

export type Campaign = {
  id: string;
  title: string;
  objective: Objective;
  status: CampaignStatus;
  slug?: string;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  selectedPackId?: CreativePackId;
  packCustomize?: {
    language: string;
    tone: string;
    promo: string;
  };
  ctaText?: string;
  checkoutUrl?: string;
  chapters?: CampaignChapter[];
  videoJobId?: string;
};

export type CreativePack = {
  id: CreativePackId;
  name: string;
  style: string;
  basePrompt: string;
  recommendedCTA: string;
  targetDurationSec: number;
  creditCost: number;
};

export type EventLog = {
  id: string;
  campaignId: string;
  type: EventType;
  ts: string;
};

export type Db = {
  meta: {
    version: number;
  };
  user: {
    credits: number;
    trialEndsAt?: string;
  };
  campaigns: Campaign[];
  videoJobs: VideoJob[];
  events: EventLog[];
};
