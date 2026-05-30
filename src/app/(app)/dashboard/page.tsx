import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getCreditsBalance, grantTrialCreditsIfNone } from "@/lib/credits"
import { prisma } from "@/lib/db"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <>
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-4 text-card-foreground">
            <div className="text-sm text-muted-foreground">Credits</div>
            <div className="mt-2 text-2xl font-semibold">—</div>
          </div>
          <div className="rounded-xl border bg-card p-4 text-card-foreground">
            <div className="text-sm text-muted-foreground">Generating</div>
            <div className="mt-2 text-2xl font-semibold">—</div>
          </div>
          <div className="rounded-xl border bg-card p-4 text-card-foreground">
            <div className="text-sm text-muted-foreground">Quick action</div>
            <Link
              href="/login"
              className="mt-2 inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              Sign in to generate
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex min-h-[50vh] flex-1 flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Recent projects</div>
              <Link className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground" href="/projects">
                View all
              </Link>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              Sign in to see your projects.
            </div>
          </div>

          <div className="flex min-h-[50vh] flex-1 flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Recent jobs</div>
              <Link className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground" href="/jobs">
                View all
              </Link>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              Sign in to see your job history.
            </div>
          </div>
        </div>
      </>
    )
  }

  await grantTrialCreditsIfNone(session.user.id)

  const [credits, generating, projects, jobs] = await Promise.all([
    getCreditsBalance(session.user.id),
    prisma.generationJob.count({ where: { userId: session.user.id, status: "generating" } }),
    prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.generationJob.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        project: { select: { id: true, title: true } },
        video: { select: { url: true } },
      },
    }),
  ])

  async function quickGenerate() {
    "use server"
    const s = await auth()
    if (!s?.user?.id) redirect("/login")
    const project = await prisma.project.create({
      data: { userId: s.user.id, title: `Quick — ${new Date().toISOString()}` },
    })
    redirect(`/projects/${project.id}`)
  }

  return (
    <>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 text-card-foreground">
          <div className="text-sm text-muted-foreground">Credits</div>
          <div className="mt-2 text-2xl font-semibold">{credits}</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-card-foreground">
          <div className="text-sm text-muted-foreground">Generating</div>
          <div className="mt-2 text-2xl font-semibold">{generating}</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-card-foreground">
          <div className="text-sm text-muted-foreground">Quick action</div>
          <form action={quickGenerate} className="mt-2">
            <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
              Quick Generate
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex min-h-[50vh] flex-1 flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Recent projects</div>
            <Link className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground" href="/projects">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {projects.length ? (
              projects.map((p) => (
                <Link
                  key={p.id}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                  href={`/projects/${p.id}`}
                >
                  <div className="font-medium">{p.title}</div>
                </Link>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No projects yet.</div>
            )}
          </div>
        </div>

        <div className="flex min-h-[50vh] flex-1 flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Recent jobs</div>
            <Link className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground" href="/jobs">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {jobs.length ? (
              jobs.map((j) => (
                <div key={j.id} className="rounded-lg border px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/projects/${j.projectId}`} className="truncate font-medium hover:underline">
                      {j.project?.title ?? "Project"}
                    </Link>
                    <span className="text-xs text-muted-foreground">{j.status}</span>
                  </div>
                  {j.video?.url ? (
                    <a
                      className="mt-1 inline-flex text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                      href={j.video.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open video
                    </a>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No jobs yet.</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
