import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

function labelStatus(status: string) {
  if (status === "queued") return "Queued"
  if (status === "generating") return "Generating"
  if (status === "done") return "Done"
  if (status === "failed") return "Failed"
  if (status === "cancelled") return "Cancelled"
  return status
}

function statusClass(status: string) {
  if (status === "done") return "bg-emerald-500/10 text-emerald-700"
  if (status === "failed") return "bg-red-500/10 text-red-700"
  if (status === "generating") return "bg-blue-500/10 text-blue-700"
  return "bg-muted text-foreground"
}

export default async function JobsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-lg font-semibold">Jobs</div>
          <div className="text-sm text-muted-foreground">Track generation progress and results.</div>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground">
          <div className="text-sm text-muted-foreground">Sign in to see your jobs.</div>
          <Link className="mt-2 inline-flex underline underline-offset-4" href="/login">
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  const items = await prisma.generationJob.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      project: { select: { id: true, title: true } },
      pack: { select: { id: true, name: true } },
      video: { select: { url: true } },
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Jobs</div>
          <div className="text-sm text-muted-foreground">{items.length} recent jobs</div>
        </div>
        <Link
          href="/generate"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          New generate
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card text-card-foreground">
        <div className="grid grid-cols-[1fr_auto] gap-2 border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground md:grid-cols-[1.2fr_1fr_1fr_auto]">
          <div>Project</div>
          <div className="hidden md:block">Pack</div>
          <div className="hidden md:block">Created</div>
          <div className="text-right">Status</div>
        </div>

        <div className="divide-y">
          {items.length ? (
            items.map((j) => (
              <div key={j.id} className="grid grid-cols-[1fr_auto] items-start gap-2 px-4 py-3 md:grid-cols-[1.2fr_1fr_1fr_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/projects/${j.projectId}`} className="truncate font-medium hover:underline">
                      {j.project?.title ?? "Project"}
                    </Link>
                    {j.video?.url ? (
                      <a
                        className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                        href={j.video.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open video
                      </a>
                    ) : null}
                  </div>
                  {j.failureMessage ? (
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{j.failureMessage}</div>
                  ) : null}
                  <div className="mt-1 text-xs text-muted-foreground md:hidden">
                    {j.pack?.name ?? j.packId} • {new Date(j.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="hidden text-sm text-muted-foreground md:block">{j.pack?.name ?? j.packId}</div>
                <div className="hidden text-sm text-muted-foreground md:block">{new Date(j.createdAt).toLocaleString()}</div>

                <div className="flex items-center justify-end">
                  <span className={`rounded-md px-2 py-1 text-xs font-medium ${statusClass(j.status)}`}>
                    {labelStatus(j.status)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-sm text-muted-foreground">No jobs yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
