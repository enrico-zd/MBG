"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth/session";
import { parseProductFormData } from "./validation";

export async function upsertProductAction(campaignId: string, formData: FormData) {
  const auth = await getAuth();
  if (!auth) redirect("/login");

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId: auth.user.id },
    select: { id: true },
  });

  if (!campaign) redirect("/dashboard/campaigns");

  const input = parseProductFormData(formData);

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.upsert({
      where: { campaignId },
      create: {
        campaignId,
        name: input.name,
        priceCents: input.priceCents,
        description: input.description,
        category: input.category,
        checkoutUrl: input.checkoutUrl,
        variantsJson: input.variants,
      },
      update: {
        name: input.name,
        priceCents: input.priceCents,
        description: input.description,
        category: input.category,
        checkoutUrl: input.checkoutUrl,
        variantsJson: input.variants,
      },
      select: { id: true },
    });

    await tx.productImage.deleteMany({ where: { productId: product.id } });

    await tx.productImage.createMany({
      data: input.imageUrlPaths.map((urlPath, index) => ({
        productId: product.id,
        urlPath,
        sortOrder: index,
      })),
    });
  });

  redirect(`/dashboard/campaigns/${campaignId}/product`);
}

