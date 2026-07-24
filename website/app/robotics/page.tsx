import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Footer } from "../../components/footer";
import { RoboticsPrograms } from "../../components/robotics/robotics-programs";
import { CheckIcon, MapPinIcon } from "../../components/icons";
import {
  BIRTHDAY_PARTY_BOOKING_URL,
  ROBOTICS_BOOKING_URL,
  SCHOOL_PROGRAM_BOOKING_URL,
  SUMMER_CAMP_BOOKING_URL,
  YOUNG_ENGINEERS_URL,
} from "../../lib/site-links";
import { breadcrumbSchema, localBusinessSchema, siteUrl, toJsonLd } from "../../lib/seo";

export const metadata: Metadata = {
  title: "Robotics & Coding Classes in Kanata | Young Engineers at Kriana",
  description:
    "Explore hands-on Young Engineers robotics, engineering and coding programs offered locally by Kriana Tutoring in Kanata and Stittsville.",
  alternates: { canonical: `${siteUrl}/robotics` },
  openGraph: {
    title: "Robotics & Coding Classes in Kanata | Young Engineers at Kriana",
    description:
      "Hands-on Young Engineers robotics, engineering and coding programs offered locally by Kriana Tutoring in Kanata and Stittsville.",
    url: `${siteUrl}/robotics`,
    type: "website",
  },
};

const whatKidsLearn = [
  "Engineering thinking",
  "Problem-solving",
  "Creativity",
  "Teamwork",
  "Mechanical understanding",
  "Coding concepts",
  "Confidence through building and experimentation",
];

const additionalOfferings = [
  {
    title: "Camps & PA Days",
    description: "STEM-filled camps and PA day workshops for school breaks.",
    href: SUMMER_CAMP_BOOKING_URL,
  },
  {
    title: "Birthday Parties",
    description: "LEGO robotics birthday parties that keep every guest building.",
    href: BIRTHDAY_PARTY_BOOKING_URL,
  },
  {
    title: "School Programs",
    description: "After-school robotics programs and workshops for your school.",
    href: SCHOOL_PROGRAM_BOOKING_URL,
  },
];

const faqs = [
  {
    q: "Does my child need previous robotics experience?",
    a: "No. Programs are designed to welcome first-time builders as well as returning students, with activities that scale to each child's skill level.",
  },
  {
    q: "What ages can participate?",
    a: "Age ranges vary by session — check the age range listed on each program above before registering.",
  },
  {
    q: "Are all building materials provided?",
    a: "Yes, all LEGO and robotics building materials are provided as part of the program.",
  },
  {
    q: "Does my child need to bring a tablet?",
    a: "Any device requirements will be listed on the specific program page. Most in-person sessions provide the equipment children need on-site.",
  },
  {
    q: "Where are classes held?",
    a: "Class locations are listed on each program above and confirmed again during registration.",
  },
  {
    q: "What happens if my child misses a class?",
    a: "Please contact us as soon as you know about a missed class so we can let you know the options available for that session.",
  },
  {
    q: "What are the cancellation and refund policies?",
    a: "Cancellation and refund details are provided on the program's registration page, and any deposit terms are shown before you complete registration.",
  },
  {
    q: "Are birthday parties and school workshops available?",
    a: "Yes — see the additional offerings below for STEM birthday parties and school/community programs.",
  },
];

