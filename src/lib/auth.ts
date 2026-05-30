import { type NextAuthOptions, getServerSession } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Email from "next-auth/providers/email"
import { prisma } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        ;(session.user as { id?: string }).id = user.id
      }
      return session
    },
  },
  providers: [
    Email({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
}

export function auth() {
  return getServerSession(authOptions)
}
