"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

function encodeForm(values: Record<string, string>) {
  return new URLSearchParams(values).toString();
}

export function ContactInquiryForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const values = Array.from(formData.entries()).reduce<Record<string, string>>(
      (accumulator, [key, value]) => {
        accumulator[key] = typeof value === "string" ? value : "";
        return accumulator;
      },
      {}
    );

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: encodeForm(values)
      });

      if (!response.ok) {
        throw new Error(`Submission failed with status ${response.status}`);
      }

      form.reset();
      router.push("/contact/success");
    } catch {
      setSubmitError("We couldn't send your inquiry right now. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      name="contact-inquiry"
      method="POST"
      data-netlify="true"
      netlify-honeypot="bot-field"
      className="order-1 rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)] lg:order-2"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="form-name" value="contact-inquiry" />
      <input
        type="hidden"
        name="subject"
        data-remove-prefix
        value="New inquiry from %{formName} on %{siteName} (%{submissionId})"
      />
      <p className="hidden">
        <label>
          Don&apos;t fill this out if you&apos;re human: <input name="bot-field" />
        </label>
      </p>

      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="parent-name" className="block text-sm font-semibold text-slate-700">
              Parent or guardian name
              <input
                id="parent-name"
                name="parent_name"
                type="text"
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-700 shadow-sm focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
                placeholder="Alex Smith"
              />
            </label>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
              Email address
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-700 shadow-sm focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
                placeholder="you@example.com"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">
              Phone number (optional)
              <input
                id="phone"
                name="phone"
                type="tel"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-700 shadow-sm focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
                placeholder="+1 (613) 555-0123"
              />
            </label>
          </div>
          <div>
            <label htmlFor="student-grade" className="block text-sm font-semibold text-slate-700">
              Student grade level
              <select
                id="student-grade"
                name="student_grade"
                required
                className="mt-2 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-700 shadow-sm focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
                defaultValue=""
              >
                <option value="" disabled>
                  Select grade range
                </option>
                <option value="K-2">Kindergarten – Grade 2</option>
                <option value="3-5">Grades 3 – 5</option>
                <option value="6-8">Grades 6 – 8</option>
              </select>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="focus-area" className="block text-sm font-semibold text-slate-700">
            What subjects or goals should we focus on?
            <textarea
              id="focus-area"
              name="focus_area"
              required
              rows={4}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal leading-relaxed text-slate-700 shadow-sm focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
              placeholder="Tell us about strengths to celebrate, challenges to address, upcoming tests, or enrichment interests."
            />
          </label>
        </div>

        <div>
          <label htmlFor="preferred-time" className="block text-sm font-semibold text-slate-700">
            Preferred consultation time (optional)
            <input
              id="preferred-time"
              name="preferred_time"
              type="text"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-700 shadow-sm focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
              placeholder="Weeknights after 6 PM, Saturday mornings, etc."
            />
          </label>
        </div>

        <input type="hidden" name="inquiry_type" value="contact" />

        <div className="space-y-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-brand-rose px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_18px_40px_rgba(244,63,94,0.35)] transition hover:-translate-y-0.5 hover:bg-brand-sky disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isSubmitting ? "Submitting..." : "Submit inquiry"}
          </button>
          {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
          <p className="text-xs leading-relaxed text-slate-500">
            By submitting this form you agree to our privacy policy and consent to be contacted by the Kriana Tutoring team. We respect your inbox and only send information relevant to your request.
          </p>
        </div>
      </div>
    </form>
  );
}
