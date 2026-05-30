"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@pixverse.local");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="w-full max-w-sm space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email }),
          }).catch(() => null);

          if (!res?.ok) {
            setError("Login gagal.");
            return;
          }

          router.replace("/dashboard");
          router.refresh();
        });
      }}
    >
      <div className="space-y-1">
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Email
        </label>
        <input
          className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-zinc-100"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="demo@pixverse.local"
          autoComplete="email"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
      >
        {isPending ? "Memproses..." : "Login"}
      </button>
    </form>
  );
}

