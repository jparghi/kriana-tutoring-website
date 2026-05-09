"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";

interface RegistrationRecord {
  id: string;
  guardian_name: string;
  email: string;
  student_name: string;
  grade_level: string;
  focus_areas: string;
  availability: string;
  created_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminRegistrationsPage() {
  const [secret, setSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [hasFetched, setHasFetched] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!API_BASE_URL) {
      setError("Admin API is not configured. Please contact the engineering team.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/registrations`, {
        headers: {
          "X-Admin-Secret": secret,
        },
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const detail = errorBody?.detail ?? "Unable to fetch registrations.";
        throw new Error(detail);
      }

      const data = (await response.json()) as { results: RegistrationRecord[] };
      setRegistrations(data.results);
      setHasFetched(true);
    } catch (fetchError) {
      setRegistrations([]);
      setHasFetched(false);
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load registrations.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-16 pt-10">
      <div className="mx-auto w-full max-w-5xl px-6 sm:px-10">
        <header className="mb-10 space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-sky">Admin</p>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Parent registrations</h1>
          <p className="text-sm text-slate-600 sm:text-base">
            Use your administrator secret to review new family registrations. For additional tooling or export features, reach out
            to the <Link href="mailto:info@krianatutoring.com" className="font-semibold text-brand-sky hover:text-brand-rose">operations team</Link>.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:flex-row md:items-end">
            <label className="flex-1 text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
              Admin secret
              <input
                type="password"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/40"
                placeholder="Enter the configured admin secret"
              />
            </label>

            <button
              type="submit"
              disabled={isLoading || secret.trim().length === 0}
              className="inline-flex items-center justify-center rounded-full bg-brand-sky px-8 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_18px_36px_rgba(13,116,109,0.25)] transition hover:bg-brand-amber hover:text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              {isLoading ? "Loading..." : "View registrations"}
            </button>
          </form>

          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-2xl border border-brand-rose/30 bg-brand-rose/5 px-4 py-3 text-sm text-brand-rose"
            >
              {error}
            </p>
          ) : null}

          {hasFetched && registrations.length === 0 && !error ? (
            <p className="mt-6 text-sm text-slate-500">No registrations found yet. Check back soon!</p>
          ) : null}

          {registrations.length > 0 ? (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-3 py-2">Guardian</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Grade</th>
                    <th className="px-3 py-2">Focus areas</th>
                    <th className="px-3 py-2">Availability</th>
                    <th className="px-3 py-2">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registrations.map((registration) => (
                    <tr key={registration.id} className="align-top">
                      <td className="px-3 py-3 font-medium text-slate-900">{registration.guardian_name}</td>
                      <td className="px-3 py-3 text-slate-600">
                        <a href={`mailto:${registration.email}`} className="hover:text-brand-sky">
                          {registration.email}
                        </a>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{registration.student_name}</td>
                      <td className="px-3 py-3 text-slate-600">{registration.grade_level}</td>
                      <td className="px-3 py-3 text-slate-600 whitespace-pre-wrap">{registration.focus_areas || "—"}</td>
                      <td className="px-3 py-3 text-slate-600 whitespace-pre-wrap">{registration.availability || "—"}</td>
                      <td className="px-3 py-3 text-slate-500">
                        {new Date(registration.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
