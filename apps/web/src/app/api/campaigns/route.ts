import { NextResponse } from "next/server";
import { createCampaign, listCampaigns } from "@/lib/db";
import type { Objective } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const campaigns = await listCampaigns();
  return NextResponse.json({ campaigns });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    title?: string;
    objective?: Objective;
    product?: {
      name?: string;
      price?: string;
      description?: string;
      category?: string;
      imageUrls?: string[];
    };
  };

  const title = body.title?.trim();
  const objective = body.objective;

  if (!title) return NextResponse.json({ error: "title_required" }, { status: 400 });
  if (objective !== "awareness" && objective !== "conversion") {
    return NextResponse.json({ error: "objective_invalid" }, { status: 400 });
  }

  const productInput = body.product
    ? {
        name: body.product.name?.trim() ?? "",
        price: body.product.price?.trim() ?? "",
        description: body.product.description?.trim() ?? "",
        category: body.product.category?.trim() ?? "",
        imageUrls: Array.isArray(body.product.imageUrls) ? body.product.imageUrls : [],
      }
    : undefined;

  const product =
    productInput && productInput.name
      ? {
          ...productInput,
          imageUrls: productInput.imageUrls.filter((u) => typeof u === "string" && u),
        }
      : undefined;

  const campaign = await createCampaign({ title, objective, product });
  return NextResponse.json({ campaign }, { status: 201 });
}

