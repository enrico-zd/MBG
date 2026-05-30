import type { Campaign, CreativePack, Product } from "@/lib/types";

function cap(input: string, max: number) {
  if (input.length <= max) return input;
  return input.slice(0, Math.max(0, max - 1)) + "…";
}

export function buildPixversePrompt(input: {
  campaign: Campaign;
  product: Product;
  pack: CreativePack;
}) {
  const customize = input.campaign.packCustomize;
  const cta = input.campaign.ctaText?.trim() || input.pack.recommendedCTA;
  const checkout = input.campaign.checkoutUrl?.trim() || "";

  const lines = [
    input.pack.basePrompt,
    "",
    `Objective: ${input.campaign.objective}`,
    `Product: ${input.product.name}`,
    input.product.category ? `Category: ${input.product.category}` : null,
    input.product.description ? `Description: ${input.product.description}` : null,
    customize?.language ? `Language: ${customize.language}` : null,
    customize?.tone ? `Tone: ${customize.tone}` : null,
    customize?.promo ? `Promo: ${customize.promo}` : null,
    `CTA: ${cta}`,
    checkout ? `Checkout URL: ${checkout}` : null,
    "Output: a product ad video with clear hook, benefits, and CTA.",
  ].filter((x): x is string => Boolean(x));

  return cap(lines.join("\n"), 1800);
}

