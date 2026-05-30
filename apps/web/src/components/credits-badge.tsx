"use client";

import { useEffect, useState } from "react";

export default function CreditsBadge() {
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d: { credits?: number }) => {
        if (!active) return;
        if (typeof d.credits === "number") setCredits(d.credits);
      })
      .catch(() => {
        if (!active) return;
        setCredits(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1">
      <div className="text-xs text-neutral-400">Credits</div>
      <div className="text-xs font-semibold">{credits ?? "—"}</div>
    </div>
  );
}

