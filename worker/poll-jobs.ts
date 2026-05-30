import { prisma } from "../src/lib/db"
import { refundCreditsForJob } from "../src/lib/credits"
import { pixverseGetVideoResult } from "../src/lib/pixverse"

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function is916(w?: number, h?: number) {
  if (!w || !h) return false
  return Math.abs(w / h - 9 / 16) < 0.02
}

function isValidDurationSeconds(s?: number) {
  return s === 5 || s === 10 || s === 15
}

async function tick() {
  const globalGenerating = await prisma.generationJob.count({ where: { status: "generating" } })
  if (globalGenerating > 20) return

  const jobs = await prisma.generationJob.findMany({
    where: { status: "generating", provider: "pixverse", providerJobId: { not: null } },
    orderBy: { startedAt: "asc" },
    take: 20,
  })

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
      continue
    }

    if (resp.status === 8 || !resp.url) {
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
      continue
    }

    const ratioOk = is916(resp.outputWidth, resp.outputHeight)
    if (!ratioOk) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          failureCode: "failed_invalid_output",
          failureMessage: "Invalid aspect ratio (expected 9:16)",
          finishedAt: new Date(),
        },
      })
      await refundCreditsForJob({ userId: job.userId, jobId: job.id, amount: job.quoteCredits })
      continue
    }

    const expectedDuration =
      typeof job.params === "object" && job.params && "duration" in job.params
        ? (job.params as { duration?: number }).duration
        : undefined
    if (!isValidDurationSeconds(expectedDuration)) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          failureCode: "failed_invalid_job_params",
          failureMessage: "Invalid requested duration",
          finishedAt: new Date(),
        },
      })
      await refundCreditsForJob({ userId: job.userId, jobId: job.id, amount: job.quoteCredits })
      continue
    }

    await prisma.videoAsset.create({
      data: {
        jobId: job.id,
        url: resp.url,
        durationSeconds: expectedDuration,
        resolution: `${resp.outputWidth ?? 0}x${resp.outputHeight ?? 0}`,
        format: "mp4",
        aspectRatio: "9:16",
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
  }
}

async function main() {
  while (true) {
    await tick()
    await sleep(3000)
  }
}

main()
  .catch(async () => {
    await prisma.$disconnect()
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
