import { NextResponse } from "next/server";
import { advanceVideoJob, createVideoJob, getCampaignById, getCredits, getVideoJob } from "@/lib/db";
import { getRecommendedPacks } from "@/lib/packs";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const campaign = await getCampaignById(id);
  if (!campaign) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = (await req.json()) as { videoUrl?: string; durationSec?: number };

  const packs = getRecommendedPacks({
    objective: campaign.objective,
    category: campaign.product?.category ?? "General",
  });
  const selected = packs.find((p) => p.id === campaign.selectedPackId) ?? packs[0];

  try {
    const job = await createVideoJob({
      campaignId: id,
      creditCost: selected.creditCost,
      videoUrl: typeof body.videoUrl === "string" ? body.videoUrl.trim() : undefined,
      durationSec: typeof body.durationSec === "number" ? body.durationSec : undefined,
    });
    const credits = await getCredits();
    return NextResponse.json({ job, credits }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "insufficient_credits") {
      const credits = await getCredits();
      return NextResponse.json({ error: "insufficient_credits", credits }, { status: 402 });
    }
    return NextResponse.json({ error: "generate_failed" }, { status: 500 });
  }
}

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const campaign = await getCampaignById(id);
  if (!campaign) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!campaign.videoJobId) return NextResponse.json({ error: "no_job" }, { status: 404 });

  const existing = await getVideoJob(campaign.videoJobId);
  if (!existing) return NextResponse.json({ error: "no_job" }, { status: 404 });

  const job = await advanceVideoJob(existing.id);
  return NextResponse.json({ job });
}

