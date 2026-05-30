import Link from "next/link"
import { auth } from "@/lib/auth"
import { SignOutButton } from "@/components/sign-out-button"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-lg font-semibold">Settings</div>
          <div className="text-sm text-muted-foreground">Profile & session.</div>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground">
          <div className="text-sm text-muted-foreground">Sign in to manage your profile.</div>
          <Link className="mt-2 inline-flex underline underline-offset-4" href="/login">
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  const name = session.user.name ?? "User"
  const email = session.user.email ?? "-"

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-lg font-semibold">Settings</div>
        <div className="text-sm text-muted-foreground">Profile & session</div>
      </div>

      <div className="rounded-xl border bg-card p-4 text-card-foreground">
        <div className="text-sm text-muted-foreground">Signed in as</div>
        <div className="mt-2 grid gap-1">
          <div className="text-sm font-medium">{name}</div>
          <div className="text-sm text-muted-foreground">{email}</div>
        </div>
        <div className="mt-4">
          <SignOutButton className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" />
        </div>
      </div>
    </div>
  )
}
