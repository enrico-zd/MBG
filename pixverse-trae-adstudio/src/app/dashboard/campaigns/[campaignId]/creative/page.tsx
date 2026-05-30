import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth/session";
import { getObjectivePresetDefaultCta } from "../../objective-presets";
import { CreativeSetupForm } from "./creative-setup-form";
import { upsertPackConfigAction } from "./actions";

export default async function CreativeSetupPage({
  params,
}: {
  params: { campaignId: string };
}) {
  const auth = await getAuth();
  if (!auth) redirect("/login");

  const { campaignId } = params;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId: auth.user.id },
    select: {
      id: true,
      title: true,
      objectivePreset: true,
      packConfig: {
        select: {
          packId: true,
          audience: true,
          tone: true,
          overlayLanguage: true,
          offer: true,
          ctaText: true,
        },
      },
    },
  });

  if (!campaign) redirect("/dashboard/campaigns");

  const packs = await prisma.creativePack.findMany({
    orderBy: { slug: "asc" },
    take: 3,
    select: {
      id: true,
      name: true,
      packStyle: true,
      defaultTone: true,
      defaultCta: true,
      targetDurationSec: true,
      estimatedCreditCost: true,
    },
  });

  const fallbackPack = packs[0];
  if (!fallbackPack) redirect(`/dashboard/campaigns/${campaignId}`);

  const selectedPackId =
    campaign.packConfig && packs.some((p) => p.id === campaign.packConfig?.packId)
      ? campaign.packConfig.packId
      : fallbackPack.id;

  const selectedPack = packs.find((p) => p.id === selectedPackId) ?? fallbackPack;
  const defaultCta = getObjectivePresetDefaultCta(campaign.objectivePreset) ?? selectedPack.defaultCta;

  const initialConfig = {
    packId: selectedPackId,
    audience: campaign.packConfig?.audience ?? "General",
    tone: campaign.packConfig?.tone ?? selectedPack.defaultTone,
    overlayLanguage: campaign.packConfig?.overlayLanguage ?? "English",
    offer: campaign.packConfig?.offer ?? "",
    ctaText: campaign.packConfig?.ctaText ?? defaultCta,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Creative
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{campaign.title}</p>
        </div>
        <Link
          href={`/dashboard/campaigns/${campaign.id}`}
          className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100"
        >
          Back to campaign
        </Link>
      </div>

      <CreativeSetupForm
        packs={packs}
        objectivePreset={campaign.objectivePreset}
        initialConfig={initialConfig}
        action={upsertPackConfigAction.bind(null, campaign.id)}
      />
    </div>
  );
}

