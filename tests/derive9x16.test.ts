import assert from "node:assert/strict"
import test from "node:test"
import sharp from "sharp"
import { derive9x16Jpeg } from "../src/lib/images/derive9x16.ts"

test("derive9x16Jpeg outputs requested dimensions", async () => {
  const input = await sharp({
    create: { width: 800, height: 800, channels: 3, background: { r: 255, g: 0, b: 0 } },
  })
    .jpeg()
    .toBuffer()

  const out = await derive9x16Jpeg(input, { outputWidth: 720, outputHeight: 1280 })
  const meta = await sharp(out.buffer).metadata()
  assert.equal(meta.width, 720)
  assert.equal(meta.height, 1280)
})
