import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth/session";
import { CreateCampaignForm } from "./create-campaign-form";
import { getObjectivePresetLabel } from "./objective-presets";
import { createCampaignAction } from "./actions";

export default async function CampaignsPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");

  const campaigns = await prisma.campaign.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      objectivePreset: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Campaigns
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Buat dan kelola campaign Anda.
          </p>
        </div>
      </div>

      <CreateCampaignForm action={createCampaignAction} />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Daftar Campaign
        </h2>

        {campaigns.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Belum ada campaign.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 dark:border-zinc-800">
                <tr className="text-left text-zinc-600 dark:text-zinc-400">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Objective</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/campaigns/${campaign.id}`}
                        className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                      >
                        {campaign.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {getObjectivePresetLabel(campaign.objectivePreset)}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {campaign.createdAt.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

