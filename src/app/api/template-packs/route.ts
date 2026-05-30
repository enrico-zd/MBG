import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json([
    { id: "ugc_promo", name: "UGC Promo", baseStyle: "UGC handheld, realistic lighting" },
    { id: "studio_minimal", name: "Studio Minimal", baseStyle: "clean studio lighting, minimal background" },
    { id: "luxury", name: "Luxury", baseStyle: "premium product cinematography, elegant mood" },
  ])
}
