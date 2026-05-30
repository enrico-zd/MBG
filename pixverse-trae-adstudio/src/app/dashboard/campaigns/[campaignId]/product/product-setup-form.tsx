"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ProductSetupFormProps = {
  initialProduct: {
    name: string;
    priceCents: number;
    description: string;
    category: string;
    checkoutUrl: string | null;
    variantsJson: unknown;
    images: { urlPath: string; sortOrder: number }[];
  } | null;
  action: (formData: FormData) => void | Promise<void>;
};

function parseVariants(variantsJson: unknown) {
  const colors =
    typeof variantsJson === "object" &&
    variantsJson !== null &&
    "colors" in variantsJson &&
    Array.isArray((variantsJson as { colors?: unknown }).colors)
      ? ((variantsJson as { colors: unknown[] }).colors
          .filter((v) => typeof v === "string")
          .map((v) => v.trim())
          .filter(Boolean) as string[])
      : [];

  const sizes =
    typeof variantsJson === "object" &&
    variantsJson !== null &&
    "sizes" in variantsJson &&
    Array.isArray((variantsJson as { sizes?: unknown }).sizes)
      ? ((variantsJson as { sizes: unknown[] }).sizes
          .filter((v) => typeof v === "string")
          .map((v) => v.trim())
          .filter(Boolean) as string[])
      : [];

  return { colors, sizes };
}

export function ProductSetupForm({ initialProduct, action }: ProductSetupFormProps) {
  const initialVariants = useMemo(
    () => parseVariants(initialProduct?.variantsJson ?? null),
    [initialProduct?.variantsJson],
  );

  const [name, setName] = useState(initialProduct?.name ?? "");
  const [price, setPrice] = useState(
    initialProduct ? String((initialProduct.priceCents / 100).toFixed(2)) : "",
  );
  const [description, setDescription] = useState(initialProduct?.description ?? "");
  const [category, setCategory] = useState(initialProduct?.category ?? "");
  const [checkoutUrl, setCheckoutUrl] = useState(initialProduct?.checkoutUrl ?? "");
  const [variantColors, setVariantColors] = useState(initialVariants.colors.join(", "));
  const [variantSizes, setVariantSizes] = useState(initialVariants.sizes.join(", "));
  const [imageUrlPaths, setImageUrlPaths] = useState<string[]>(
    () =>
      initialProduct?.images
        ?.slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((img) => img.urlPath) ?? [],
  );

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadImages(files: File[]) {
    if (files.length === 0) return;

    if (imageUrlPaths.length + files.length > 5) {
      setError("Maksimal 5 gambar.");
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Ukuran gambar maksimal 5MB.");
        return;
      }
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("images", file);
      }

      const res = await fetch("/api/uploads/product-images", { method: "POST", body: formData });
      const json = (await res.json().catch(() => null)) as
        | { ok: true; urlPaths: string[] }
        | { ok: false; error?: string }
        | null;

      if (!res.ok || !json || json.ok !== true) {
        setError(
          json && json.ok === false && typeof json.error === "string"
            ? json.error
            : "Gagal upload gambar.",
        );
        return;
      }

      setImageUrlPaths((prev) => [...prev, ...json.urlPaths].slice(0, 5));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detail Produk</CardTitle>
      </CardHeader>
      <form action={action}>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama produk"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-price">Price</Label>
              <Input
                id="product-price"
                name="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Contoh: 199.00"
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-category">Category</Label>
            <Input
              id="product-category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Contoh: Skincare"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-description">Description</Label>
            <Textarea
              id="product-description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat produk"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-checkout-url">Checkout URL (opsional)</Label>
            <Input
              id="product-checkout-url"
              name="checkoutUrl"
              value={checkoutUrl}
              onChange={(e) => setCheckoutUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="variant-colors">Variants - Colors</Label>
              <Input
                id="variant-colors"
                name="variantColors"
                value={variantColors}
                onChange={(e) => setVariantColors(e.target.value)}
                placeholder="Contoh: Red, Blue, Black"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variant-sizes">Variants - Sizes</Label>
              <Input
                id="variant-sizes"
                name="variantSizes"
                value={variantSizes}
                onChange={(e) => setVariantSizes(e.target.value)}
                placeholder="Contoh: S, M, L"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-images">Images (1-5)</Label>
            <Input
              id="product-images"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(e) => uploadImages(Array.from(e.target.files ?? []))}
              disabled={uploading || imageUrlPaths.length >= 5}
            />
            {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
            {imageUrlPaths.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Tambahkan minimal 1 gambar.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {imageUrlPaths.map((urlPath) => (
                  <div
                    key={urlPath}
                    className="space-y-2 rounded-md border border-zinc-200 p-2 dark:border-zinc-800"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded">
                      <Image src={urlPath} alt="" fill className="object-cover" />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={() =>
                        setImageUrlPaths((prev) => prev.filter((p) => p !== urlPath))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {imageUrlPaths.map((urlPath) => (
            <input key={urlPath} type="hidden" name="imageUrlPaths" value={urlPath} />
          ))}
        </CardContent>
        <CardFooter className="justify-end gap-3">
          <Button type="submit" disabled={uploading || imageUrlPaths.length === 0}>
            Save
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
