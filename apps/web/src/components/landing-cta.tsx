"use client";

import { useState } from "react";

export default function LandingCta(props: {
  campaignId: string;
  ctaText: string;
  checkoutUrl: string;
}) {
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campaignId: props.campaignId, type: "cta_click" }),
      });
    } catch {}
    window.location.href = props.checkoutUrl || "#";
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      className="w-full rounded-md bg-white px-4 py-3 text-sm font-semibold text-neutral-950 hover:bg-neutral-200 disabled:bg-neutral-700 disabled:text-neutral-300"
      disabled={busy}
    >
      {props.ctaText}
    </button>
  );
}

