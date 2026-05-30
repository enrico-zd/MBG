import { PrismaClient } from "@/generated/client"
import { PrismaPg } from "@prisma/adapter-pg"

type GlobalForPrisma = typeof globalThis & { prisma?: PrismaClient }

export function getPrisma() {
  const globalForPrisma = globalThis as GlobalForPrisma
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error("DATABASE_URL is not set")

  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
  return prisma
}

export const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getPrisma()
      const value = (client as any)[prop]
      return typeof value === "function" ? value.bind(client) : value
    },
  },
) as unknown as PrismaClient
