import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth/session";
import { ProductSetupForm } from "./product-setup-form";
import { upsertProductAction } from "./actions";

export default async function ProductSetupPage({
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
      product: {
        select: {
          name: true,
          priceCents: true,
          description: true,
          category: true,
          checkoutUrl: true,
          variantsJson: true,
          images: {
            select: { urlPath: true, sortOrder: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!campaign) redirect("/dashboard/campaigns");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Product Setup
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {campaign.title}
          </p>
        </div>
        <Link
          href={`/dashboard/campaigns/${campaign.id}`}
          className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100"
        >
          Back to campaign
        </Link>
      </div>

      <ProductSetupForm
        initialProduct={campaign.product}
        action={upsertProductAction.bind(null, campaign.id)}
      />
    </div>
  );
}

