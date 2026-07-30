import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Footer } from "../../components/footer";
import { servicePages } from "./data";

export const metadata: Metadata = {
  title: "Tutoring Services in Ottawa for Math, Reading & Science | Kriana Tutoring",
  description:
    "Explore personalized math, reading, and science tutoring for JK to Grade 8 students in Ottawa, Kanata, and Stittsville.",
  alternates: { canonical: "https://www.krianatutoring.com/tutoring" }
};

export default function ServicesPage() {
  return (
    <>
      <main className="min-h-screen bg-white text-slate-900">
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-brand-sky/10 to-brand-amber/10 px-6 pb-16 pt-14 sm:px-10 lg:pt-20">
          <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-brand-sky/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="inline-flex rounded-full border border-brand-sky/30 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-sky">
                Personalized tutoring • JK–Grade 8
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-[#0A2D5A] sm:text-5xl">
                Tutoring children can enjoy—and parents can feel confident about
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Warm, personalized tutoring that helps children feel capable while giving parents a clear,
                structured path forward.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/booking/VQNj7NfFGCI5oun5PXQE"
                  className="inline-flex items-center justify-center rounded-full bg-[#0c6162] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0a5051]"
                >
                  Book a Free Assessment
                </Link>
                <a
                  href="#tutoring-services"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/90 px-6 py-3 text-sm font-bold text-[#0A2D5A] transition hover:border-brand-sky hover:text-brand-sky"
                >
                  Explore Tutoring Options
                </a>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-3 -z-10 rounded-[2rem] border-2 border-dashed border-brand-sky/25" />
              <div className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_28px_70px_rgba(10,45,90,0.14)]">
                <Image
                  src="/images/services/tutoring-hero-realistic.png"
                  alt="A caring tutor supporting a student with schoolwork"
                  width={1448}
                  height={1086}
                  priority
                  className="aspect-[16/10] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-7 px-6 sm:px-10">
          <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_16px_50px_rgba(10,45,90,0.1)] sm:grid-cols-3">
            {[
              {
                icon: "★",
                title: "Encouraging for kids",
                description: "Patient sessions where questions are welcome and progress feels achievable.",
                color: "#4A90E2",
              },
              {
                icon: "✓",
                title: "Clear for parents",
                description: "Straightforward goals and communication about what your child is working on.",
                color: "#00A99D",
              },
              {
                icon: "↗",
                title: "Built for progress",
                description: "Support shaped around current skills, schoolwork, and the next realistic step.",
                color: "#FF8A65",
              },
            ].map((item, index) => (
              <div
                key={item.title}
                className={`flex gap-4 p-6 ${index > 0 ? "border-t border-slate-100 sm:border-l sm:border-t-0" : ""}`}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <div>
                  <h2 className="font-bold text-[#0A2D5A]">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="tutoring-services" className="px-6 py-20 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-brand-sky">How we can help</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#0A2D5A] sm:text-4xl">
                Support built around your child’s next step
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Choose the area where your child needs the most support. Every program is adapted to their pace,
                confidence, and current schoolwork.
              </p>
            </div>
            <div className="mt-10 grid gap-7 lg:grid-cols-3">
            {servicePages.map((service) => (
              <article
                key={service.slug}
                className="group flex overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(10,45,90,0.12)] lg:flex-col"
              >
                <div className="relative min-h-52 w-2/5 overflow-hidden bg-slate-50 lg:aspect-[16/10] lg:min-h-0 lg:w-full">
                  <Image
                    src={service.image}
                    alt={service.imageAlt}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: service.accent }} />
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <h3 className="text-2xl font-semibold text-[#0A2D5A]">{service.shortTitle}</h3>
                  <p className="mt-4 text-base leading-7 text-slate-600">{service.description}</p>
                  <Link
                    href={`/tutoring/${service.slug}`}
                    className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold transition hover:gap-3"
                    style={{ color: service.accent }}
                  >
                    Explore this service <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
            </div>
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
                href="/booking/VQNj7NfFGCI5oun5PXQE"
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
