import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applySessionCookie, createSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const rawEmail = typeof body?.email === "string" ? body.email : "";
  const email =
    rawEmail.trim().toLowerCase() || "demo@pixverse.local";

  const existingUser = await prisma.user.findUnique({ where: { email } });
  const user =
    existingUser ??
    (await prisma.user.create({
      data: { email, name: "Demo User" },
    }));

  const { token, expiresAt } = await createSession(user.id);

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email },
  });
  applySessionCookie(res, token, expiresAt);
  return res;
}

