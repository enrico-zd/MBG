import { z } from "zod";
import { ObjectivePreset } from "../../../generated/prisma/enums";
import { objectivePresetLabelByValue } from "./objective-presets";

const createCampaignFormSchema = z
  .object({
    title: z.string().trim().min(1),
    objectivePreset: z.enum([
      ObjectivePreset.AWARENESS,
      ObjectivePreset.PRODUCT_HIGHLIGHT,
      ObjectivePreset.SOCIAL_PROOF,
      ObjectivePreset.PROMO_DISCOUNT,
      ObjectivePreset.LIMITED_DROP,
      ObjectivePreset.CONVERSION_SHOP_NOW,
      ObjectivePreset.BUNDLE_OFFER,
      ObjectivePreset.RETARGETING,
      ObjectivePreset.CUSTOM,
    ]),
    objectiveText: z.string().optional().default(""),
  })
  .transform((data, ctx) => {
    const objectiveText = data.objectiveText.trim();

    if (data.objectivePreset === ObjectivePreset.CUSTOM) {
      if (!objectiveText) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "objectiveText is required when objectivePreset is CUSTOM",
          path: ["objectiveText"],
        });
        return z.NEVER;
      }

      return { ...data, objectiveText };
    }

    return {
      ...data,
      objectiveText: objectivePresetLabelByValue[data.objectivePreset],
    };
  });

export type CreateCampaignInput = z.infer<typeof createCampaignFormSchema>;

export function parseCreateCampaignFormData(formData: FormData) {
  return createCampaignFormSchema.parse({
    title: String(formData.get("title") ?? ""),
    objectivePreset: String(formData.get("objectivePreset") ?? ""),
    objectiveText: String(formData.get("objectiveText") ?? ""),
  });
}
