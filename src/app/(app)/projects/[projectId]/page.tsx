import crypto from "crypto"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { cropToPortrait916 } from "@/lib/image-preprocess"
import { putObject } from "@/lib/storage"
import { GeneratePanel } from "./GeneratePanel"

export default async function ProjectPage(props: { params: Promise<{ projectId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { projectId } = await props.params

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true, title: true },
  })
  if (!project) redirect("/dashboard")

  async function upload(formData: FormData) {
    "use server"
    const s = await auth()
    if (!s?.user?.id) redirect("/login")

    const file = formData.get("file")
    if (!(file instanceof File)) return
    if (file.size > 10 * 1024 * 1024) return

    const bytes = Buffer.from(await file.arrayBuffer())
    const cropped = await cropToPortrait916({ bytes })
    const key = `assets/${s.user.id}/${projectId}/${crypto.randomUUID()}.webp`
    await putObject({ key, bytes: cropped.bytes, contentType: cropped.mimeType })

    await prisma.asset.create({
      data: {
        userId: s.user.id,
        projectId,
        url: key,
        mimeType: cropped.mimeType,
        width: cropped.width,
        height: cropped.height,
        sizeBytes: cropped.bytes.length,
      },
    })

    redirect(`/projects/${projectId}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{project.title}</h1>

      <form action={upload} className="rounded-lg border p-4">
        <div className="flex flex-col gap-3">
          <div className="font-medium">Upload image (auto-crop 9:16)</div>
          <input name="file" type="file" accept="image/*" required />
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Upload
          </button>
        </div>
      </form>

      <GeneratePanel projectId={projectId} />
    </div>
  )
}
