import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Footer } from "../../components/footer";
import { RoboticsPrograms } from "../../components/robotics/robotics-programs";
import { RoboticsCtaButtons } from "../../components/robotics/robotics-cta-buttons";
import { LearningJourney } from "../../components/robotics/learning-journey";
import { SkillsSection } from "../../components/robotics/skills-section";
import { MapPinIcon } from "../../components/icons";
import {
  BIRTHDAY_PARTY_BOOKING_URL,
  SCHOOL_PROGRAM_BOOKING_URL,
  SUMMER_CAMP_BOOKING_URL,
  YOUNG_ENGINEERS_URL,
} from "../../lib/site-links";
import { YE_AMBER, YE_BLUE, YE_RED } from "../../lib/robotics-content";
import { breadcrumbSchema, localBusinessSchema, siteUrl, toJsonLd } from "../../lib/seo";

export const metadata: Metadata = {
  title: "Robotics & Coding Classes in Kanata | Young Engineers at Kriana",
  description:
    "Explore hands-on robotics, engineering and coding programs for children in Kanata and Stittsville, offered locally by Kriana Tutoring.",
  alternates: { canonical: `${siteUrl}/robotics` },
  openGraph: {
    title: "Robotics & Coding Classes in Kanata | Young Engineers at Kriana",
    description:
      "Explore hands-on robotics, engineering and coding programs for children in Kanata and Stittsville, offered locally by Kriana Tutoring.",
    url: `${siteUrl}/robotics`,
    type: "website",
  },
};

