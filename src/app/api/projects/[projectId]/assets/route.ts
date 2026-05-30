import crypto from "crypto"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { cropToPortrait916 } from "@/lib/image-preprocess"
import { putObject } from "@/lib/storage"

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 })

  const { projectId } = await ctx.params
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })
  if (!project) return Response.json({ error: "not_found" }, { status: 404 })

  const form = await req.formData()
  const file = form.get("file")
  if (!(file instanceof File)) return Response.json({ error: "invalid_file" }, { status: 400 })
  if (file.size > 10 * 1024 * 1024) return Response.json({ error: "file_too_large" }, { status: 400 })

  const bytes = Buffer.from(await file.arrayBuffer())
  const cropped = await cropToPortrait916({ bytes })
  const key = `assets/${session.user.id}/${projectId}/${crypto.randomUUID()}.webp`
  await putObject({ key, bytes: cropped.bytes, contentType: cropped.mimeType })

  const asset = await prisma.asset.create({
    data: {
      userId: session.user.id,
      projectId,
      url: key,
      mimeType: cropped.mimeType,
      width: cropped.width,
      height: cropped.height,
      sizeBytes: cropped.bytes.length,
    },
  })

  return Response.json({ asset })
}
