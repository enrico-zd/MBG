import { NextResponse } from "next/server";
import { getCampaignById, updateCampaign } from "@/lib/db";
import { getRecommendedPacks } from "@/lib/packs";
import { uniqueSlug } from "@/lib/slug";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const campaign = await getCampaignById(id);
  if (!campaign) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = (await req.json()) as { ctaText?: string; checkoutUrl?: string };

  const packs = getRecommendedPacks({
    objective: campaign.objective,
    category: campaign.product?.category ?? "General",
  });
  const selected = packs.find((p) => p.id === campaign.selectedPackId) ?? packs[0];

  const slug = campaign.slug ?? uniqueSlug({ title: campaign.title, suffix: id.slice(0, 6) });
  const ctaText =
    typeof body.ctaText === "string"
      ? body.ctaText.trim()
      : typeof campaign.ctaText === "string"
        ? campaign.ctaText.trim()
        : selected.recommendedCTA;
  const checkoutUrl =
    typeof body.checkoutUrl === "string"
      ? body.checkoutUrl.trim()
      : typeof campaign.checkoutUrl === "string"
        ? campaign.checkoutUrl.trim()
        : "";

  const updated = await updateCampaign(id, { status: "published", slug, ctaText, checkoutUrl });
  return NextResponse.json({ campaign: updated, publicPath: `/c/${slug}` });
}