const additionalOfferings = [
  {
    title: "Camps & PA Days",
    description: "STEM-filled camps and PA day workshops for school breaks.",
    href: SUMMER_CAMP_BOOKING_URL,
    accent: YE_BLUE,
    image: "/images/young-engineers/summer-camps.png",
  },
  {
    title: "Birthday Parties",
    description: "LEGO robotics birthday parties that keep every guest building.",
    href: BIRTHDAY_PARTY_BOOKING_URL,
    accent: YE_RED,
    image: "/images/young-engineers/birthday-party.png",
  },
  {
    title: "School Programs",
    description: "After-school robotics programs and workshops for your school.",
    href: SCHOOL_PROGRAM_BOOKING_URL,
    accent: YE_AMBER,
    image: "/images/young-engineers/school-programs.png",
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

        {/* 1. Immersive hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-brand-sky/10 to-white px-6 pb-16 pt-8 sm:px-10 lg:pt-12">
          {/* Subtle blueprint grid + soft radial + gear outlines — decorative, kept behind content */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(0,131,203,0.7) 1px,transparent 1px),linear-gradient(90deg,rgba(0,131,203,0.7) 1px,transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />
            <div className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-brand-sky/15 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#ED174B]/40 to-transparent" />
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              className="absolute -right-6 top-10 hidden h-28 w-28 text-[#0083CB]/10 lg:block"
            >
              <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="6" />
              <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="6" />
            </svg>
          </div>

          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p
                className="inline-flex items-center gap-2 rounded-full border bg-white/90 px-4 py-1 text-xs font-black uppercase tracking-[0.3em]"
                style={{ borderColor: `${YE_BLUE}4D`, color: YE_BLUE }}
              >
                Young Engineers at Kriana
              </p>
              <h1 className="mt-5 max-w-xl text-balance text-4xl font-bold leading-[1.08] text-slate-900 sm:text-5xl">
                Build. Code. Create Something Amazing.
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
                Hands-on robotics, engineering and coding programs where children learn by building, testing and
                bringing their ideas to life.
              </p>
              <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-[#ED174B]" />
                Serving Kanata and Stittsville
              </p>

              <div className="mt-8">
                <RoboticsCtaButtons variant="light" />
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-3 -z-10 rounded-[2rem] border-2 border-dashed border-[#0083CB]/25" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/70 shadow-[0_30px_70px_rgba(15,23,42,0.14)]">
                <Image
                  src="/images/robotics/robotics-hero.png"
                  alt="Three children building a LEGO robotics model together from a blueprint"
                  width={1672}
                  height={941}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Short hands-on learning introduction */}
        <section className="px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold text-[#0A2D5A] sm:text-3xl">
              Learning by Building, Engineering and Coding
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Children learn through hands-on building, engineering challenges and coding activities — working with
              real LEGO models and age-appropriate coding tools to bring their ideas to life, one program at a time.
            </p>
          </div>
        </section>

        {/* 3. Imagine -> Build -> Test -> Improve -> Code journey */}
        <section className="relative overflow-hidden bg-brand-sky/5 px-6 py-16 sm:px-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,131,203,0.7) 1px,transparent 1px),linear-gradient(90deg,rgba(0,131,203,0.7) 1px,transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />
          <div className="relative mx-auto max-w-6xl text-center">
            <h2 className="text-2xl font-semibold text-[#0A2D5A] sm:text-3xl">The Engineering Journey</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600">
              Every program follows the same hands-on process real engineers use.
            </p>
            <LearningJourney />
          </div>
        </section>

        {/* 4. Program cards + upcoming classes / launch list */}
        <section id="programs" className="bg-slate-50 px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold text-[#0A2D5A] sm:text-3xl">Find the Right Engineering Challenge</h2>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              Explore hands-on programs designed for different ages, interests and experience levels.
            </p>
            <div className="mt-10">
              <RoboticsPrograms />
            </div>
          </div>
        </section>

        {/* 5. Large visual engineering story */}
        <section className="px-6 py-16 sm:px-10">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/70 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
              <Image
                src="/images/robotics/build-test-improve.png"
                alt="Two children closely examining gears and motors on a mechanical build"
                width={1536}
                height={1024}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[#0A2D5A] sm:text-3xl">
                Real Tools. Real Mechanisms. Real Confidence.
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                From gears and motors to sensors and structures, children work with real mechanical components —
                studying blueprints, wiring builds and adjusting their designs until they work exactly as planned.
              </p>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Every challenge is designed to be attempted, tested and improved — building the kind of patience and
                problem-solving that carries far beyond the classroom.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Dark, high-contrast skills section */}
        <SkillsSection />

        {/* 8. Additional offerings */}
        <section className="bg-slate-50 px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold text-[#0A2D5A] sm:text-3xl">More Robotics Experiences</h2>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              STEM fun beyond the classroom — for camps, celebrations and schools.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {additionalOfferings.map((offering) => (
                <Link
                  key={offering.title}
                  href={offering.href}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)]"
                >
                  <div className="relative h-32 w-full overflow-hidden bg-slate-100">
                    <Image
                      src={offering.image}
                      alt={offering.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-x-0 top-0 h-1"
                      style={{ backgroundColor: offering.accent }}
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-base font-bold text-slate-900">{offering.title}</h3>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{offering.description}</p>
                    <span
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold"
                      style={{ color: offering.accent }}
                    >
                      Learn more
                      <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Young Engineers credibility */}
        <section className="px-6 py-16 sm:px-10">
          <div
            className="mx-auto flex max-w-6xl flex-col gap-6 rounded-3xl border border-slate-200 border-t-4 bg-white p-8 lg:flex-row lg:items-center lg:justify-between"
            style={{ borderTopColor: YE_RED }}
          >
            <div className="flex items-center gap-4">
              <Image
                src="/images/young-engineers/logo.png"
                alt="Young Engineers"
                width={180}
                height={52}
                className="h-10 w-auto"
              />
              <p className="max-w-xl text-sm leading-relaxed text-slate-600">
                Young Engineers Robotics &amp; Coding — offered locally by Kriana Tutoring, combining a proven
                international curriculum with the same caring instructors families already trust for tutoring.
              </p>
            </div>
            <a
              href={YOUNG_ENGINEERS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-[#0083CB]"
            >
              Learn About Young Engineers
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

        {/* 9. FAQ */}
        <section className="bg-slate-50 px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold text-[#0A2D5A] sm:text-3xl">Frequently Asked Questions</h2>
            <div className="mt-8 space-y-3">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-2xl border border-slate-200 bg-white p-5">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-bold text-slate-800 marker:content-none">
                    {faq.q}
                    <span
                      aria-hidden="true"
                      className="text-slate-400 transition-all duration-200 group-open:rotate-45 group-open:text-[#ED174B]"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 10. Strong final registration CTA */}
        <section className="relative overflow-hidden px-6 py-20 sm:px-10">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl">
            <div className="relative">
              <Image
                src="/images/robotics/robotics-success-banner.png"
                alt="A group of excited children and their instructor celebrating around their finished robotics builds"
                width={1915}
                height={821}
                className="h-[420px] w-full object-cover sm:h-[380px]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A2D5A]/10 via-[#0A2D5A]/60 to-[#0A2D5A]/95" />
              <div className="absolute inset-0 flex items-center justify-end">
                <div className="max-w-md px-8 text-right sm:px-12">
                  <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to Build Their Next Big Idea?</h2>
                  <p className="mt-3 text-sm leading-relaxed text-white/80">
                    Explore upcoming robotics programs or join the launch list for Kanata and Stittsville.
                  </p>
                  <div className="mt-7 flex flex-wrap items-center justify-end gap-3">
                    <RoboticsCtaButtons variant="dark" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
