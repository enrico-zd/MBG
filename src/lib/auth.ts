import { type NextAuthOptions, getServerSession } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Email from "next-auth/providers/email"
import Google from "next-auth/providers/google"
import { prisma } from "@/lib/db"

const providers: NextAuthOptions["providers"] = [
  Email({
    server: process.env.EMAIL_SERVER,
    from: process.env.EMAIL_FROM,
  }),
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

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
  providers,
}

export function auth() {
  return getServerSession(authOptions)
}
