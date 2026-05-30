import crypto from "crypto"
import { requireEnv } from "@/lib/env"

const BASE_URL = "https://app-api.pixverse.ai/openapi/v2"

type PixVerseResp<T> = { ErrCode?: number; ErrMsg?: string; Resp?: T }

function traceId() {
  return crypto.randomUUID()
}

async function pixverseFetch<T>(url: string, init: RequestInit) {
  const apiKey = requireEnv("PIXVERSE_API_KEY")
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      "API-KEY": apiKey,
      "Ai-trace-id": traceId(),
    },
  })
  const json = (await res.json()) as PixVerseResp<T>
  if (!json || json.ErrCode !== 0 || !json.Resp) {
    throw new Error(`pixverse_error:${json?.ErrCode ?? "unknown"}:${json?.ErrMsg ?? "unknown"}`)
  }
  return json.Resp
}

export async function pixverseUploadImage(params: { bytes: Buffer; filename: string }) {
  const form = new FormData()
  const blob = new Blob([new Uint8Array(params.bytes)])
  form.append("image", blob, params.filename)
  return pixverseFetch<{ img_id: number; img_url?: string }>(`${BASE_URL}/image/upload`, {
    method: "POST",
    body: form,
  })
}

export type PixVerseQuality = "540p" | "720p" | "1080p"

export async function pixverseGenerateImageToVideo(params: {
  imgId: number
  prompt: string
  duration: 5 | 10 | 15
  quality: PixVerseQuality
  seed?: number
}) {
  return pixverseFetch<{ video_id: number }>(`${BASE_URL}/video/img/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      img_id: params.imgId,
      prompt: params.prompt,
      model: "v6",
      duration: params.duration,
      quality: params.quality,
      seed: params.seed ?? 0,
      generate_audio_switch: false,
    }),
  })
}

export type PixVerseResult = {
  status: number
  url?: string
  outputWidth?: number
  outputHeight?: number
}

export async function pixverseGetVideoResult(videoId: number) {
  return pixverseFetch<PixVerseResult>(`${BASE_URL}/video/result/${videoId}`, {
    method: "GET",
  })
}
