"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Campaign } from "@/lib/types";

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((d: { campaigns?: Campaign[] }) => {
        if (!active) return;
        setCampaigns(Array.isArray(d.campaigns) ? d.campaigns : []);
      })
      .catch(() => {
        if (!active) return;
        setCampaigns([]);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Create → pick a pack → generate → publish → track views and CTA clicks.
          </p>
        </div>
        <Link
          href="/app/campaigns/new"
          className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-neutral-200"
        >
          New Campaign
        </Link>
      </div>

      <div className="grid gap-3">
        {campaigns === null ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-300">
            Loading…
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-300">
            No campaigns yet. Create your first campaign to start.
          </div>
        ) : (
          campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/app/campaigns/${c.id}`}
              className="group rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold group-hover:text-white">{c.title}</div>
                  <div className="mt-1 text-xs text-neutral-400">
                    {c.objective === "conversion" ? "Conversion" : "Awareness"} ·{" "}
                    {c.status === "published" ? "Published" : "Draft"}
                  </div>
                </div>
                <div className="text-xs text-neutral-500">{new Date(c.updatedAt).toLocaleString()}</div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

