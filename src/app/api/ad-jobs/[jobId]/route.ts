import { prisma } from "@/lib/db/prisma"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

type Params = { params: Promise<{ jobId: string }> }

function segmentToJson(segment: any) {
  const pixverseImgId = typeof segment.pixverseImgId === "bigint" ? segment.pixverseImgId.toString() : segment.pixverseImgId
  const pixverseVideoId =
    typeof segment.pixverseVideoId === "bigint" ? segment.pixverseVideoId.toString() : segment.pixverseVideoId
  return { ...segment, pixverseImgId, pixverseVideoId }
}

function adJobToJson(adJob: any) {
  if (!adJob) return adJob
  const segments = Array.isArray(adJob.segments) ? adJob.segments.map(segmentToJson) : adJob.segments
  return { ...adJob, segments }
}

export async function GET(req: NextRequest, ctx: Params) {
  const { jobId } = await ctx.params
  const url = new URL(req.url)
  const userEmail = url.searchParams.get("userEmail")

  if (userEmail && (typeof userEmail !== "string" || !userEmail.includes("@")))
    return NextResponse.json({ error: "invalid_userEmail" }, { status: 400 })

  const adJob = await prisma.adJob.findUnique({
    where: { id: jobId },
    include: { user: { select: { email: true } }, segments: { orderBy: { segmentIndex: "asc" } } },
  })

  if (!adJob) return NextResponse.json({ error: "not_found" }, { status: 404 })
  if (userEmail && adJob.user.email !== userEmail) return NextResponse.json({ error: "not_found" }, { status: 404 })

  return NextResponse.json({ adJob: adJobToJson(adJob) })
}

