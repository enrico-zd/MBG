import { auth } from "@/lib/auth"
import { getCreditsBalance, grantTrialCreditsIfNone } from "@/lib/credits"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 })

  await grantTrialCreditsIfNone(session.user.id)
  const balance = await getCreditsBalance(session.user.id)
  return Response.json({ balance })
}
