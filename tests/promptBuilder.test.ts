import test from "node:test"
import assert from "node:assert/strict"
import { buildSegmentPrompt } from "../src/lib/prompt/promptBuilder.ts"

test("buildSegmentPrompt contains required fields", () => {
  const prompt = buildSegmentPrompt({
    pack: { id: "ugc", name: "UGC Promo", baseStyle: "UGC handheld, realistic lighting" },
    params: {
      language: "id",
      tone: "friendly",
      productName: "Serum Wajah A",
      benefits: ["Mencerahkan", "Melembapkan", "Ringan"],
      offer: "Diskon 30% minggu ini",
      cta: "Beli sekarang",
    },
    kind: "hook",
    durationSec: 15,
  })

  assert.match(prompt, /Product: Serum Wajah A/)
  assert.match(prompt, /Offer: Diskon 30%/)
  assert.match(prompt, /Duration: 15s/)
})
