import { prisma } from "@/lib/db"

export async function assertJobCreateRateLimit(userId: string) {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [hourCount, dayCount, generatingCount] = await Promise.all([
    prisma.generationJob.count({ where: { userId, createdAt: { gte: oneHourAgo } } }),
    prisma.generationJob.count({ where: { userId, createdAt: { gte: oneDayAgo } } }),
    prisma.generationJob.count({ where: { userId, status: "generating" } }),
  ])

  if (generatingCount >= 2) throw new Error("rate_limit_concurrency_user")
  if (hourCount >= 10) throw new Error("rate_limit_hour")
  if (dayCount >= 30) throw new Error("rate_limit_day")
}
