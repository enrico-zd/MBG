import { prisma } from "@/lib/db/prisma"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

type Params = { params: Promise<{ projectId: string }> }

export async function GET(_req: NextRequest, ctx: Params) {
  const { projectId } = await ctx.params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      assets: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
    },
  })

  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json({ project })
}

export async function PATCH(req: NextRequest, ctx: Params) {
  const { projectId } = await ctx.params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  if (!body || typeof body !== "object") return NextResponse.json({ error: "invalid_body" }, { status: 400 })

  const title = (body as any).title
  if (typeof title !== "string" || title.trim().length < 1)
    return NextResponse.json({ error: "invalid_title" }, { status: 400 })

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { title: title.trim() },
  })

  return NextResponse.json({ project })
}

export async function DELETE(_req: NextRequest, ctx: Params) {
  const { projectId } = await ctx.params

  const exists = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })
  if (!exists) return NextResponse.json({ error: "not_found" }, { status: 404 })

  await prisma.$transaction([
    prisma.adJobSegment.deleteMany({ where: { adJob: { projectId } } }),
    prisma.adJob.deleteMany({ where: { projectId } }),
    prisma.asset.deleteMany({ where: { projectId } }),
    prisma.project.delete({ where: { id: projectId } }),
  ])

  return NextResponse.json({ ok: true })
}
