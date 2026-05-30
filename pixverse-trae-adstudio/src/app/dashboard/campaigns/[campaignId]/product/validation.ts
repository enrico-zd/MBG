import { z } from "zod";

const urlSchema = z.string().url();

function parseCommaList(value: string) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function parsePriceCents(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;

  const [whole, frac = ""] = trimmed.split(".");
  const fracPadded = frac.padEnd(2, "0");
  const cents = Number(whole) * 100 + Number(fracPadded);

  return Number.isFinite(cents) ? cents : null;
}

const productFormSchema = z
  .object({
    name: z.string().trim().min(1),
    price: z.string().trim().min(1),
    description: z.string().trim().min(1),
    category: z.string().trim().min(1),
    checkoutUrl: z.string().trim().optional().default(""),
    variantColors: z.string().optional().default(""),
    variantSizes: z.string().optional().default(""),
    imageUrlPaths: z.array(z.string().trim().min(1)).min(1).max(5),
  })
  .transform((data, ctx) => {
    const priceCents = parsePriceCents(data.price);
    if (priceCents === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "price must be a number with up to 2 decimal places",
        path: ["price"],
      });
      return z.NEVER;
    }

    const checkoutUrl = data.checkoutUrl.trim();
    if (checkoutUrl && !urlSchema.safeParse(checkoutUrl).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "checkoutUrl must be a valid URL",
        path: ["checkoutUrl"],
      });
      return z.NEVER;
    }

    return {
      name: data.name,
      priceCents,
      description: data.description,
      category: data.category,
      checkoutUrl: checkoutUrl || null,
      variants: {
        colors: parseCommaList(data.variantColors ?? ""),
        sizes: parseCommaList(data.variantSizes ?? ""),
      },
      imageUrlPaths: data.imageUrlPaths,
    };
  });

export type ProductInput = z.infer<typeof productFormSchema>;

export function parseProductFormData(formData: FormData) {
  const imageUrlPaths = formData.getAll("imageUrlPaths").map((v) => String(v ?? ""));

  return productFormSchema.parse({
    name: String(formData.get("name") ?? ""),
    price: String(formData.get("price") ?? ""),
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") ?? ""),
    checkoutUrl: String(formData.get("checkoutUrl") ?? ""),
    variantColors: String(formData.get("variantColors") ?? ""),
    variantSizes: String(formData.get("variantSizes") ?? ""),
    imageUrlPaths,
  });
}

