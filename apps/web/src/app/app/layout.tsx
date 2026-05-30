import Link from "next/link";
import type { ReactNode } from "react";
import CreditsBadge from "@/components/credits-badge";

export default function AppLayout(props: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-sm font-semibold tracking-wide">
              AdStudio MVP
            </Link>
            <Link href="/app/campaigns/new" className="text-sm text-neutral-300 hover:text-white">
              New Campaign
            </Link>
          </div>
          <CreditsBadge />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{props.children}</main>
    </div>
  );
}

