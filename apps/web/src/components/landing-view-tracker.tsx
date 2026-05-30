"use client";

import { useEffect } from "react";

export default function LandingViewTracker(props: { campaignId: string }) {
  useEffect(() => {
    fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ campaignId: props.campaignId, type: "view" }),
    }).catch(() => {});
  }, [props.campaignId]);

  return null;
}

