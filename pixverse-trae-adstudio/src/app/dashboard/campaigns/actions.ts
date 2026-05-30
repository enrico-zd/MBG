"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth/session";
import { parseCreateCampaignFormData } from "./validation";

export async function createCampaignAction(formData: FormData) {
  const auth = await getAuth();
  if (!auth) redirect("/login");

  const input = parseCreateCampaignFormData(formData);

  const campaign = await prisma.campaign.create({
    data: {
      userId: auth.user.id,
      title: input.title,
      objectivePreset: input.objectivePreset,
      objectiveText: input.objectiveText,
    },
    select: { id: true },
  });

  redirect(`/dashboard/campaigns/${campaign.id}`);
}

