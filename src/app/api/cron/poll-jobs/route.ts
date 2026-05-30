import { pollJobsTick } from "@/lib/poll-jobs"

function isAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get("authorization") ?? ""
  if (auth === `Bearer ${secret}`) return true
  const url = new URL(req.url)
  if (url.searchParams.get("secret") === secret) return true
  return false
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 })
  const result = await pollJobsTick()
  return Response.json({ ok: true, ...result })
}

