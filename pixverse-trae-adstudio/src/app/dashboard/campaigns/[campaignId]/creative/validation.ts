import { z } from "zod";

const packConfigFormSchema = z
  .object({
    packId: z.string().trim().min(1),
    audience: z.string().trim().min(1),
    tone: z.string().trim().min(1),
    overlayLanguage: z.string().trim().min(1),
    offer: z.string().trim().optional().default(""),
    ctaText: z.string().trim().min(1),
  })
  .transform((data) => ({
    packId: data.packId,
    audience: data.audience,
    tone: data.tone,
    overlayLanguage: data.overlayLanguage,
    offer: data.offer.trim(),
    ctaText: data.ctaText,
  }));

export type PackConfigInput = z.infer<typeof packConfigFormSchema>;

export function parsePackConfigFormData(formData: FormData) {
  return packConfigFormSchema.parse({
    packId: String(formData.get("packId") ?? ""),
    audience: String(formData.get("audience") ?? ""),
    tone: String(formData.get("tone") ?? ""),
    overlayLanguage: String(formData.get("overlayLanguage") ?? ""),
    offer: String(formData.get("offer") ?? ""),
    ctaText: String(formData.get("ctaText") ?? ""),
  });
}
