import { prisma } from "@/lib/db/prisma"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const userEmail = url.searchParams.get("userEmail")

  const projects = await prisma.project.findMany({
    where: userEmail ? { user: { email: userEmail } } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ projects })
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  if (!body || typeof body !== "object") return NextResponse.json({ error: "invalid_body" }, { status: 400 })

  const title = (body as any).title
  const userEmail = (body as any).userEmail

  if (typeof title !== "string" || title.trim().length < 1)
    return NextResponse.json({ error: "invalid_title" }, { status: 400 })
  if (typeof userEmail !== "string" || !userEmail.includes("@"))
    return NextResponse.json({ error: "invalid_userEmail" }, { status: 400 })

  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: { email: userEmail },
  })

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      title: title.trim(),
    },
  })

  return NextResponse.json({ project }, { status: 201 })
}
