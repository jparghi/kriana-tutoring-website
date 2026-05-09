"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ADMIN_TOKEN_STORAGE_KEY } from "../../lib/admin-client";

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const token = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    router.replace(token ? "/admin/parents" : "/admin/login");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 px-6 py-12 text-sm text-slate-300">
        Redirecting to the admin console...
      </div>
    </main>
  );
}