export default function RoboticsPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: siteUrl },
    { name: "Robotics & Coding", url: `${siteUrl}/robotics` },
  ]);

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Young Engineers Robotics & Coding",
    description:
      "Hands-on Young Engineers robotics, engineering and coding programs offered locally by Kriana Tutoring.",
    provider: { "@id": localBusinessSchema["@id"] },
    areaServed: ["Kanata", "Stittsville", "Ottawa"],
    serviceType: "Robotics and coding classes for children",
    url: `${siteUrl}/robotics`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(serviceSchema) }} />

      <main className="min-h-screen bg-white text-slate-900">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-6xl px-6 pt-6 sm:px-10">
          <nav aria-label="Breadcrumb" className="text-xs font-semibold text-slate-500">
            <Link href="/" className="hover:text-brand-sky">
              Home
            </Link>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-slate-700">Robotics &amp; Coding</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-br from-white via-brand-sky/10 to-brand-amber/10 px-6 pb-16 pt-8 sm:px-10 lg:pt-12">
          <div className="mx-auto max-w-6xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-sky/30 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-sky">
              <MapPinIcon className="h-3.5 w-3.5" />
              Serving Kanata &amp; Stittsville
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
              Young Engineers Robotics &amp; Coding in Kanata and Stittsville
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Hands-on engineering, building and age-appropriate coding programs that help children develop
              creativity, problem-solving skills and confidence.
            </p>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Robotics programs powered by Young Engineers
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#programs"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0c6162] px-7 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_8px_32px_rgba(12,97,98,0.45)] transition-all duration-300 hover:scale-[1.03] hover:bg-[#0a5051]"
              >
                View Upcoming Programs
              </a>
              <Link
                href={ROBOTICS_BOOKING_URL}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm backdrop-blur transition-all duration-300 hover:border-brand-sky hover:text-brand-sky"
              >
                Register Now
              </Link>
            </div>
          </div>
        </section>

        {/* Program introduction */}
        <section className="px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-2xl font-semibold text-[#0A2D5A] sm:text-3xl">
              Learning by building, engineering and coding
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Children learn through hands-on building, engineering challenges and coding activities — working with
              real LEGO models and age-appropriate coding tools to bring their ideas to life, one program at a time.
            </p>
          </div>
        </section>

        {/* Program options */}
        <section id="programs" className="bg-slate-50 px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold text-[#0A2D5A] sm:text-3xl">Upcoming Programs</h2>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              Every session below is confirmed and open for registration — choose a program to see full details,
              dates and pricing.
            </p>
            <div className="mt-10">
              <RoboticsPrograms />
            </div>
          </div>
        </section>

        {/* What children learn */}
        <section className="px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold text-[#0A2D5A] sm:text-3xl">What Children Learn</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {whatKidsLearn.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal">
                    <CheckIcon className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-semibold text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How registration works */}
        <section className="bg-slate-50 px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold text-[#0A2D5A] sm:text-3xl">How Registration Works</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Choose a program",
                "Enter parent and child information",
                "Complete payment or reservation",
                "Receive confirmation",
              ].map((step, i) => (
                <div key={step} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0c6162] text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="mt-3 text-sm font-semibold text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Young Engineers credibility */}
        <section className="px-6 py-16 sm:px-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/images/young-engineers/logo.png"
                alt="Young Engineers"
                width={180}
                height={52}
                className="h-10 w-auto"
              />
              <p className="max-w-xl text-sm leading-relaxed text-slate-600">
                Kriana Tutoring is proud to offer official Young Engineers robotics and coding programs locally in
                Kanata and Stittsville, combining a proven international curriculum with the same caring instructors
                families already trust for tutoring.
              </p>
            </div>
            <a
              href={YOUNG_ENGINEERS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-brand-sky"
            >
              Learn About Young Engineers
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

        {/* Additional offerings */}
        <section className="bg-slate-50 px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold text-[#0A2D5A] sm:text-3xl">More STEM Offerings</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {additionalOfferings.map((offering) => (
                <Link
                  key={offering.title}
                  href={offering.href}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)]"
                >
                  <h3 className="text-lg font-bold text-slate-900">{offering.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{offering.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0c6162]">
                    Learn more
                    <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold text-[#0A2D5A] sm:text-3xl">Frequently Asked Questions</h2>
            <div className="mt-8 space-y-3">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-2xl border border-slate-200 bg-white p-5">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-bold text-slate-800 marker:content-none">
                    {faq.q}
                    <span aria-hidden="true" className="text-slate-400 transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 pb-20 sm:px-10">
          <div className="mx-auto max-w-6xl rounded-3xl bg-[#0A2D5A] px-8 py-12 text-center sm:px-12">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Find the Right Robotics Program</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/75">
              Serving families in Kanata and Stittsville — spots are limited each session.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={ROBOTICS_BOOKING_URL}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0c6162] px-8 py-3.5 text-sm font-bold uppercase tracking-[0.22em] text-white shadow-[0_8px_28px_rgba(12,97,98,0.4)] transition-all duration-300 hover:scale-[1.03] hover:bg-[#0a5051]"
              >
                Register Now
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
