import crypto from "crypto"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

function hashToken(t: string) {
  return crypto.createHash("sha256").update(t).digest("hex")
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 })

  const body = (await req.json()) as { jobId: string }
  const job = await prisma.generationJob.findFirst({
    where: { id: body.jobId, userId: session.user.id, status: "done" },
    include: { video: true },
  })
  if (!job?.video) return Response.json({ error: "not_ready" }, { status: 400 })

  const token = crypto.randomBytes(24).toString("hex")
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)

  await prisma.shareLink.create({
    data: { userId: session.user.id, jobId: job.id, tokenHash, expiresAt },
  })

  return Response.json({ token, expiresAt })
}
