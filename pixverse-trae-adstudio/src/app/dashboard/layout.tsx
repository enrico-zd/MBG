import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/session";
import { logoutAction } from "./actions";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const auth = await getAuth();
  if (!auth) redirect("/login");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Dashboard
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {auth.user.email}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
              Credits: {auth.user.credits}
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-black dark:text-zinc-100 dark:hover:bg-zinc-950"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
