import { prisma } from "@/lib/db"

export async function GET() {
  const items = await prisma.templatePack.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })
  return Response.json({ items })
}
