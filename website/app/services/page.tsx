import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "../../components/footer";
import { servicePages } from "./data";

export const metadata: Metadata = {
  title: "Tutoring Services in Ottawa for Math, Reading & Homework Help | Kriana Tutoring",
  description:
    "Explore Kriana Tutoring services in Ottawa, including math tutoring for kids, reading help for grade 1-3 students, writing support, and homework help.",
  alternates: { canonical: "https://www.krianatutoring.com/services" }
};

export default function ServicesPage() {
  return (
    <>
      <main className="min-h-screen bg-white text-slate-900">
        <section className="bg-gradient-to-br from-white via-brand-sky/10 to-brand-amber/10 px-6 pb-16 pt-14 sm:px-10 lg:pt-20">
          <div className="mx-auto max-w-6xl">
            <p className="inline-flex rounded-full border border-brand-sky/30 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-sky">
              Kriana Services
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
              Tutoring services in Ottawa designed for confident, steady progress
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Kriana Tutoring supports JK to Grade 8 learners with personalized tutoring in Ottawa, Kanata, and
              nearby communities. Our programs are built for children who need math tutoring for kids, reading help for
              grade 1-3, and practical homework help for kids.
            </p>
          </div>
        </section>

        <section className="px-6 py-20 sm:px-10">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
            {servicePages.map((service) => (
              <article key={service.slug} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8">
                <h2 className="text-2xl font-semibold text-[#0A2D5A]">{service.shortTitle}</h2>
                <p className="mt-4 text-base leading-8 text-slate-600">{service.description}</p>
                <Link
                  href={`/services/${service.slug}`}
                  className="mt-6 inline-flex items-center text-sm font-semibold text-brand-sky transition hover:opacity-70"
                >
                  Explore this service →
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="px-6 pb-20 sm:px-10">
          <div className="mx-auto max-w-6xl rounded-[2rem] bg-[#0A2D5A] px-8 py-10 text-white">
            <h2 className="text-2xl font-semibold">Serving Ottawa, Kanata, Stittsville, and surrounding areas</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-white/85">
              Families choose Kriana Tutoring when they want academic support that is structured, warm, and easy for
              children to engage with consistently.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact#consultation-form"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#0A2D5A]"
              >
                Book a Free Assessment
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white"
              >
                Read Parent Resources
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
