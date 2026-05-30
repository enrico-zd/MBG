import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <div className="p-6">
        <Link className="underline" href="/login">
          Login
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <form action={quickGenerate}>
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Quick Generate
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {items.map((p) => (
          <Link key={p.id} className="rounded-lg border p-4 hover:bg-muted" href={`/projects/${p.id}`}>
            <div className="font-medium">{p.title}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
