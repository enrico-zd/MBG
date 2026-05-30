import { describe, expect, it } from "vitest"
import { quoteCredits } from "@/lib/pricing"

describe("quoteCredits", () => {
  it("quotes 5s 540p", () => {
    expect(quoteCredits(5, "540p")).toBe(1)
  })

  it("quotes 10s 720p", () => {
    expect(quoteCredits(10, "720p")).toBe(3)
  })

  it("quotes 15s 1080p", () => {
    expect(quoteCredits(15, "1080p")).toBe(6)
  })
})
