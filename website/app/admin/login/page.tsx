"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ADMIN_TOKEN_STORAGE_KEY,
  adminLogin,
} from "../../../lib/admin-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    if (token) {
      router.replace("/admin/parents");
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await adminLogin({ email, password });
      window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, response.access_token);
      router.push("/admin/parents");
    } catch (err) {
      console.error(err);
      setError("Unable to sign in with the provided credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-16 text-white">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-slate-900/70 p-10 shadow-2xl shadow-brand-sky/20">
        <div className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-widest text-brand-sky">Admin Console</p>
          <h1 className="text-3xl font-semibold">Sign in to continue</h1>
          <p className="text-sm text-slate-300">
            Use your administrative email and password to access parent records.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/50"
              placeholder="admin@krianatutoring.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/50"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-sky px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-brand-sky/90 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Protected access ensures only verified administrators can manage parent dashboards.
        </p>
      </div>
    </main>
  );
}
