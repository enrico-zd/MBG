export type MbLanguage = "id" | "en"
export type MbTone = "friendly" | "professional" | "energetic"
export type SegmentKind = "hook" | "benefit" | "offer" | "cta"

export type AdJobParams = {
  language: MbLanguage
  tone: MbTone
  productName: string
  benefits: string[]
  offer: string
  cta: string
  targetAudience?: string
}

export type TemplatePack = {
  id: string
  name: string
  baseStyle: string
}

export function buildSegmentPrompt(args: {
  pack: TemplatePack
  params: AdJobParams
  kind: SegmentKind
  durationSec: number
}) {
  const langLine = args.params.language === "id" ? "Bahasa Indonesia." : "English."
  const toneLine =
    args.params.tone === "friendly"
      ? "Tone: friendly, conversational."
      : args.params.tone === "professional"
      ? "Tone: professional, clear."
      : "Tone: energetic, upbeat."

  const benefits = args.params.benefits
    .slice(0, 3)
    .map((b) => `- ${b}`)
    .join("\n")

  const kindInstruction =
    args.kind === "hook"
      ? "Create a strong hook in the first 2 seconds. Show the product clearly."
      : args.kind === "benefit"
      ? "Explain 2–3 key benefits with clear product visuals."
      : args.kind === "offer"
      ? "Highlight the offer/promo and urgency."
      : "End with a clear call-to-action."

  const audience = args.params.targetAudience ? `Target audience: ${args.params.targetAudience}.` : ""

  return [
    `You are creating a vertical 9:16 short-form product ad video segment.`,
    langLine,
    toneLine,
    `Style: ${args.pack.baseStyle}`,
    audience,
    `Product: ${args.params.productName}`,
    `Key benefits:\n${benefits}`,
    `Offer: ${args.params.offer}`,
    `CTA: ${args.params.cta}`,
    `Duration: ${args.durationSec}s`,
    kindInstruction,
    `Avoid text overlays that are unreadable. Keep framing stable and product-centric.`,
  ]
    .filter(Boolean)
    .join("\n")
}
