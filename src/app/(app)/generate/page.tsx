import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export default async function GeneratePage() {
  const session = await auth()
  if (!session?.user?.id) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-lg font-semibold">Generate</div>
          <div className="text-sm text-muted-foreground">Create a new project and start generating.</div>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground">
          <div className="text-sm text-muted-foreground">Sign in to start generating.</div>
          <Link className="mt-2 inline-flex underline underline-offset-4" href="/login">
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  const project = await prisma.project.create({
    data: { userId: session.user.id, title: `Quick — ${new Date().toISOString()}` },
  })

  redirect(`/projects/${project.id}`)
}
