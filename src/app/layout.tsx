import type { Metadata } from "next"
import Link from "next/link"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "AI Video Ads Generator",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between p-4">
            <Link href="/dashboard" className="font-semibold">
              AI Video Ads
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/credits">Credits</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl p-4">{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
