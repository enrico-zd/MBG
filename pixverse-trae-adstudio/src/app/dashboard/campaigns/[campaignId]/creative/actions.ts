"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth/session";
import { parsePackConfigFormData } from "./validation";

export async function upsertPackConfigAction(campaignId: string, formData: FormData) {
  const auth = await getAuth();
  if (!auth) redirect("/login");

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId: auth.user.id },
    select: { id: true },
  });

  if (!campaign) redirect("/dashboard/campaigns");

  const input = parsePackConfigFormData(formData);

  await prisma.packConfig.upsert({
    where: { campaignId },
    create: {
      campaignId,
      packId: input.packId,
      audience: input.audience,
      tone: input.tone,
      overlayLanguage: input.overlayLanguage,
      offer: input.offer,
      ctaText: input.ctaText,
    },
    update: {
      packId: input.packId,
      audience: input.audience,
      tone: input.tone,
      overlayLanguage: input.overlayLanguage,
      offer: input.offer,
      ctaText: input.ctaText,
    },
    select: { id: true },
  });

  redirect(`/dashboard/campaigns/${campaignId}/creative`);
}
