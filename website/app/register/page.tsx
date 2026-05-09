import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "../../components/section-heading";
import { RegisterForm } from "./register-form";

const gradeLevels = [
  "JK – Grade 2",
  "Grades 3 – 5",
  "Grades 6 – 8",
  "Grades 9 – 12"
];

export const metadata: Metadata = {
  title: "Register",
  description:
    "Reserve a spot with Kriana Tutoring. Share your learner's details and our team will craft a personalised learning journey."
};

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-brand-sky/10 pb-24 pt-16">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-32 h-96 w-96 rounded-full bg-brand-sky/20 blur-3xl" />
        <div className="absolute bottom-16 right-0 h-[420px] w-[420px] rounded-full bg-brand-rose/20 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/80 to-transparent" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 sm:px-10 lg:flex-row lg:items-start lg:gap-24">
        <section className="max-w-xl pt-8">
          <SectionHeading
            align="left"
            eyebrow="Start learning"
            title="Register for a personalised tutoring experience"
            description="Tell us about your learner and goals. We respond within one business day with a tailored plan and booking options."
          />

          <div className="mt-10 space-y-6 text-base leading-relaxed text-slate-600">
            <p>
              Families can expect a warm welcome and a fully customised programme that blends confidence-building mentorship with
              measurable academic growth.
            </p>
            <ul className="space-y-3 text-sm text-slate-600 sm:text-base">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-sky/15 text-sm font-semibold text-brand-sky">
                  1
                </span>
                Complete the registration form with your contact details and learning goals.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-sky/15 text-sm font-semibold text-brand-sky">
                  2
                </span>
                Our team confirms availability and crafts a bespoke lesson plan.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-sky/15 text-sm font-semibold text-brand-sky">
                  3
                </span>
                Begin sessions in studio, in-home, or online—whichever fits your family best.
              </li>
            </ul>

            <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
              <h3 className="text-lg font-semibold text-slate-900">Prefer to talk first?</h3>
              <p className="mt-2 text-sm text-slate-600">
                Call us at <a href="tel:+16134006921" className="font-semibold text-brand-sky hover:text-brand-rose">613-400-6921</a> or email
                <a href="mailto:info@krianatutoring.com" className="ml-1 font-semibold text-brand-sky hover:text-brand-rose">info@krianatutoring.com</a>.
              </p>
            </div>
          </div>
        </section>

        <section className="relative w-full rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur lg:sticky lg:top-24">
          <RegisterForm gradeLevels={gradeLevels} />
        </section>
      </div>
    </main>
  );
}
