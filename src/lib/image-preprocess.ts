import sharp from "sharp"

export async function cropToPortrait916(params: { bytes: Buffer }) {
  const img = sharp(params.bytes)
  const meta = await img.metadata()
  if (!meta.width || !meta.height) throw new Error("invalid_image")

  const targetRatio = 9 / 16
  const srcRatio = meta.width / meta.height

  let width = meta.width
  let height = meta.height
  if (srcRatio > targetRatio) {
    width = Math.floor(meta.height * targetRatio)
  } else if (srcRatio < targetRatio) {
    height = Math.floor(meta.width / targetRatio)
  }

  const left = Math.floor((meta.width - width) / 2)
  const top = Math.floor((meta.height - height) / 2)

  const out = await img
    .extract({ left, top, width, height })
    .resize(1080, 1920, { fit: "cover" })
    .webp({ quality: 90 })
    .toBuffer()

  return { bytes: out, width: 1080, height: 1920, mimeType: "image/webp" }
}
