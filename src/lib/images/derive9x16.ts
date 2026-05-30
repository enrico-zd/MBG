import sharp from "sharp"

export type Derive9x16Options = {
  outputWidth: number
  outputHeight: number
}

export type Derive9x16Result = {
  buffer: Buffer
  inputWidth: number
  inputHeight: number
  outputWidth: number
  outputHeight: number
}

export async function derive9x16Jpeg(input: Buffer, opts: Derive9x16Options): Promise<Derive9x16Result> {
  const base = sharp(input)
  const meta = await base.metadata()

  const outW = opts.outputWidth
  const outH = opts.outputHeight

  const background = await base
    .clone()
    .resize(outW, outH, { fit: "cover" })
    .blur(30)
    .jpeg({ quality: 80 })
    .toBuffer()

  const foreground = await base
    .clone()
    .resize(outW, outH, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  const composite = await sharp(background)
    .composite([{ input: foreground, gravity: "center" }])
    .jpeg({ quality: 85 })
    .toBuffer()

  return {
    buffer: composite,
    inputWidth: meta.width ?? 0,
    inputHeight: meta.height ?? 0,
    outputWidth: outW,
    outputHeight: outH,
  }
}
