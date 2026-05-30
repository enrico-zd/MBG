import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export default async function ProjectsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const items = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Projects</div>
          <div className="text-sm text-muted-foreground">{items.length} total</div>
        </div>
        <form action={quickGenerate}>
          <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
            New project
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {items.length ? (
          items.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="rounded-xl border bg-card p-4 hover:bg-muted">
              <div className="font-medium">{p.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{p.id}</div>
            </Link>
          ))
        ) : (
          <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">No projects yet.</div>
        )}
      </div>
    </div>
  )
}

