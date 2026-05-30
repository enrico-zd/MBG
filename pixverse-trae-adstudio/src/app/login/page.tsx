import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { getAuth } from "@/lib/auth/session";

export default async function LoginPage() {
  const auth = await getAuth();
  if (auth) redirect("/dashboard");

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-20 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-black">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Login
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Demo login menggunakan session cookie.
          </p>
        </div>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

