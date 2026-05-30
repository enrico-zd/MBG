# PixVerse Credits v6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan client PixVerse untuk mengambil saldo credits akun dan menyediakan helper breakdown `{ monthly, package, total, accountId }` beserta test.

**Architecture:** `client.ts` membungkus `fetch` untuk call PixVerse OpenAPI v2, meng-handle envelope `{ ErrCode, ErrMsg, Resp }`, dan selalu mengirim header `API-KEY` + `ai-trace-id` (UUID baru per request). `credits.ts` memetakan response balance menjadi breakdown yang dipakai aplikasi. Test mem-mock `fetch` agar tidak memanggil jaringan.

**Tech Stack:** TypeScript, Node.js built-in `fetch`, Node test runner (`node:test`)

---

### Task 1: Tambah tipe PixVerse

**Files:**
- Create: `/workspace/src/lib/pixverse/types.ts`

- [ ] **Step 1: Tulis tipe envelope dan payload balance**

```ts
export type PixverseEnvelope<TResp> = {
  ErrCode: number
  ErrMsg: string
  Resp: TResp
}

export type PixverseAccountBalanceResp = {
  account_id: number
  credit_monthly: number
  credit_package: number
}
```

### Task 2: Tambah client PixVerse (OpenAPI v2)

**Files:**
- Create: `/workspace/src/lib/pixverse/client.ts`

- [ ] **Step 1: Implement createPixverseClient + error**

```ts
export type PixverseClient = {
  getAccountBalance(): Promise<PixverseAccountBalanceResp>
}
```

- [ ] **Step 2: Header**

```ts
{
  "API-KEY": apiKey,
  "ai-trace-id": randomUUID()
}
```

### Task 3: Tambah helper credits breakdown

**Files:**
- Create: `/workspace/src/lib/pixverse/credits.ts`

- [ ] **Step 1: Implement getPixverseCredits**

```ts
export type PixverseCreditsBreakdown = {
  accountId: number
  monthly: number
  package: number
  total: number
}
```

### Task 4: Tambah test

**Files:**
- Create: `/workspace/tests/pixverseCredits.test.ts`

- [ ] **Step 1: Mock fetch dan verifikasi mapping + header**

```ts
assert.match(String(headers["ai-trace-id"]), /^[0-9a-f-]{36}$/i)
```

- [ ] **Step 2: Tambah test error bila ErrCode != 0**

### Task 5: Jalankan test

- [ ] **Step 1: Run**

Run: `npm test`
Expected: PASS

