import { notFound } from "next/navigation";
import { getCampaignBySlug, getVideoJob } from "@/lib/db";
import VideoPreview from "@/components/video-preview";
import LandingViewTracker from "@/components/landing-view-tracker";
import LandingCta from "@/components/landing-cta";

export const runtime = "nodejs";

export default async function PublicLandingPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) notFound();
  if (campaign.status !== "published") notFound();

  const job = campaign.videoJobId ? await getVideoJob(campaign.videoJobId) : undefined;
  const product = campaign.product;
  if (!product) notFound();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <LandingViewTracker campaignId={campaign.id} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs text-neutral-400">Campaign</div>
            <h1 className="mt-1 text-2xl font-semibold">{campaign.title}</h1>
          </div>
          <div className="text-xs text-neutral-500">{campaign.objective}</div>
        </div>

        <div className="mt-6">
          <VideoPreview videoUrl={job?.videoUrl} imageUrls={product.imageUrls} />
        </div>

        <div className="mt-6 grid gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">{product.name}</div>
              <div className="mt-1 text-sm text-neutral-300">{product.description}</div>
              <div className="mt-2 text-sm text-neutral-200">{product.price}</div>
            </div>
            {product.imageUrls[0] ? (
              <div className="h-20 w-20 overflow-hidden rounded-md border border-neutral-800 bg-neutral-950">
                <img src={product.imageUrls[0]} alt="" className="h-full w-full object-cover" />
              </div>
            ) : null}
          </div>

          <LandingCta
            campaignId={campaign.id}
            ctaText={campaign.ctaText || "Shop Now"}
            checkoutUrl={campaign.checkoutUrl || "#"}
          />

          <div className="grid gap-2">
            <div className="text-xs text-neutral-400">Chapters</div>
            <div className="grid gap-2">
              {(campaign.chapters ?? []).map((ch) => (
                <div
                  key={ch.title}
                  className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2"
                >
                  <div className="text-sm text-neutral-200">{ch.title}</div>
                  <div className="text-xs text-neutral-400">{ch.startSec}s</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-neutral-500">
          View tracking and CTA tracking are enabled for this landing.
        </div>
      </div>
    </div>
  );
}

