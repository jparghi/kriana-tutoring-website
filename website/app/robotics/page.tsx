import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Footer } from "../../components/footer";
import { RoboticsPrograms } from "../../components/robotics/robotics-programs";
import { RoboticsCtaButtons } from "../../components/robotics/robotics-cta-buttons";
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
    image: "/images/young-engineers/summer-camps-v2.png",
  },
  {
    title: "Birthday Parties",
    description: "Hands-on robotics birthday parties that keep every guest building.",
    href: BIRTHDAY_PARTY_BOOKING_URL,
    accent: YE_RED,
    image: "/images/young-engineers/birthday-party-v2.png",
  },
  {
    title: "School Programs",
    description: "After-school robotics programs and workshops for your school.",
    href: SCHOOL_PROGRAM_BOOKING_URL,
    accent: YE_AMBER,
    image: "/images/young-engineers/school-programs-v2.png",
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
    a: "Yes, all robotics building materials are provided as part of the program.",
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

        {/* 1. Young Engineers-inspired hero */}
        <section className="relative isolate min-h-[620px] overflow-hidden">
          <Image
            src="/images/robotics/young-engineers-cover.png"
            alt="A colorful Young Engineers mechanical model built from bricks and gears"
            fill
            priority
            className="object-cover object-[62%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/5 lg:via-white/75 lg:to-transparent" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, rgba(0,131,203,0.8) 1.5px, transparent 1.5px)",
              backgroundSize: "22px 22px",
            }}
          />

          <div className="relative mx-auto flex min-h-[620px] max-w-6xl items-center px-6 py-16 sm:px-10">
            <div className="max-w-xl rounded-[2rem] border border-white/80 bg-white/88 p-7 shadow-[0_26px_70px_rgba(10,45,90,0.15)] backdrop-blur-md sm:p-10">
              <a
                href={YOUNG_ENGINEERS_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-2xl bg-white px-4 py-3 shadow-sm transition-transform hover:scale-[1.02]"
              >
                <Image
                  src="/images/young-engineers/logo.png"
                  alt="Young Engineers"
                  width={220}
                  height={64}
                  className="h-14 w-auto object-contain"
                />
              </a>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-[#0083CB]">
                Now in Kanata &amp; Stittsville
              </p>
              <h1 className="mt-3 text-balance text-4xl font-black leading-[1.03] text-[#ED174B] sm:text-5xl">
                Young Engineers Enrichment Programs
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-700 sm:text-lg">
                Interactive robotics, engineering and coding programs that turn science and mathematics into an
                exciting, hands-on adventure.
              </p>
              <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[#0A2D5A]">
                <MapPinIcon className="h-4 w-4 shrink-0 text-[#ED174B]" />
                Offered locally by Kriana Tutoring
              </p>
              <div className="mt-7">
                <RoboticsCtaButtons variant="light" />
              </div>
            </div>
          </div>
        </section>

        {/* Young Engineers mission band */}
        <section className="bg-[#0083CB] px-6 py-10 text-white sm:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-lg font-semibold leading-8 sm:text-xl">
              Children learn engineering and technology by building exclusive models, testing their ideas and solving
              real challenges—developing confidence and practical skills they can carry into everyday life.
            </p>
          </div>
        </section>

        {/* Keep the program video directly below the new hero */}
        <section className="bg-white px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ED174B]">Hands-on learning</p>
              <h2 className="mt-3 text-3xl font-bold text-[#0A2D5A] sm:text-4xl">See Young Engineers in Action</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Watch students build, test and improve their creations through collaborative engineering challenges.
              </p>
            </div>
            <div className="relative mx-auto mt-9 max-w-4xl">
              <div className="absolute -inset-3 -z-10 rounded-[2rem] border-2 border-dashed border-[#0083CB]/25" />
              <div className="relative aspect-video overflow-hidden rounded-[1.75rem] border border-slate-200/70 shadow-[0_30px_70px_rgba(15,23,42,0.14)]">
                <video
                  className="h-full w-full object-cover"
                  poster="/images/robotics/robotics-video-poster.jpg"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                >
                  <source src="/videos/robotics-highlight.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Program cards + upcoming classes / launch list */}
        <section id="programs" className="relative overflow-hidden bg-slate-50 px-6 py-16 sm:px-10">
          <div className="relative mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold text-[#0A2D5A] sm:text-3xl">Find the Right Engineering Challenge</h2>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              Explore hands-on programs designed for different ages, interests and experience levels.
            </p>
            <div className="mt-10">
              <RoboticsPrograms />
            </div>
          </div>
        </section>

        {/* 6. Dark, high-contrast skills section */}
        <SkillsSection />

        {/* 8. Additional offerings */}
        <section className="relative overflow-hidden bg-slate-50 px-6 py-16 sm:px-10">
          <div className="relative mx-auto max-w-6xl">
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

      </main>

      <Footer />
    </>
  );
}
