"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

export default function CampaignAnalyticsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const [data, setData] = useState<{ viewCount: number; ctaCount: number; ctr: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/campaigns/${id}/analytics`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { analytics?: { viewCount: number; ctaCount: number; ctr: number }; error?: string }) => {
        if (!active) return;
        if (d.analytics) setData(d.analytics);
        else setError(d.error || "failed_to_load");
      })
      .catch(() => {
        if (!active) return;
        setError("failed_to_load");
      });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="mt-1 text-sm text-neutral-400">Minimal metrics: views, CTA clicks, CTR.</p>
        </div>
        <Link
          href={`/app/campaigns/${id}`}
          className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 hover:border-neutral-500"
        >
          Back
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 text-sm text-red-400">
          {error}
        </div>
      ) : data ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="text-xs text-neutral-400">Views</div>
            <div className="mt-1 text-2xl font-semibold">{data.viewCount}</div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="text-xs text-neutral-400">CTA clicks</div>
            <div className="mt-1 text-2xl font-semibold">{data.ctaCount}</div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="text-xs text-neutral-400">CTR</div>
            <div className="mt-1 text-2xl font-semibold">{(data.ctr * 100).toFixed(1)}%</div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 text-sm text-neutral-300">
          Loading…
        </div>
      )}
    </div>
  );
}
