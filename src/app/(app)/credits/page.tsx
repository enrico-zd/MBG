import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getCreditsBalance, grantTrialCreditsIfNone } from "@/lib/credits"

export default async function CreditsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  await grantTrialCreditsIfNone(session.user.id)
  const [balance, items] = await Promise.all([
    getCreditsBalance(session.user.id),
    prisma.creditLedger.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Credits</h1>
      <div className="rounded-lg border p-4">
        <div className="text-sm text-muted-foreground">Balance</div>
        <div className="text-2xl font-semibold">{balance}</div>
      </div>
      <div className="rounded-lg border p-4">
        <div className="font-medium">Ledger</div>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between">
              <div>{i.reason}</div>
              <div className={i.delta >= 0 ? "text-emerald-700" : "text-red-700"}>{i.delta}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
