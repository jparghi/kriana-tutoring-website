"use client";

import type { FormEvent } from "react";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";

interface RegisterFormProps {
  gradeLevels: string[];
}

type SubmissionState = "idle" | "submitting" | "success" | "error";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function RegisterForm({ gradeLevels }: RegisterFormProps) {
  const [status, setStatus] = useState<SubmissionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isSubmitting = status === "submitting";

  const helperMessage = useMemo(() => {
    if (status === "success") {
      return "Thanks for registering! Our team will reach out within one business day to confirm the next steps.";
    }

    if (status === "error") {
      return errorMessage ?? "We couldn't send your registration. Please try again.";
    }

    return null;
  }, [errorMessage, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!API_BASE_URL) {
      setStatus("error");
      setErrorMessage("Registration API is not configured. Please contact support.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      guardian_name: formData.get("guardianName")?.toString().trim() ?? "",
      email: formData.get("email")?.toString().trim() ?? "",
      student_name: formData.get("studentName")?.toString().trim() ?? "",
      grade_level: formData.get("gradeLevel")?.toString() ?? "",
      focus_areas: formData.get("focusAreas")?.toString().trim() ?? "",
      availability: formData.get("availability")?.toString().trim() ?? "",
    };

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/registrations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const detail = errorBody?.detail;
        throw new Error(detail ?? "Unexpected server error");
      }

      setStatus("success");
      setErrorMessage(null);
      formRef.current?.reset();
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to submit registration.");
    }
  };

  return (
    <form ref={formRef} className="space-y-6" aria-label="Registration form" onSubmit={handleSubmit}>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="guardian-name" className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
            Guardian name
          </label>
          <input
            id="guardian-name"
            name="guardianName"
            type="text"
            required
            autoComplete="name"
            placeholder="Alex Morgan"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/40"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="alex@example.com"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/40"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="student-name" className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
            Student name
          </label>
          <input
            id="student-name"
            name="studentName"
            type="text"
            required
            autoComplete="off"
            placeholder="Jordan Morgan"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/40"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="grade" className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
            Grade level
          </label>
          <select
            id="grade"
            name="gradeLevel"
            required
            defaultValue=""
            className="appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/40"
          >
            <option value="" disabled>
              Select grade
            </option>
            {gradeLevels.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="focus-areas" className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
          Focus areas
        </label>
        <textarea
          id="focus-areas"
          name="focusAreas"
          rows={4}
          placeholder="Math confidence, reading comprehension, EQAO prep..."
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/40"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="availability" className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
          Preferred availability
        </label>
        <textarea
          id="availability"
          name="availability"
          rows={3}
          placeholder="Weeknights after 5pm, Saturday mornings, etc."
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/40"
        />
      </div>

      <div className="space-y-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-full bg-brand-sky px-8 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_18px_36px_rgba(13,116,109,0.25)] transition hover:bg-brand-amber hover:text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
        >
          {isSubmitting ? "Submitting..." : "Submit registration"}
        </button>

        {helperMessage ? (
          <p
            role={status === "error" ? "alert" : undefined}
            className={`text-center text-sm ${status === "error" ? "text-brand-rose" : "text-brand-sky"}`}
          >
            {helperMessage}
          </p>
        ) : null}
      </div>

      <p className="text-center text-xs text-slate-500">
        By submitting this form you agree to our <Link href="/privacy" className="font-semibold text-brand-sky hover:text-brand-rose">privacy policy</Link> and consent to be contacted by the Kriana Tutoring team.
      </p>
    </form>
  );
}
