"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setErr(null)
        setSent(false)
        const res = await signIn("email", {
          email,
          redirect: false,
          callbackUrl: "/dashboard",
        })
        if (res?.error) {
          setErr(res.error)
          return
        }
        setSent(true)
      }}
      className="mx-auto flex w-full max-w-sm flex-col gap-4 p-6"
    >
      <h1 className="text-xl font-semibold">Sign in</h1>
      <label className="text-sm">
        Email
        <input
          className="mt-2 w-full rounded-md border bg-background px-3 py-2"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      {sent ? <div className="text-sm text-muted-foreground">Check your inbox for the link.</div> : null}
      {err ? <div className="text-sm text-red-600">{err}</div> : null}
      <button
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        type="submit"
      >
        Send link
      </button>
    </form>
  )
}
