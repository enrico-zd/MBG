import { NextResponse } from "next/server";
import { getCampaignById, updateCampaign } from "@/lib/db";
import type { Campaign } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const campaign = await getCampaignById(id);
  if (!campaign) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ campaign });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const exists = await getCampaignById(id);
  if (!exists) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = (await req.json()) as Partial<Campaign>;

  const patch: Partial<Campaign> = {};

  if (typeof body.title === "string") patch.title = body.title;
  if (body.objective === "awareness" || body.objective === "conversion") patch.objective = body.objective;
  if (body.status === "draft" || body.status === "published") patch.status = body.status;

  if (typeof body.slug === "string") patch.slug = body.slug;

  if (body.product) {
    patch.product = {
      name: body.product.name ?? "",
      price: body.product.price ?? "",
      description: body.product.description ?? "",
      category: body.product.category ?? "",
      imageUrls: Array.isArray(body.product.imageUrls) ? body.product.imageUrls : [],
    };
  }

  if (body.selectedPackId) patch.selectedPackId = body.selectedPackId;
  if (body.packCustomize) {
    patch.packCustomize = {
      language: body.packCustomize.language ?? "id",
      tone: body.packCustomize.tone ?? "",
      promo: body.packCustomize.promo ?? "",
    };
  }

  if (typeof body.ctaText === "string") patch.ctaText = body.ctaText;
  if (typeof body.checkoutUrl === "string") patch.checkoutUrl = body.checkoutUrl;
  if (Array.isArray(body.chapters)) patch.chapters = body.chapters;

  const campaign = await updateCampaign(id, patch);
  return NextResponse.json({ campaign });
}

