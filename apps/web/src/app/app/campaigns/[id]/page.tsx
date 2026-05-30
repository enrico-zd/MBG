"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Campaign, VideoJob } from "@/lib/types";
import { getRecommendedPacks } from "@/lib/packs";
import VideoPreview from "@/components/video-preview";

export default function CampaignDetailPage(props: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(props.params);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [job, setJob] = useState<VideoJob | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  const [videoUrl, setVideoUrl] = useState("");
  const [language, setLanguage] = useState("id");
  const [tone, setTone] = useState("percaya diri, ringkas");
  const [promo, setPromo] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const packs = useMemo(() => {
    if (!campaign) return [];
    return getRecommendedPacks({
      objective: campaign.objective,
      category: campaign.product?.category ?? "General",
    });
  }, [campaign]);

  useEffect(() => {
    let active = true;
    fetch(`/api/campaigns/${id}`)
      .then((r) => r.json())
      .then((d: { campaign?: Campaign }) => {
        if (!active) return;
        if (d.campaign) {
          setCampaign(d.campaign);
          setLanguage(d.campaign.packCustomize?.language ?? "id");
          setTone(d.campaign.packCustomize?.tone ?? "percaya diri, ringkas");
          setPromo(d.campaign.packCustomize?.promo ?? "");
          setCtaText(d.campaign.ctaText ?? "");
          setCheckoutUrl(d.campaign.checkoutUrl ?? "");
        }
      })
      .catch(() => {
        if (!active) return;
        setError("failed_to_load_campaign");
      });

    fetch("/api/credits")
      .then((r) => r.json())
      .then((d: { credits?: number }) => {
        if (!active) return;
        if (typeof d.credits === "number") setCredits(d.credits);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!campaign?.videoJobId) return;
    let active = true;
    const tick = async () => {
      try {
        const res = await fetch(`/api/campaigns/${id}/generate`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { job?: VideoJob };
        if (!active) return;
        if (data.job) setJob(data.job);
        if (data.job?.status === "done" || data.job?.status === "failed") return;
      } catch {}
    };

    void tick();
    const t = setInterval(() => void tick(), 1200);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [campaign?.videoJobId, id]);

  async function patchCampaign(patch: Partial<Campaign>) {
    const res = await fetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = (await res.json()) as { campaign?: Campaign; error?: string };
    if (!res.ok) throw new Error(data.error || "update_failed");
    if (data.campaign) setCampaign(data.campaign);
  }

  async function selectPack(packId: Campaign["selectedPackId"]) {
    setError(null);
    setIsSaving(true);
    try {
      await patchCampaign({ selectedPackId: packId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "update_failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveCustomize() {
    setError(null);
    setIsSaving(true);
    try {
      await patchCampaign({
        packCustomize: { language, tone, promo },
        ctaText,
        checkoutUrl,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "update_failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function generate() {
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ videoUrl: videoUrl.trim() || undefined }),
      });
      const data = (await res.json()) as { job?: VideoJob; credits?: number; error?: string };
      if (!res.ok) throw new Error(data.error || "generate_failed");
      if (data.job) setJob(data.job);
      if (typeof data.credits === "number") setCredits(data.credits);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "generate_failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function publish() {
    setError(null);
    setPublishing(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ctaText, checkoutUrl }),
      });
      const data = (await res.json()) as { campaign?: Campaign; error?: string };
      if (!res.ok) throw new Error(data.error || "publish_failed");
      if (data.campaign) setCampaign(data.campaign);
    } catch (e) {
      setError(e instanceof Error ? e.message : "publish_failed");
    } finally {
      setPublishing(false);
    }
  }

  if (!campaign) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-300">
        Loading campaign…
      </div>
    );
  }

  const product = campaign.product;
  const selectedPack = packs.find((p) => p.id === campaign.selectedPackId) ?? packs[0];
  const publicPath = campaign.slug ? `/c/${campaign.slug}` : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{campaign.title}</h1>
          <div className="mt-1 text-sm text-neutral-400">
            {campaign.objective === "conversion" ? "Conversion" : "Awareness"} ·{" "}
            {campaign.status === "published" ? "Published" : "Draft"} · Credits: {credits ?? "—"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/app/campaigns/${campaign.id}/analytics`}
            className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 hover:border-neutral-500"
          >
            Analytics
          </Link>
          <button
            type="button"
            disabled={publishing}
            onClick={() => void publish()}
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-neutral-950 disabled:bg-neutral-700 disabled:text-neutral-300"
          >
            Publish
          </button>
        </div>
      </div>

      {publicPath ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="text-sm text-neutral-300">Public landing</div>
          <Link href={publicPath} className="text-sm font-semibold text-white underline">
            {publicPath}
          </Link>
        </div>
      ) : null}

      {product ? (
        <div className="grid gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-semibold">Product</div>
            <div className="text-sm text-neutral-200">{product.name}</div>
            <div className="text-sm text-neutral-400">{product.price}</div>
            <div className="text-sm text-neutral-400">{product.category}</div>
            <div className="text-sm text-neutral-300">{product.description}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {product.imageUrls.slice(0, 3).map((u) => (
              <div key={u} className="overflow-hidden rounded-md border border-neutral-800 bg-neutral-950">
                <img src={u} alt="" className="h-24 w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 text-sm text-neutral-300">
          No product attached to this campaign.
        </div>
      )}

      <div className="grid gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Recommended packs</div>
            <div className="mt-1 text-sm text-neutral-400">Pick one to shape prompt, CTA, and credit cost.</div>
          </div>
          <div className="text-xs text-neutral-500">{isSaving ? "Saving…" : null}</div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {packs.map((p) => {
            const active = p.id === selectedPack.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => void selectPack(p.id)}
                className={`rounded-lg border p-4 text-left ${
                  active
                    ? "border-white bg-neutral-950"
                    : "border-neutral-800 bg-neutral-950 hover:border-neutral-500"
                }`}
              >
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="mt-1 text-xs text-neutral-400">{p.style}</div>
                <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
                  <div>{p.targetDurationSec}s</div>
                  <div>{p.creditCost} credit</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <div>
          <div className="text-sm font-semibold">Customize</div>
          <div className="mt-1 text-sm text-neutral-400">
            This stays with the campaign and is used as input for generation prompts.
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <label className="text-xs text-neutral-400">Language</label>
            <input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              placeholder="id"
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <label className="text-xs text-neutral-400">Tone</label>
            <input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              placeholder="percaya diri, ringkas"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <label className="text-xs text-neutral-400">Promo (optional)</label>
          <input
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
            className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            placeholder="e.g. Diskon 20% weekend ini"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs text-neutral-400">CTA text</label>
            <input
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              placeholder={selectedPack.recommendedCTA}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs text-neutral-400">Checkout URL</label>
            <input
              value={checkoutUrl}
              onChange={(e) => setCheckoutUrl(e.target.value)}
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              placeholder="https://example.com/checkout"
            />
          </div>
        </div>
        <div className="flex items-center justify-end">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void saveCustomize()}
            className="rounded-md border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-neutral-200 hover:border-neutral-500 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Video generation</div>
            <div className="mt-1 text-sm text-neutral-400">
              Paste your PixVerse output URL (optional). The job simulates queued → generating → done.
            </div>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void generate()}
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-neutral-950 disabled:bg-neutral-700 disabled:text-neutral-300"
          >
            Generate ({selectedPack.creditCost} credit)
          </button>
        </div>

        <div className="grid gap-2">
          <label className="text-xs text-neutral-400">Video URL</label>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            placeholder="https://.../video.mp4"
          />
        </div>

        {job ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">Job</div>
              <div className="text-xs text-neutral-400">{job.status.toUpperCase()}</div>
            </div>
            <div className="mt-3">
              <VideoPreview videoUrl={job.videoUrl} imageUrls={product?.imageUrls ?? []} />
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
            <VideoPreview videoUrl={undefined} imageUrls={product?.imageUrls ?? []} />
          </div>
        )}
      </div>

      <div className="grid gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <div className="text-sm font-semibold">Chapters</div>
        <div className="grid gap-2">
          {(campaign.chapters ?? []).map((ch) => (
            <div key={ch.title} className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2">
              <div className="text-sm text-neutral-200">{ch.title}</div>
              <div className="text-xs text-neutral-400">{ch.startSec}s</div>
            </div>
          ))}
        </div>
      </div>

      {error ? <div className="text-sm text-red-400">{error}</div> : null}
    </div>
  );
}
