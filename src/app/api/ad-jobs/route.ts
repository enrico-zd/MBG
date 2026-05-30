import { prisma } from "@/lib/db/prisma"
import { enqueueTask } from "@/lib/queue/enqueue"
import { buildSegmentPrompt, type SegmentKind } from "@/lib/prompt/promptBuilder"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

type Quality = "360p" | "540p" | "720p" | "1080p"

function creditsPerSecondNoAudio(quality: Quality) {
  if (quality === "360p") return 5
  if (quality === "540p") return 7
  if (quality === "720p") return 9
  return 18
}

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

function templatePackFromId(templatePackId: string) {
  if (templatePackId === "ugc_promo") return { id: "ugc_promo", name: "UGC Promo", baseStyle: "UGC handheld, realistic lighting" }
  if (templatePackId === "studio_minimal")
    return { id: "studio_minimal", name: "Studio Minimal", baseStyle: "clean studio lighting, minimal background" }
  if (templatePackId === "luxury") return { id: "luxury", name: "Luxury", baseStyle: "premium product cinematography, elegant mood" }
  return null
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const projectId = url.searchParams.get("projectId")
  const userEmail = url.searchParams.get("userEmail")

  if (typeof projectId !== "string" || projectId.trim().length < 1)
    return NextResponse.json({ error: "invalid_projectId" }, { status: 400 })
  if (typeof userEmail !== "string" || !userEmail.includes("@"))
    return NextResponse.json({ error: "invalid_userEmail" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true } })
  if (!user) return NextResponse.json({ adJobs: [] })

  const adJobs = await prisma.adJob.findMany({
    where: { projectId, userId: user.id },
    include: { segments: { orderBy: { segmentIndex: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ adJobs: adJobs.map(adJobToJson) })
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  if (!body || typeof body !== "object") return NextResponse.json({ error: "invalid_body" }, { status: 400 })

  const userEmail = (body as any).userEmail
  const projectId = (body as any).projectId
  const templatePackId = (body as any).templatePackId
  const targetDurationSec = (body as any).targetDurationSec
  const quality = (body as any).quality
  const params = (body as any).params

  if (typeof userEmail !== "string" || !userEmail.includes("@"))
    return NextResponse.json({ error: "invalid_userEmail" }, { status: 400 })
  if (typeof projectId !== "string" || projectId.trim().length < 1)
    return NextResponse.json({ error: "invalid_projectId" }, { status: 400 })
  if (typeof templatePackId !== "string" || templatePackId.trim().length < 1)
    return NextResponse.json({ error: "invalid_templatePackId" }, { status: 400 })
  if (targetDurationSec !== 30 && targetDurationSec !== 45)
    return NextResponse.json({ error: "invalid_targetDurationSec" }, { status: 400 })
  if (quality !== "360p" && quality !== "540p" && quality !== "720p" && quality !== "1080p")
    return NextResponse.json({ error: "invalid_quality" }, { status: 400 })
  if (!params || typeof params !== "object") return NextResponse.json({ error: "invalid_params" }, { status: 400 })

  const language = (params as any).language
  const tone = (params as any).tone
  const productName = (params as any).productName
  const benefits = (params as any).benefits
  const offer = (params as any).offer
  const cta = (params as any).cta
  const targetAudience = (params as any).targetAudience

  if (language !== "id" && language !== "en") return NextResponse.json({ error: "invalid_language" }, { status: 400 })
  if (tone !== "friendly" && tone !== "professional" && tone !== "energetic")
    return NextResponse.json({ error: "invalid_tone" }, { status: 400 })
  if (typeof productName !== "string" || productName.trim().length < 1)
    return NextResponse.json({ error: "invalid_productName" }, { status: 400 })
  if (!Array.isArray(benefits) || benefits.some((b) => typeof b !== "string"))
    return NextResponse.json({ error: "invalid_benefits" }, { status: 400 })
  if (typeof offer !== "string" || offer.trim().length < 1) return NextResponse.json({ error: "invalid_offer" }, { status: 400 })
  if (typeof cta !== "string" || cta.trim().length < 1) return NextResponse.json({ error: "invalid_cta" }, { status: 400 })
  if (typeof targetAudience !== "undefined" && typeof targetAudience !== "string")
    return NextResponse.json({ error: "invalid_targetAudience" }, { status: 400 })

  const pack = templatePackFromId(templatePackId)
  if (!pack) return NextResponse.json({ error: "unknown_templatePackId" }, { status: 400 })

  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: { email: userEmail },
  })

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, userId: true } })
  if (!project) return NextResponse.json({ error: "project_not_found" }, { status: 404 })
  if (project.userId !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const segmentsCount = targetDurationSec === 30 ? 2 : 3
  const segmentDurationSec = 15

  const kinds: SegmentKind[] = segmentsCount === 2 ? ["hook", "cta"] : ["hook", "benefit", "cta"]
  const promptParams = {
    language,
    tone,
    productName: productName.trim(),
    benefits: benefits.map((b: string) => b.trim()).filter(Boolean),
    offer: offer.trim(),
    cta: cta.trim(),
    targetAudience: typeof targetAudience === "string" ? targetAudience.trim() : undefined,
  }

  const estimatedPixverseCredits = creditsPerSecondNoAudio(quality) * targetDurationSec

  const adJob = await prisma.adJob.create({
    data: {
      userId: user.id,
      projectId,
      status: "queued",
      targetDurationSec,
      quality,
      generateAudio: false,
      templatePackId: pack.id,
      paramsJson: promptParams as any,
      estimatedPixverseCredits,
      segments: {
        create: kinds.map((kind, idx) => ({
          segmentIndex: idx,
          durationSec: segmentDurationSec,
          status: "queued",
          promptFinal: buildSegmentPrompt({
            pack,
            params: promptParams,
            kind,
            durationSec: segmentDurationSec,
          }),
        })),
      },
    },
    include: { segments: { orderBy: { segmentIndex: "asc" } } },
  })

  await Promise.all(
    adJob.segments.map((seg) => enqueueTask({ type: "pixverse.upload_image", payloadJson: { segmentId: seg.id } })),
  )

  return NextResponse.json({ adJob: adJobToJson(adJob) }, { status: 201 })
}
