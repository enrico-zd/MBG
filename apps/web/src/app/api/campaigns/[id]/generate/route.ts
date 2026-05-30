import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { createVideoJob, getCampaignById, getCredits, getVideoJob, updateVideoJob } from "@/lib/db";
import { getRecommendedPacks } from "@/lib/packs";
import { uploadImageFromBuffer, generateVideoFromImage, getVideoResult } from "@/lib/pixverse";
import { resolveUploadFilePath } from "@/lib/upload-path";
import { buildPixversePrompt } from "@/lib/prompt";

export const runtime = "nodejs";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const campaign = await getCampaignById(id);
  if (!campaign) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const packs = getRecommendedPacks({
    objective: campaign.objective,
    category: campaign.product?.category ?? "General",
  });
  const selected = packs.find((p) => p.id === campaign.selectedPackId) ?? packs[0];

  const product = campaign.product;
  if (!product || !product.imageUrls?.length) {
    return NextResponse.json({ error: "product_required" }, { status: 400 });
  }

  const model = process.env.PIXVERSE_MODEL?.trim() || "v6";
  const quality = process.env.PIXVERSE_QUALITY?.trim() || "720p";
  const durationEnv = Number(process.env.PIXVERSE_DURATION ?? "");
  const duration = Number.isFinite(durationEnv) ? Math.round(durationEnv) : 15;
  const clampedDuration = Math.min(15, Math.max(1, duration));

  try {
    const firstImageUrl = product.imageUrls[0] ?? "";
    const filePath = resolveUploadFilePath(firstImageUrl);
    const buffer = await fs.readFile(filePath);

    const { imageId } = await uploadImageFromBuffer({
      buffer,
      filename: filePath.split("/").pop() || "image.jpg",
    });

    const prompt = buildPixversePrompt({ campaign, product, pack: selected });
    const { videoId } = await generateVideoFromImage({
      imageId,
      prompt,
      model,
      duration: clampedDuration,
      quality,
    });

    const job = await createVideoJob({
      campaignId: id,
      creditCost: selected.creditCost,
      pixverse: { imageId, videoId, model, quality, prompt },
      durationSec: clampedDuration,
    });
    const credits = await getCredits();
    return NextResponse.json({ job, credits }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "insufficient_credits") {
      const credits = await getCredits();
      return NextResponse.json({ error: "insufficient_credits", credits }, { status: 402 });
    }
    if (err instanceof Error && (err.message.startsWith("pixverse_") || err.message.startsWith("pixverse_http_"))) {
      return NextResponse.json({ error: err.message }, { status: 502 });
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

  const pix = existing.pixverse;
  if (!pix) return NextResponse.json({ error: "job_invalid" }, { status: 500 });

  try {
    const result = await getVideoResult(pix.videoId);

    const patch: Parameters<typeof updateVideoJob>[1] = {};

    if (result.status === 1) {
      patch.status = "done";
      patch.finishedAt = new Date().toISOString();
      patch.videoUrl = result.url;
      patch.error = undefined;
    } else if (result.status === 5) {
      patch.status = "generating";
    } else if (result.status === 7 || result.status === 8) {
      patch.status = "failed";
      patch.finishedAt = new Date().toISOString();
      patch.error = `pixverse_status_${result.status}`;
    } else {
      patch.status = existing.status;
    }

    const job = await updateVideoJob(existing.id, patch);
    return NextResponse.json({ job });
  } catch (e) {
    const job = await updateVideoJob(existing.id, { status: "failed", error: "pixverse_poll_failed" }).catch(
      () => existing,
    );
    return NextResponse.json({ job, error: e instanceof Error ? e.message : "pixverse_poll_failed" });
  }
}
