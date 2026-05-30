import type { CreativePack, Objective } from "@/lib/types";

export function getRecommendedPacks(input: {
  objective: Objective;
  category: string;
}): CreativePack[] {
  const category = input.category.trim() || "General";
  const isConversion = input.objective === "conversion";

  return [
    {
      id: "minimal-studio",
      name: "Minimal Studio",
      style: "Clean product close-ups, soft lighting, premium whitespace",
      basePrompt: `A clean studio ad for a ${category} product. Focus on clarity, detail, and trust.`,
      recommendedCTA: isConversion ? "Shop Now" : "Learn More",
      targetDurationSec: 30,
      creditCost: isConversion ? 2 : 1,
    },
    {
      id: "lifestyle-urban",
      name: "Lifestyle Urban",
      style: "Fast-paced lifestyle montage, energetic, social-first framing",
      basePrompt: `A lifestyle ad for a ${category} product in an urban setting. Show usage moments and benefits.`,
      recommendedCTA: isConversion ? "Get Offer" : "See How It Works",
      targetDurationSec: 35,
      creditCost: isConversion ? 2 : 1,
    },
    {
      id: "luxury-cinematic",
      name: "Luxury Cinematic",
      style: "Cinematic lighting, slow reveals, high-end mood",
      basePrompt: `A luxury cinematic ad for a ${category} product. Emphasize craftsmanship and premium feel.`,
      recommendedCTA: isConversion ? "Claim Discount" : "Discover",
      targetDurationSec: 45,
      creditCost: 3,
    },
  ];
}

