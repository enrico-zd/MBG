import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { consumeCreditsForJob, getCreditsBalance, grantTrialCreditsIfNone } from "@/lib/credits"
import { pixverseGenerateImageToVideo, pixverseUploadImage } from "@/lib/pixverse"
import { type DurationSeconds, type Quality, quoteCredits } from "@/lib/pricing"
import { assertJobCreateRateLimit } from "@/lib/rate-limit"
import { getObject } from "@/lib/storage"

type Body = {
  projectId: string
  packId: string
  duration: DurationSeconds
  quality: Quality
  productName: string
  offer?: string
  cta?: string
  tone?: string
  language?: "id" | "en"
  benefits?: string[]
  idempotencyKey: string
}

function buildPrompt(input: Body, pack: { name: string; basePrompt: string }) {
  const benefits = (input.benefits ?? []).slice(0, 3).filter(Boolean)
  const parts = [
    pack.basePrompt,
    `Pack: ${pack.name}`,
    `Product: ${input.productName}`,
    benefits.length ? `Benefits: ${benefits.join(" | ")}` : "",
    input.offer ? `Offer: ${input.offer}` : "",
    input.cta ? `CTA: ${input.cta}` : "",
    `Language: ${input.language ?? "id"}`,
    `Tone: ${input.tone ?? "energetic"}`,
    `Constraints: 9:16 portrait, ${input.duration}s, no audio, TikTok pacing, show product clearly, no watermark.`,
  ].filter(Boolean)
  return parts.join("\n")
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 })

    const body = (await req.json()) as Body

    await grantTrialCreditsIfNone(session.user.id)
    await assertJobCreateRateLimit(session.user.id)

    const pack = await prisma.templatePack.findUnique({ where: { id: body.packId } })
    if (!pack) return Response.json({ error: "invalid_pack" }, { status: 400 })

    const project = await prisma.project.findFirst({
      where: { id: body.projectId, userId: session.user.id },
      select: { id: true },
    })
    if (!project) return Response.json({ error: "invalid_project" }, { status: 400 })

    const quote = quoteCredits(body.duration, body.quality)
    const balance = await getCreditsBalance(session.user.id)
    if (balance < quote) {
      return Response.json({ error: "insufficient_credits", quote, balance }, { status: 402 })
    }

    const existing = await prisma.generationJob.findUnique({
      where: { userId_idempotencyKey: { userId: session.user.id, idempotencyKey: body.idempotencyKey } },
    })
    if (existing) return Response.json({ jobId: existing.id, quoteCredits: existing.quoteCredits })

    const promptFinal = buildPrompt(body, { name: pack.name, basePrompt: pack.basePrompt })

    const firstAsset = await prisma.asset.findFirst({
      where: { projectId: project.id, userId: session.user.id, deletedAt: null },
      orderBy: { createdAt: "asc" },
    })
    if (!firstAsset) return Response.json({ error: "no_assets" }, { status: 400 })

    const job = await prisma.generationJob.create({
      data: {
        userId: session.user.id,
        projectId: project.id,
        packId: pack.id,
        status: "generating",
        provider: "pixverse",
        params: {
          duration: body.duration,
          quality: body.quality,
          productName: body.productName,
          offer: body.offer ?? null,
          cta: body.cta ?? null,
        },
        promptFinal,
        quoteCredits: quote,
        idempotencyKey: body.idempotencyKey,
        startedAt: new Date(),
      },
    })

    await consumeCreditsForJob({ userId: session.user.id, jobId: job.id, quoteCredits: quote })

    const assetBytes = await getObject({ key: firstAsset.url })
    const uploaded = await pixverseUploadImage({ bytes: assetBytes.bytes, filename: "image.webp" })
    const gen = await pixverseGenerateImageToVideo({
      imgId: uploaded.img_id,
      prompt: promptFinal,
      duration: body.duration,
      quality: body.quality,
    })

    await prisma.generationJob.update({
      where: { id: job.id },
      data: { providerJobId: String(gen.video_id) },
    })

    return Response.json({ jobId: job.id, quoteCredits: quote })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown"
    return Response.json(
      { error: process.env.NODE_ENV === "development" ? msg : "internal_error" },
      { status: 500 },
    )
  }
}
