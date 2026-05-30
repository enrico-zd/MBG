import { derive9x16Jpeg } from "@/lib/images/derive9x16"
import { storageRoot, userProjectDir, writeFileToStorage } from "@/lib/storage/storage"
import { prisma } from "@/lib/db/prisma"
import crypto from "node:crypto"
import path from "node:path"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

type Params = { params: Promise<{ projectId: string }> }

function assetToJson(asset: any) {
  const sizeBytes = typeof asset.sizeBytes === "bigint" ? asset.sizeBytes.toString() : asset.sizeBytes
  return { ...asset, sizeBytes }
}

function extFromMime(mimeType: string) {
  if (mimeType === "image/jpeg") return ".jpg"
  if (mimeType === "image/png") return ".png"
  if (mimeType === "image/webp") return ".webp"
  return ""
}

export async function GET(_req: NextRequest, ctx: Params) {
  const { projectId } = await ctx.params

  const assets = await prisma.asset.findMany({
    where: { projectId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ assets: assets.map(assetToJson) })
}

export async function POST(req: NextRequest, ctx: Params) {
  const { projectId } = await ctx.params

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, userId: true } })
  if (!project) return NextResponse.json({ error: "project_not_found" }, { status: 404 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "invalid_formdata" }, { status: 400 })
  }

  const file = form.get("file")
  if (!(file instanceof File)) return NextResponse.json({ error: "missing_file" }, { status: 400 })
  if (typeof file.type !== "string" || !file.type.startsWith("image/"))
    return NextResponse.json({ error: "unsupported_mime" }, { status: 415 })

  const originalBuf = Buffer.from(await file.arrayBuffer())

  const derive = await derive9x16Jpeg(originalBuf, { outputWidth: 1080, outputHeight: 1920 })

  const assetId = crypto.randomUUID()
  const assetDirAbs = path.join(userProjectDir(project.userId, projectId), "assets", assetId)

  const preferredExt = path.extname(file.name) || extFromMime(file.type) || ".bin"
  const originalAbs = path.join(assetDirAbs, `original${preferredExt}`)
  const derivedAbs = path.join(assetDirAbs, "derived9x16.jpg")

  await writeFileToStorage(originalAbs, originalBuf)
  await writeFileToStorage(derivedAbs, derive.buffer)

  const originalRel = path.relative(storageRoot(), originalAbs)
  const derivedRel = path.relative(storageRoot(), derivedAbs)

  const asset = await prisma.asset.create({
    data: {
      id: assetId,
      userId: project.userId,
      projectId,
      originalPath: originalRel,
      derived9x16Path: derivedRel,
      mimeType: file.type,
      width: derive.inputWidth,
      height: derive.inputHeight,
      sizeBytes: BigInt(originalBuf.byteLength),
    },
  })

  return NextResponse.json({ asset: assetToJson(asset) }, { status: 201 })
}
