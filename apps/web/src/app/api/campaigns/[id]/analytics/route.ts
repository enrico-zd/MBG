import { NextResponse } from "next/server";
import { getCampaignAnalytics, getCampaignById } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const campaign = await getCampaignById(id);
  if (!campaign) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const analytics = await getCampaignAnalytics(id);
  return NextResponse.json({ analytics });
}

