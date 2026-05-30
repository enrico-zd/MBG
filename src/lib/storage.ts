import crypto from "crypto"
import fs from "fs/promises"
import path from "path"
import { requireEnv } from "@/lib/env"

function baseDir() {
  return requireEnv("LOCAL_STORAGE_DIR")
}

function getSupabaseRest() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const bucket = process.env.SUPABASE_STORAGE_BUCKET
  if (!url || !key || !bucket) return null
  return { url, key, bucket }
}

function encodeObjectKey(key: string) {
  return key
    .split("/")
    .filter((p) => p.length)
    .map((p) => encodeURIComponent(p))
    .join("/")
}

export async function putObject(params: { key: string; bytes: Buffer; contentType: string }) {
  const supabase = getSupabaseRest()
  if (supabase) {
    const form = new FormData()
    const blob = new Blob([new Uint8Array(params.bytes)], { type: params.contentType })
    form.append("file", blob, "file")

    const res = await fetch(
      `${supabase.url}/storage/v1/object/${supabase.bucket}/${encodeObjectKey(params.key)}`,
      {
        method: "POST",
        headers: {
          apikey: supabase.key,
          Authorization: `Bearer ${supabase.key}`,
          "x-upsert": "false",
        },
        body: form,
      }
    )

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`supabase_storage_upload_failed:${res.status}:${text || res.statusText}`)
    }

    return { key: params.key, contentType: params.contentType }
  }

  const abs = path.join(process.cwd(), baseDir(), params.key)
  await fs.mkdir(path.dirname(abs), { recursive: true })
  await fs.writeFile(abs, params.bytes)
  return { key: params.key, contentType: params.contentType }
}

export async function getObject(params: { key: string }) {
  const supabase = getSupabaseRest()
  if (supabase) {
    const res = await fetch(
      `${supabase.url}/storage/v1/object/${supabase.bucket}/${encodeObjectKey(params.key)}`,
      {
        method: "GET",
        headers: {
          apikey: supabase.key,
          Authorization: `Bearer ${supabase.key}`,
        },
      }
    )

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`supabase_storage_download_failed:${res.status}:${text || res.statusText}`)
    }

    const ab = await res.arrayBuffer()
    return { bytes: Buffer.from(ab) }
  }

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
