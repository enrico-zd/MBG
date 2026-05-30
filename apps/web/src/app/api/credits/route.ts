import { NextResponse } from "next/server";
import { getCredits } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const credits = await getCredits();
  return NextResponse.json({ credits });
}

