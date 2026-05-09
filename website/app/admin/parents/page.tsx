"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ADMIN_TOKEN_STORAGE_KEY,
  ApiError,
  ParentRecord,
  fetchParents,
  updateParentAccess,
} from "../../../lib/admin-client";

export default function ParentManagementPage() {
  const router = useRouter();
  const [parents, setParents] = useState<ParentRecord[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingParent, setPendingParent] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    if (!storedToken) {
      router.replace("/admin/login");
      return;
    }
    setToken(storedToken);
  }, [router]);

  const loadParents = useCallback(
    async (activeToken: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchParents(activeToken);
        setParents(response.parents);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
          router.replace("/admin/login");
          return;
        }
        console.error(err);
        setError("Unable to load parent records. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadParents(token);
  }, [token, loadParents]);

  const handleToggleAccess = useCallback(
    async (parent: ParentRecord) => {
      if (!token) {
        router.replace("/admin/login");
        return;
      }

      setPendingParent(parent.id);
      try {
        const updated = await updateParentAccess(token, parent.id, !parent.access_enabled);
        setParents((previous) =>
          previous.map((item) => (item.id === updated.id ? updated : item)),
        );
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
          router.replace("/admin/login");
          return;
        }
        console.error(err);
        setError("Failed to update access settings. Please try again.");
      } finally {
        setPendingParent(null);
      }
    },
    [router, token],
  );

  const activeParents = useMemo(
    () => parents.filter((parent) => parent.access_enabled),
    [parents],
  );

  const pendingParents = useMemo(
    () => parents.filter((parent) => !parent.access_enabled),
    [parents],
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-900/40 p-8 shadow-2xl shadow-brand-sky/10 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.35em] text-brand-sky">
              Admin Console
            </p>
            <h1 className="text-3xl font-semibold">Parent access control</h1>
            <p className="text-sm text-slate-300">
              Review every registered parent and control who can see the upcoming dashboard content for their child.
            </p>
          </div>
          <button
            onClick={() => {
              window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
              router.push("/admin/login");
            }}
            className="self-start rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-brand-sky hover:text-white"
          >
            Sign out
          </button>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid place-items-center rounded-3xl border border-slate-800 bg-slate-900/60 py-24 text-slate-300">
            Loading parent data...
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
              <header>
                <h2 className="text-xl font-semibold text-white">Dashboard enabled</h2>
                <p className="text-sm text-slate-400">
                  Parents currently able to sign in to the dashboard experience.
                </p>
              </header>
              <ParentTable
                parents={activeParents}
                onToggleAccess={handleToggleAccess}
                pendingParent={pendingParent}
              />
            </section>
            <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
              <header>
                <h2 className="text-xl font-semibold text-white">Awaiting activation</h2>
                <p className="text-sm text-slate-400">
                  Parents who have registered but do not yet have dashboard access.
                </p>
              </header>
              <ParentTable
                parents={pendingParents}
                onToggleAccess={handleToggleAccess}
                pendingParent={pendingParent}
              />
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

interface ParentTableProps {
  parents: ParentRecord[];
  onToggleAccess: (parent: ParentRecord) => void;
  pendingParent: string | null;
}

function ParentTable({ parents, onToggleAccess, pendingParent }: ParentTableProps) {
  if (parents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 py-12 text-center text-sm text-slate-400">
        No parents in this list yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800">
        <thead className="bg-slate-900/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
              Parent
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
              Child
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
              Grade
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">
              Access
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-950/40">
          {parents.map((parent) => (
            <tr key={parent.id}>
              <td className="px-4 py-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">{parent.name}</p>
                  <p className="text-xs text-slate-400">{parent.email}</p>
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-slate-200">{parent.child_name}</td>
              <td className="px-4 py-4 text-sm text-slate-200">{parent.grade}</td>
              <td className="px-4 py-4 text-right">
                <button
                  onClick={() => onToggleAccess(parent)}
                  disabled={pendingParent === parent.id}
                  className="rounded-lg border border-brand-sky/40 px-3 py-2 text-xs font-semibold text-brand-sky transition hover:border-brand-sky hover:text-white disabled:cursor-wait disabled:opacity-70"
                >
                  {pendingParent === parent.id
                    ? "Saving..."
                    : parent.access_enabled
                    ? "Disable access"
                    : "Enable access"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
