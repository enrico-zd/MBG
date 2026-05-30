import { describe, expect, it, vi } from "vitest"
import { signDownloadKey, verifySignedKey } from "@/lib/storage"

describe("signed download key", () => {
  it("verifies valid signature", () => {
    process.env.SIGNED_URL_SECRET = "test-secret"
    const signed = signDownloadKey({ key: "a/b/c", expiresAtMs: Date.now() + 60_000 })
    expect(verifySignedKey(signed)).toBe(true)
  })

  it("rejects expired signature", () => {
    process.env.SIGNED_URL_SECRET = "test-secret"
    const now = Date.now()
    vi.spyOn(Date, "now").mockReturnValue(now)
    const signed = signDownloadKey({ key: "a/b/c", expiresAtMs: now + 10 })
    vi.spyOn(Date, "now").mockReturnValue(now + 20)
    expect(verifySignedKey(signed)).toBe(false)
  })
})
