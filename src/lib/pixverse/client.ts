import { randomUUID } from "node:crypto"
import type { PixverseAccountBalanceResp, PixverseEnvelope } from "./types.ts"

export type PixverseClient = {
  getAccountBalance(): Promise<PixverseAccountBalanceResp>
}

export type PixverseClientConfig = {
  apiKey: string
  baseUrl?: string
  fetch?: typeof fetch
}

export class PixverseApiError extends Error {
  readonly code: number

  constructor(code: number, message: string) {
    super(message)
    this.name = "PixverseApiError"
    this.code = code
  }
}

function defaultBaseUrl() {
  return "https://app-api.pixverse.ai/openapi/v2"
}

function normalizeHeaders(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {}
  if (headers instanceof Headers) return Object.fromEntries(headers.entries())
  if (Array.isArray(headers)) return Object.fromEntries(headers)
  return headers
}

export function createPixverseClient(cfg: PixverseClientConfig): PixverseClient {
  const baseUrl = cfg.baseUrl ?? defaultBaseUrl()
  const fetchImpl = cfg.fetch ?? fetch

  async function requestJson<TResp>(path: string, init: RequestInit): Promise<TResp> {
    const url = `${baseUrl}${path}`
    const headers = normalizeHeaders(init.headers)
    headers["API-KEY"] = cfg.apiKey
    headers["ai-trace-id"] = randomUUID()

    const res = await fetchImpl(url, { ...init, headers })
    const json = (await res.json()) as PixverseEnvelope<TResp>
    if (json.ErrCode !== 0) throw new PixverseApiError(json.ErrCode, json.ErrMsg)
    return json.Resp
  }

  return {
    async getAccountBalance() {
      return requestJson<PixverseAccountBalanceResp>("/account/balance", { method: "GET" })
    },
  }
}
