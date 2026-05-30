import crypto from "crypto"
import fs from "fs/promises"
import path from "path"
import { requireEnv } from "@/lib/env"

function baseDir() {
  return requireEnv("LOCAL_STORAGE_DIR")
}

export async function putObject(params: { key: string; bytes: Buffer; contentType: string }) {
  const abs = path.join(process.cwd(), baseDir(), params.key)
  await fs.mkdir(path.dirname(abs), { recursive: true })
  await fs.writeFile(abs, params.bytes)
  return { key: params.key, contentType: params.contentType }
}

export async function getObject(params: { key: string }) {
  const abs = path.join(process.cwd(), baseDir(), params.key)
  const bytes = await fs.readFile(abs)
  return { bytes }
}

export function signDownloadKey(params: { key: string; expiresAtMs: number }) {
  const secret = requireEnv("SIGNED_URL_SECRET")
  const payload = `${params.key}:${params.expiresAtMs}`
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex")
  return { key: params.key, expiresAtMs: params.expiresAtMs, sig }
}

export function verifySignedKey(params: { key: string; expiresAtMs: number; sig: string }) {
  if (Date.now() > params.expiresAtMs) return false
  const secret = requireEnv("SIGNED_URL_SECRET")
  const payload = `${params.key}:${params.expiresAtMs}`
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex")
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(params.sig))
}
