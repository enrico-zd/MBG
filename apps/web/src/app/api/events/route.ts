import { NextResponse } from "next/server";
import { addEvent } from "@/lib/db";
import type { EventType } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as { campaignId?: string; type?: EventType };
  const campaignId = body.campaignId?.trim();
  const type = body.type;

  if (!campaignId) return NextResponse.json({ error: "campaignId_required" }, { status: 400 });
  if (type !== "view" && type !== "cta_click") {
    return NextResponse.json({ error: "type_invalid" }, { status: 400 });
  }

  const event = await addEvent({ campaignId, type });
  return NextResponse.json({ event }, { status: 201 });
}

