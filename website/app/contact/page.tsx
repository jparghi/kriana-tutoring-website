import type { Metadata } from "next";
import Link from "next/link";

import { ContactInquiryForm } from "./contact-inquiry-form";
import { ContactGrid } from "../../components/contact-grid";
import { Footer } from "../../components/footer";
import { toJsonLd } from "../../lib/seo";

const officeHours = [
  { label: "Monday – Friday", value: "4:00 PM – 9:00 PM" },
  { label: "Saturday", value: "Closed" },
  { label: "Sunday", value: "By appointment" }
];

const consultationSteps = [
  {
    title: "Tell us about your learner",
    description:
      "Share goals, strengths, and areas where support would make the biggest difference."
  },
  {
    title: "Receive a personalized plan",
    description:
      "We match your child with a tutor, outline recommended sessions, and provide pricing details."
  },
  {
    title: "Start with a confidence-building session",
    description:
      "Kick off with a complimentary assessment or trial lesson designed to make students feel seen and supported."
  }
];

const faqs = [
  {
    question: "How quickly will I hear back after reaching out?",
    answer:
      "We reply to all inquiries within one business day. If you contact us outside of office hours, we'll respond first thing the next morning."
  },
  {
    question: "Do you offer both in-person and online tutoring?",
    answer:
      "Yes. Families can visit our Kanata learning studio or join virtual sessions from anywhere in Canada. We build flexible plans that blend both options when helpful."
  },
  {
    question: "Can we start with a trial session?",
    answer:
      "Absolutely. Every new family begins with a complimentary consultation so we can assess goals, learning styles, and the best-fit tutor before committing."
  }
];

export const metadata: Metadata = {
  title: "Contact Kriana Tutoring in Ottawa | Book a Free Assessment",
  description:
    "Contact Kriana Tutoring in Ottawa to book a free assessment, ask about math and English tutoring, or build a personalized learning plan for your child."
};

export default function ContactPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };

  return (
    <main className="flex min-h-screen flex-col bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(faqSchema) }}
      />
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-white via-brand-sky/10 to-brand-amber/10">
        <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-brand-sky/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-brand-rose/25 blur-3xl" />
        <div className="mx-auto grid w-full max-w-6xl gap-16 px-6 pb-24 pt-24 sm:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:pt-32">
          <div className="space-y-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 shadow-sm">
              Contact Kriana Tutoring
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
              Let&apos;s build a confident learning plan together
            </h1>
            <p className="text-lg leading-relaxed text-slate-700">
              Share your child&apos;s goals, questions, or concerns and we&apos;ll guide you through next steps—whether that&apos;s booking a free consultation, planning a diagnostic assessment, or exploring enrichment pathways.
            </p>
            <ul className="grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
              <li className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-amber/30 text-xs font-semibold text-slate-900">
                  1
                </span>
                <span>Personalized tutoring across math, literacy, science, STEM, and more.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-sky/30 text-xs font-semibold text-slate-900">
                  2
                </span>
                <span>Hybrid options—visit our Kanata studio or join live online sessions from home.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-teal/30 text-xs font-semibold text-slate-900">
                  3
                </span>
                <span>Frequent progress updates, family communication, and actionable learning insights.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-rose/30 text-xs font-semibold text-slate-900">
                  4
                </span>
                <span>Support for enrichment, catch-up, exam prep, and project-based learning journeys.</span>
              </li>
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="tel:+16134006921"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-sky px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.15)] transition hover:-translate-y-0.5 hover:bg-brand-amber"
              >
                Call or text +1 (613) 400-6921
              </Link>
              <Link
                href="mailto:info@krianatutoring.com"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-sky/60 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-brand-sky hover:bg-white"
              >
                Email info@krianatutoring.com
              </Link>
            </div>
          </div>
          <aside className="relative rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Visit our learning studio</h2>
                <p className="mt-3 text-sm text-slate-600">
                  205 Metric Circle, Stittsville, Ontario — inside the Kanata North Tech Park with ample parking and collaborative learning spaces.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-rose">Office Hours</p>
                <dl className="mt-4 space-y-3 text-sm text-slate-700">
                  {officeHours.map((entry) => (
                    <div key={entry.label} className="flex items-center justify-between gap-4">
                      <dt>{entry.label}</dt>
                      <dd className="font-medium">{entry.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-teal">Need quick support?</p>
                <p className="mt-3 text-sm text-slate-600">
                  Message us on WhatsApp or email and we&apos;ll get right back. Families enrolled with Kriana can also reach their tutor directly through our parent concierge.
                </p>
                <div className="mt-4 space-y-2 text-sm font-semibold text-slate-900">
                  <Link
                    href="https://wa.me/16134006921"
                    className="block rounded-full border border-brand-sky/50 bg-white px-4 py-2 text-center transition hover:border-brand-sky hover:bg-brand-sky/20"
                  >
                    Start a WhatsApp chat
                  </Link>
                  <Link
                    href="mailto:info@krianatutoring.com"
                    className="block rounded-full border border-brand-sky/50 bg-white px-4 py-2 text-center transition hover:border-brand-sky hover:bg-brand-sky/20"
                  >
                    Email our team
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="consultation-form" className="scroll-mt-32 bg-slate-50 py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 sm:px-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="order-2 space-y-6 lg:order-1">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-sky/30 bg-brand-sky/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-sky">
              Book a complimentary consultation
            </p>
            <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              Share a few details and we&apos;ll tailor recommendations for your child
            </h2>
            <p className="text-base leading-relaxed text-slate-600">
              Complete the short form and our parent concierge will reach out with a personalized plan, tutor match, and scheduling options. Prefer to talk it through? Call or text us anytime.
            </p>
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-rose">What to expect</p>
              <ul className="mt-4 space-y-4 text-sm text-slate-600">
                {consultationSteps.map((step) => (
                  <li key={step.title} className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <ContactInquiryForm />
        </div>
      </section>

      <ContactGrid />

      <section className="bg-white py-24">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-teal">
              Frequently asked questions
            </p>
            <h2 className="mt-6 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              Answers for parents planning the next learning milestone
            </h2>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
                <h3 className="text-lg font-semibold text-slate-900">{faq.question}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
