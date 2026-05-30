import crypto from "node:crypto"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function getCookieName() {
  return "next-auth.session-token"
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 })
  }

  const url = new URL(req.url)
  const secret = url.searchParams.get("secret") ?? ""
  const authz = req.headers.get("authorization") ?? ""
  const bearer = authz.toLowerCase().startsWith("bearer ") ? authz.slice(7) : ""
  const expected = process.env.DEV_ADMIN_SECRET ?? ""

  if (!expected || (secret !== expected && bearer !== expected)) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const email = url.searchParams.get("email") ?? process.env.SUPER_ADMIN_EMAIL ?? "admin@mbg.local"
  const name = url.searchParams.get("name") ?? "Super Admin"

  const user = await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
    select: { id: true },
  })

  const sessionToken = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)

  await prisma.session.create({
    data: { sessionToken, userId: user.id, expires },
  })

  const res = NextResponse.redirect(new URL("/dashboard", url), { status: 302 })
  res.cookies.set(getCookieName(), sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    expires,
  })
  return res
}

