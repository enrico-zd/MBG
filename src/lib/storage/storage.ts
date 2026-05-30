import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

export function storageRoot() {
  return process.env.STORAGE_ROOT ?? path.join(process.cwd(), "storage")
}

export async function ensureDir(dirPath: string) {
  await mkdir(dirPath, { recursive: true })
}

export async function writeFileToStorage(filePath: string, data: Buffer) {
  const dir = path.dirname(filePath)
  await ensureDir(dir)
  await writeFile(filePath, data)
}

export function userProjectDir(userId: string, projectId: string) {
  return path.join(storageRoot(), "private", "users", userId, "projects", projectId)
}
