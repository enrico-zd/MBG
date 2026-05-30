import { prisma } from "@/lib/db"
import { refundCreditsForJob } from "@/lib/credits"
import { pixverseGetVideoResult } from "@/lib/pixverse"

function is916(w?: number, h?: number) {
  if (!w || !h) return false
  return Math.abs(w / h - 9 / 16) < 0.02
}

function isValidDurationSeconds(s?: number) {
  return s === 5 || s === 10 || s === 15
}

export async function pollJobsTick() {
  const globalGenerating = await prisma.generationJob.count({ where: { status: "generating" } })
  if (globalGenerating > 20) return { processed: 0 }

  const jobs = await prisma.generationJob.findMany({
    where: { status: "generating", provider: "pixverse", providerJobId: { not: null } },
    orderBy: { startedAt: "asc" },
    take: 20,
  })

  let processed = 0

  for (const job of jobs) {
    const startedAt = job.startedAt?.getTime() ?? job.createdAt.getTime()
    const ageMs = Date.now() - startedAt
    const ttlMs = 20 * 60 * 1000

    if (ageMs > ttlMs) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          failureCode: "timeout_ttl",
          failureMessage: "Timed out waiting for PixVerse result",
          finishedAt: new Date(),
        },
      })
      await refundCreditsForJob({ userId: job.userId, jobId: job.id, amount: job.quoteCredits })
      processed++
      continue
    }

    const videoId = Number(job.providerJobId)
    if (!Number.isFinite(videoId)) continue

    let resp
    try {
      resp = await pixverseGetVideoResult(videoId)
    } catch {
      continue
    }

    if (resp.status === 5) continue

    if (resp.status === 7) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          failureCode: "moderation_failed",
          failureMessage: "PixVerse moderation failed",
          finishedAt: new Date(),
        },
      })
      await refundCreditsForJob({ userId: job.userId, jobId: job.id, amount: job.quoteCredits })
      processed++
      continue
    }

    if (resp.status === 8) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          failureCode: "generation_failed",
          failureMessage: "PixVerse generation failed",
          finishedAt: new Date(),
        },
      })
      await refundCreditsForJob({ userId: job.userId, jobId: job.id, amount: job.quoteCredits })
      processed++
      continue
    }

    if (resp.status !== 1 || !resp.url) continue

    const expectedDuration =
      typeof job.params === "object" && job.params && "duration" in job.params
        ? (job.params as { duration?: number }).duration
        : undefined

    const durationSeconds = isValidDurationSeconds(expectedDuration) ? expectedDuration : 0
    const res = `${resp.outputWidth ?? 0}x${resp.outputHeight ?? 0}`
    const aspectRatio = is916(resp.outputWidth, resp.outputHeight) ? "9:16" : "unknown"

    await prisma.videoAsset.create({
      data: {
        jobId: job.id,
        url: resp.url,
        durationSeconds,
        resolution: res,
        format: "mp4",
        aspectRatio,
      },
    })

    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "done",
        finishedAt: new Date(),
        settleCredits: job.quoteCredits,
      },
    })

    processed++
  }

  return { processed }
}

