import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <div className="rounded-xl border bg-card p-6 text-card-foreground">
        <div className="text-sm text-muted-foreground">You are not signed in.</div>
        <Link className="mt-2 inline-flex underline underline-offset-4" href="/login">
          Go to login
        </Link>
      </div>
    )
  }

  const items = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

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
          <div className="text-sm text-muted-foreground">Projects</div>
          <div className="mt-2 text-2xl font-semibold">{items.length}</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-card-foreground">
          <div className="text-sm text-muted-foreground">Status</div>
          <div className="mt-2 text-sm font-medium">Ready</div>
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

      <div className="flex min-h-[60vh] flex-1 flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Recent projects</div>
          <form action={quickGenerate}>
            <button className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
              New
            </button>
          </form>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {items.length ? (
            items.map((p) => (
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
    </>
  )
}
