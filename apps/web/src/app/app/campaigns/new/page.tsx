"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Objective } from "@/lib/types";

export default function NewCampaignPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState<Objective>("conversion");

  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return title.trim() && productName.trim() && imageUrls.length > 0 && !isSaving;
  }, [title, productName, imageUrls.length, isSaving]);

  async function onUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setIsUploading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("files", f));
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = (await res.json()) as { urls?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error || "upload_failed");
      setImageUrls((prev) => [...prev, ...(data.urls ?? [])]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "upload_failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function onSubmit() {
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          objective,
          product: {
            name: productName,
            price,
            description,
            category,
            imageUrls,
          },
        }),
      });
      const data = (await res.json()) as { campaign?: { id: string }; error?: string };
      if (!res.ok) throw new Error(data.error || "create_failed");
      router.push(`/app/campaigns/${data.campaign?.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "create_failed");
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New Campaign</h1>
        <p className="mt-1 text-sm text-neutral-400">Provide product info, then pick objective.</p>
      </div>

      <div className="grid gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <div className="grid gap-2">
          <label className="text-xs text-neutral-400">Campaign title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            placeholder="e.g. Summer Bundle Launch"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs text-neutral-400">Objective</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setObjective("awareness")}
              className={`rounded-md px-3 py-2 text-sm ${
                objective === "awareness"
                  ? "bg-white text-neutral-950"
                  : "border border-neutral-700 bg-neutral-950 text-neutral-200 hover:border-neutral-500"
              }`}
            >
              Awareness
            </button>
            <button
              type="button"
              onClick={() => setObjective("conversion")}
              className={`rounded-md px-3 py-2 text-sm ${
                objective === "conversion"
                  ? "bg-white text-neutral-950"
                  : "border border-neutral-700 bg-neutral-950 text-neutral-200 hover:border-neutral-500"
              }`}
            >
              Conversion
            </button>
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-xs text-neutral-400">Product name</label>
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            placeholder="e.g. Ceramic Mug Set"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs text-neutral-400">Price (display)</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              placeholder="e.g. Rp 129.000"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs text-neutral-400">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              placeholder="e.g. Home & Living"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-xs text-neutral-400">Short description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[96px] w-full resize-y rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            placeholder="1–2 sentences: key benefit, material, what’s included."
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs text-neutral-400">Product images (1–3)</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            disabled={isUploading}
            onChange={(e) => void onUpload(e.target.files)}
            className="block w-full text-sm text-neutral-300 file:mr-4 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-neutral-950 hover:file:bg-neutral-200"
          />
          {imageUrls.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {imageUrls.slice(0, 3).map((u) => (
                <div key={u} className="overflow-hidden rounded-md border border-neutral-800 bg-neutral-950">
                  <img src={u} alt="" className="h-24 w-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {error ? <div className="text-sm text-red-400">{error}</div> : null}

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-neutral-500">
            {isUploading ? "Uploading…" : imageUrls.length ? `${imageUrls.length} image(s) ready` : "No images yet"}
          </div>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void onSubmit()}
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-300"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

