import assert from "node:assert/strict"
import test from "node:test"
import { getPixverseCredits } from "../src/lib/pixverse/credits.ts"

test("getPixverseCredits returns breakdown and includes required headers", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = []

  const credits = await getPixverseCredits({
    apiKey: "test-api-key",
    baseUrl: "https://app-api.pixverse.ai/openapi/v2",
    fetch: async (url, init) => {
      calls.push({ url: String(url), init })
      const headers = new Headers(init?.headers)
      assert.equal(headers.get("API-KEY"), "test-api-key")
      assert.match(String(headers.get("ai-trace-id")), /^[0-9a-f-]{36}$/i)

      return new Response(
        JSON.stringify({
          ErrCode: 0,
          ErrMsg: "success",
          Resp: { account_id: 123, credit_monthly: 10, credit_package: 20 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    },
  })

  assert.deepEqual(credits, { accountId: 123, monthly: 10, package: 20, total: 30 })
  assert.equal(calls.length, 1)
  assert.equal(calls[0]?.url, "https://app-api.pixverse.ai/openapi/v2/account/balance")
})

test("getPixverseCredits throws when PixVerse ErrCode is non-zero", async () => {
  await assert.rejects(
    () =>
      getPixverseCredits({
        apiKey: "test-api-key",
        fetch: async () =>
          new Response(
            JSON.stringify({
              ErrCode: 1234,
              ErrMsg: "nope",
              Resp: {},
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
      }),
    { name: "PixverseApiError" },
  )
})

