import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { grantTrialCreditsIfNone } from "@/lib/credits"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 })

  await grantTrialCreditsIfNone(session.user.id)
  const items = await prisma.creditLedger.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  return Response.json({ items })
}
