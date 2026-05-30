"use client"

import { signOut } from "next-auth/react"

export function SignOutButton(props: { className?: string }) {
  return (
    <button
      type="button"
      className={props.className}
      onClick={async () => {
        await signOut({ callbackUrl: "/login" })
      }}
    >
      Sign out
    </button>
  )
}

