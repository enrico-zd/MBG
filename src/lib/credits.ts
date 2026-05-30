import { prisma } from "@/lib/db"

export async function getCreditsBalance(userId: string) {
  const agg = await prisma.creditLedger.aggregate({
    where: { userId },
    _sum: { delta: true },
  })
  return agg._sum.delta ?? 0
}

export async function grantTrialCreditsIfNone(userId: string) {
  const existing = await prisma.creditLedger.findFirst({
    where: { userId, reason: "trial_grant" },
    select: { id: true },
  })
  if (existing) return

  await prisma.creditLedger.create({
    data: {
      userId,
      delta: 100,
      reason: "trial_grant",
      refType: "admin",
      refId: "trial_100",
    },
  })
}

export async function consumeCreditsForJob(params: {
  userId: string
  jobId: string
  quoteCredits: number
}) {
  await prisma.creditLedger.create({
    data: {
      userId: params.userId,
      delta: -Math.abs(params.quoteCredits),
      reason: "consume",
      refType: "job",
      refId: params.jobId,
    },
  })
}

export async function refundCreditsForJob(params: {
  userId: string
  jobId: string
  amount: number
}) {
  const alreadyRefunded = await prisma.creditLedger.findFirst({
    where: {
      userId: params.userId,
      reason: "refund",
      refType: "job",
      refId: params.jobId,
    },
    select: { id: true },
  })
  if (alreadyRefunded) return

  await prisma.creditLedger.create({
    data: {
      userId: params.userId,
      delta: Math.abs(params.amount),
      reason: "refund",
      refType: "job",
      refId: params.jobId,
    },
  })
}
