import crypto from "crypto"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"

function hashToken(t: string) {
  return crypto.createHash("sha256").update(t).digest("hex")
}

export default async function SharePage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params
  const tokenHash = hashToken(token)
  const link = await prisma.shareLink.findFirst({
    where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    include: { job: { include: { video: true } } },
  })
  if (!link?.job?.video?.url) return notFound()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold">Shared video</h1>
      <video controls playsInline className="w-full rounded-lg border">
        <source src={link.job.video.url} type="video/mp4" />
      </video>
      <a
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        href={link.job.video.url}
      >
        Download
      </a>
      <meta name="robots" content="noindex,nofollow" />
    </div>
  )
}
