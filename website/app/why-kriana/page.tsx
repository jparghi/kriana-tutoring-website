import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "../../components/footer";
import { HowWereDifferent } from "../../components/how-were-different";
import { KrianaLearningMethod } from "../../components/kriana-learning-method";

export const metadata: Metadata = {
  title: "Why Kriana? Our Approach to Personalized Learning | Kriana Tutoring",
  description:
    "Discover the Kriana Learning Method™ — a 6-step personalized system built around every child. See why Ottawa families choose Kriana over generic tutoring centers."
};

export default function WhyKrianaPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Page hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-sky/10 py-20 lg:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-brand-sky/20 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-brand-amber/20 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-sky/40 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 sm:px-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-rose/25 bg-gradient-to-r from-brand-rose/10 to-brand-amber/10 px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.38em] text-brand-rose">
            Our Approach
          </span>
          <h1 className="mt-6 text-balance text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Why Families Choose{" "}
            <span className="gradient-text">Kriana Tutoring</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            Every child learns differently. We built a system around that truth — a 6-step personalized method that starts with your child&apos;s assessment and ends with genuine confidence in the classroom.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/contact#consultation-form"
              className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-brand-sky to-brand-teal px-8 py-3.5 text-sm font-bold uppercase tracking-[0.22em] text-white shadow-[0_8px_28px_rgba(74,144,226,0.45)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_12px_40px_rgba(74,144,226,0.6)]"
            >
              Book a Free Assessment
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-8 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:border-brand-sky/40 hover:text-brand-sky"
            >
              View Our Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Full 6-step Kriana Learning Method */}
      <KrianaLearningMethod />

      {/* Full Traditional vs Personalized comparison + differentiator cards */}
      <HowWereDifferent />

      {/* Animated video storyboard — hidden, pending improvements (see docs/TODO.md) */}

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-brand-sky/10 via-white to-brand-teal/10 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center sm:px-10">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Ready to see the method in action?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-600">
            Book your child&apos;s free assessment. We&apos;ll identify exactly where they are, explain the plan, and show you why hundreds of Ottawa families trust Kriana.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/contact#consultation-form"
              className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-brand-sky to-brand-teal px-9 py-4 text-sm font-bold uppercase tracking-[0.22em] text-white shadow-[0_8px_32px_rgba(74,144,226,0.45)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_14px_44px_rgba(74,144,226,0.6)]"
            >
              Book a Free Assessment
            </Link>
            <Link
              href="/contact#consultation-form"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-9 py-4 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:border-brand-rose/30 hover:text-brand-rose"
            >
              Ask Us a Question
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-400">
            No obligation. No pressure. Just a conversation about your child.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
