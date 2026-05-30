import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(_: Request, ctx: { params: Promise<{ jobId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 })

  const { jobId } = await ctx.params
  const job = await prisma.generationJob.findFirst({
    where: { id: jobId, userId: session.user.id },
    include: { video: true },
  })
  if (!job?.video?.url) return Response.json({ error: "not_ready" }, { status: 400 })
  return Response.redirect(job.video.url)
}
