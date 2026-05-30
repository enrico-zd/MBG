import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth/session";
import { getObjectivePresetLabel } from "../objective-presets";

export default async function CampaignDetailPage({
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
      objectiveText: true,
      createdAt: true,
    },
  });

  if (!campaign) redirect("/dashboard/campaigns");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {campaign.title}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {getObjectivePresetLabel(campaign.objectivePreset)} •{" "}
            {campaign.createdAt.toLocaleString()}
          </p>
        </div>
        <Link
          href="/dashboard/campaigns"
          className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100"
        >
          Back to campaigns
        </Link>
      </div>

      <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Objective Text
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {campaign.objectiveText}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/dashboard/campaigns/${campaign.id}/product`}
          className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-black dark:text-zinc-100 dark:hover:bg-zinc-950"
        >
          Product Setup
        </Link>
        <Link
          href={`/dashboard/campaigns/${campaign.id}/creative`}
          className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-black dark:text-zinc-100 dark:hover:bg-zinc-950"
        >
          Creative
        </Link>
      </div>
    </div>
  );
}
