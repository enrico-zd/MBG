import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 })

  const items = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  return Response.json({ items })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 })

  const body = (await req.json()) as { title?: string; notes?: string }
  const title = body.title?.trim() || `Quick — ${new Date().toISOString()}`

  const project = await prisma.project.create({
    data: { userId: session.user.id, title, notes: body.notes?.trim() || null },
  })
  return Response.json({ project })
}
