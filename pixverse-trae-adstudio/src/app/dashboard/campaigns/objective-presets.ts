import { ObjectivePreset } from "../../../generated/prisma/enums";

export const OBJECTIVE_PRESETS = [
  { value: ObjectivePreset.AWARENESS, label: "Awareness" },
  { value: ObjectivePreset.PRODUCT_HIGHLIGHT, label: "Product Highlight" },
  { value: ObjectivePreset.SOCIAL_PROOF, label: "Social Proof" },
  { value: ObjectivePreset.PROMO_DISCOUNT, label: "Promo/Discount" },
  { value: ObjectivePreset.LIMITED_DROP, label: "Limited Drop" },
  { value: ObjectivePreset.CONVERSION_SHOP_NOW, label: "Conversion (Shop Now)" },
  { value: ObjectivePreset.BUNDLE_OFFER, label: "Bundle Offer" },
  { value: ObjectivePreset.RETARGETING, label: "Retargeting" },
  { value: ObjectivePreset.CUSTOM, label: "Custom" },
] as const;

export const objectivePresetLabelByValue: Record<ObjectivePreset, string> =
  OBJECTIVE_PRESETS.reduce(
    (acc, preset) => ({ ...acc, [preset.value]: preset.label }),
    {} as Record<ObjectivePreset, string>,
  );

export function getObjectivePresetLabel(preset: ObjectivePreset) {
  return objectivePresetLabelByValue[preset];
}

export const objectivePresetDefaultCtaByValue: Partial<Record<ObjectivePreset, string>> = {
  [ObjectivePreset.AWARENESS]: "Learn More",
  [ObjectivePreset.PRODUCT_HIGHLIGHT]: "Shop Now",
  [ObjectivePreset.SOCIAL_PROOF]: "See Reviews",
  [ObjectivePreset.PROMO_DISCOUNT]: "Claim Offer",
  [ObjectivePreset.LIMITED_DROP]: "Shop Drop",
  [ObjectivePreset.CONVERSION_SHOP_NOW]: "Shop Now",
  [ObjectivePreset.BUNDLE_OFFER]: "Get Bundle",
  [ObjectivePreset.RETARGETING]: "Complete Purchase",
};

export function getObjectivePresetDefaultCta(preset: ObjectivePreset) {
  return objectivePresetDefaultCtaByValue[preset];
}
