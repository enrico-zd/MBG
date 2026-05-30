import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export default async function GeneratePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const project = await prisma.project.create({
    data: { userId: session.user.id, title: `Quick — ${new Date().toISOString()}` },
  })

  redirect(`/projects/${project.id}`)
}

