import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Footer } from "../../components/footer";
import { RoboticsPrograms } from "../../components/robotics/robotics-programs";
import { RoboticsCtaButtons } from "../../components/robotics/robotics-cta-buttons";
import { RoboticsPricingSection } from "../../components/robotics/robotics-pricing-section";
import { RoboticsSectionNav } from "../../components/robotics/robotics-section-nav";
import { SkillsSection } from "../../components/robotics/skills-section";
import { MapPinIcon } from "../../components/icons";
import {
  BIRTHDAY_PARTY_PATH,
  ROBOTICS_BOOKING_URL,
  SCHOOL_PROGRAM_BOOKING_URL,
  // SUMMER_CAMP_BOOKING_URL, // unused while "Camps & PA Days" tile is hidden — see additionalOfferings below
  YOUNG_ENGINEERS_URL,
} from "../../lib/site-links";
import {
  YE_AMBER,
  /* YE_BLUE, */ YE_RED,
  formatTimeRange,
  licensedRoboticsPrograms,
} from "../../lib/robotics-content";
import { breadcrumbSchema, localBusinessSchema, siteUrl, toJsonLd } from "../../lib/seo";
import { getCatalogServer } from "../../lib/catalog.server";
import { ROBOTICS_CATEGORY } from "../../lib/site-links";

// Regenerate the cached page at most once a minute, matching the public
// catalogue API's own Cache-Control window (see CACHE_HEADERS in
// app/api/public-catalog/_lib.ts) — fresh enough for staff schedule changes
// to show up quickly, but most visitors get an instantly-served cached page
// instead of paying for a Firestore round trip on every request.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Robotics & Coding Classes in Kanata | Young Engineers at Kriana",
  description:
    "Explore hands-on Young Engineers robotics, engineering and coding programs in Kanata and Stittsville that build computational thinking and AI-ready foundations.",
  alternates: { canonical: `${siteUrl}/robotics` },
  openGraph: {
    title: "Robotics & Coding Classes in Kanata | Young Engineers at Kriana",
    description:
      "Hands-on robotics, engineering and coding programs that build computational thinking and AI-ready foundations for children in Kanata and Stittsville.",
    url: `${siteUrl}/robotics`,
    type: "website",
  },
};

const futureReadyJourney = [
  { title: "Build", description: "Turn an idea into a hands-on model." },
  { title: "Program", description: "Give each creation clear instructions." },
  { title: "Test", description: "Observe what works and recognize patterns." },
  { title: "Debug", description: "Find the problem and adjust the solution." },
  { title: "Improve", description: "Refine the design through creative thinking." },
];

// Every program currently runs one time slot repeated across Monday,
// Wednesday and Friday, so each card leads with the time and lists the days
// rather than repeating "…, 4:30 p.m.–5:30 p.m." three times. If a program
// ever runs different times on different days, `timeLabel` is null and the
// card falls back to listing each day/time pair in full. A program without a
// published weekly schedule is omitted rather than shown as an empty card.
const weeklyScheduleCards = licensedRoboticsPrograms
  .filter((program) => !program.comingSoon && program.weeklySchedules?.length)
  .map((program) => {
    const slots = program.weeklySchedules!;
    const sharesOneTime = slots.every(
      (slot) => slot.startTime === slots[0].startTime && slot.endTime === slots[0].endTime
    );
    return {
      id: program.id,
      title: program.title,
      ageRange: program.ageRange.replace("-", "\u2013"),
      durationMin: program.durationMin,
      timeLabel: sharesOneTime ? formatTimeRange(slots[0].startTime, slots[0].endTime) : null,
      days: slots.map((slot) => slot.weekday),
      slots: slots.map((slot) => ({
        weekday: slot.weekday,
        time: formatTimeRange(slot.startTime, slot.endTime),
      })),
    };
  });

const additionalOfferings = [
  // Camps & PA Days hidden for now — re-enable by uncommenting when ready to promote again.
  // {
  //   title: "Camps & PA Days",
  //   description: "STEM-filled camps and PA day workshops for school breaks.",
  //   href: SUMMER_CAMP_BOOKING_URL,
  //   accent: YE_BLUE,
  //   image: "/images/young-engineers/summer-camps-v2.png",
  // },
  {
    title: "Birthday Parties",
    description: "Hands-on robotics birthday parties that keep every guest building.",
    href: BIRTHDAY_PARTY_PATH,
    accent: YE_RED,
    image: "/images/young-engineers/birthday-party-v2.png",
  },
  {
    title: "School Programs",
    description: "After-school robotics programs and workshops for your school.",
    href: SCHOOL_PROGRAM_BOOKING_URL,
    accent: YE_AMBER,
    image: "/images/young-engineers/school-programs-v3.png",
  },
];

const faqs = [
  {
    q: "How much do classes cost?",
    a: "Rates depend on the program and how many classes you enrol for. Smartivo (60 minutes) is $30/class for the 10-class Regular package, $26/class for the 20-class Builder package and $24/class for the 36-class Engineer package. Bricks Challenge and Algo Play (75 minutes) are $32, $28 and $25/class for the same three packages. Pricing is per child and applicable taxes are extra — see the pricing section above for each program's totals.",
  },
  {
    q: "Do I have to pay for the whole package up front?",
    a: "Yes — monthly billing is how robotics tuition works. The package total is averaged across the real months your child's schedule runs, so the amount stays the same each month even when a month has fewer class dates because of holidays or school breaks. No payment is collected when you request a spot.",
  },
  {
    q: "Does my child need previous robotics experience?",
    a: "No. Programs are designed to welcome first-time builders as well as returning students, with activities that scale to each child's skill level.",
  },
  {
    q: "What ages can participate?",
    a: "Age ranges vary by program — check the age range and weekly schedule before requesting a spot.",
  },
  {
    q: "Are all building materials provided?",
    a: "Yes, all robotics building materials are provided as part of the program.",
  },
  {
    q: "Does my child need to bring a tablet?",
    a: "Any device requirements will be listed on the specific program page. Most in-person classes provide the equipment children need on-site.",
  },
  {
    q: "Do these programs teach artificial intelligence or machine learning?",
    a: "Selected Young Engineers coding activities now introduce AI and machine learning through GoAlgo. Students can train and test gesture-recognition tools, connect detected gestures to their code and use AI Chat for coding support. Availability varies by program and lesson.",
  },
  {
    q: "Where are classes held?",
    a: "Class locations are listed with each published weekly schedule and confirmed when we review your request.",
  },
  {
    q: "What happens if my child misses a class?",
    a: "Please contact us as soon as you know about a missed class so we can explain the options for your child's weekly program.",
  },
  {
    q: "What are the cancellation and refund policies?",
    a: "Cancellation, refund and payment terms are provided when we offer your child a place. No payment is due when you first request a spot.",
  },
  {
    q: "Are birthday parties and school workshops available?",
    a: "Yes — see the additional offerings below for STEM birthday parties and school/community programs.",
  },
];

export default async function RoboticsPage() {
  const catalogData = await getCatalogServer({ category: ROBOTICS_CATEGORY, activeOnly: true });

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: siteUrl },
    { name: "Robotics & Coding", url: `${siteUrl}/robotics` },
  ]);

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Young Engineers Robotics & Coding",
    description:
      "Hands-on Young Engineers robotics, engineering and coding programs that build computational thinking and AI-ready foundations, offered locally by Kriana Tutoring.",
    provider: { "@id": localBusinessSchema["@id"] },
    areaServed: ["Kanata", "Stittsville", "Ottawa"],
    serviceType: "Robotics and coding classes for children",
    url: `${siteUrl}/robotics`,
  };

  // Course schema for the published weekly programs — keeps the recurring
  // day/time batches in structured data in sync with the same
  // licensedRoboticsPrograms constant that drives the on-page schedule badge
  // (lib/robotics-content.ts). One CourseInstance per batch.
  const courseSchemas = licensedRoboticsPrograms
    .filter((program) => program.weeklySchedules?.length)
    .map((program) => ({
      "@context": "https://schema.org",
      "@type": "Course",
      name: `${program.title} — Young Engineers at Kriana Tutoring`,
      description: program.description,
      provider: { "@id": localBusinessSchema["@id"] },
      hasCourseInstance: program.weeklySchedules!.map((batch) => ({
        "@type": "CourseInstance",
        // Slots no longer carry a "Batch N" label — the weekday identifies
        // the instance now (see the weeklySchedules note in robotics-content).
        name: `${program.title} — ${batch.weekday}`,
        courseMode: "Onsite",
        courseSchedule: {
          "@type": "Schedule",
          repeatFrequency: "P1W",
          byDay: `https://schema.org/${batch.weekday}`,
          startTime: batch.startTime,
          endTime: batch.endTime,
        },
      })),
    }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(serviceSchema) }} />
      {courseSchemas.map((schema) => (
        <script
          key={schema.name}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(schema) }}
        />
      ))}

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
                Young Engineers at Kriana
              </p>
              <h1 className="mt-3 text-balance text-4xl font-black leading-[1.03] text-[#ED174B] sm:text-5xl">
                Build. Code. Think Ahead.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-700 sm:text-lg">
                Hands-on engineering, robotics and coding programs that build the logic, creativity and
                problem-solving skills children need for an AI-powered future.
              </p>
              <p className="mt-4 inline-flex rounded-full border border-[#0083CB]/25 bg-[#0083CB]/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#0A2D5A]">
                Coding · Robotics · AI-Ready Foundations
              </p>
              <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[#0A2D5A]">
                <MapPinIcon className="h-4 w-4 shrink-0 text-[#ED174B]" />
                Serving Kanata &amp; Stittsville
              </p>
              <div className="mt-7">
                <RoboticsCtaButtons variant="light" mode="discovery" initialData={catalogData} />
              </div>
            </div>
          </div>
        </section>

        <RoboticsSectionNav />

        {/* Young Engineers mission band */}
        <section className="bg-[#0083CB] px-6 py-10 text-white sm:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-lg font-semibold leading-8 sm:text-xl">
              Children learn engineering and technology by building exclusive models, testing their ideas and solving
              real challenges—developing confidence and practical skills they can carry into everyday life.
            </p>
          </div>
        </section>

        {/* 4. Program cards + upcoming classes / launch list */}
        <section id="programs" className="relative scroll-mt-20 overflow-hidden bg-slate-50 px-6 py-16 sm:px-10">
          <div className="relative mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold text-[#0A2D5A] sm:text-3xl">Find the Right Engineering Challenge</h2>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              Explore hands-on programs that develop age-appropriate coding, engineering and future-ready thinking.
            </p>
            <div className="mt-10">
              <RoboticsPrograms initialData={catalogData} />
            </div>
          </div>
        </section>

        <RoboticsPricingSection />

        {/* $10 demo — the lowest-commitment way in, placed right after the
            price so a 20- or 36-class package never reads as the only option.
            /demo tells the reader whether a date is on sale or whether to
            join the waitlist, so this band never claims one or the other. */}
        <section id="demo" className="scroll-mt-20 bg-[#0A2D5A] px-6 py-16 text-white sm:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#F2A100]">Try it first</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Not sure which program is right?</h2>
            <p className="mt-4 text-lg leading-8 text-white/85">
              Book a hands-on demo class for <span className="font-black text-[#F2A100]">$10</span> and let your child
              try it before you commit. Your $10 is credited toward tuition when they enrol.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F2A100] px-8 py-3.5 text-sm font-black uppercase tracking-[0.18em] text-[#0A2D5A] shadow-[0_8px_28px_rgba(242,161,0,0.35)] transition-all duration-300 hover:scale-[1.03]"
              >
                Book a $10 Demo
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-white backdrop-blur transition-all duration-300 hover:bg-white/20"
              >
                See Pricing
              </a>
            </div>
            <p className="mt-4 text-xs leading-5 text-white/60">
              If no demo date is currently open, you can join the waitlist for the next one.
            </p>
          </div>
        </section>

        {/* Weekly schedule — answers "when?" immediately after "how much?".
            Driven by the same licensedRoboticsPrograms constant as the
            program cards and the Course structured data, so all three can
            never disagree. Real published offerings (with actual class dates
            and location) are shown on the program cards above. */}
        <section id="schedule" className="scroll-mt-20 bg-slate-50 px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#0083CB]">Weekly schedule</p>
              <h2 className="mt-3 text-3xl font-bold text-[#0A2D5A] sm:text-4xl">When Classes Run</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Classes run weekly in the Beaverbrook area of Kanata. Exact dates and locations are confirmed with
                each published schedule.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {weeklyScheduleCards.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-black text-[#0A2D5A]">{entry.title}</h3>
                  <p className="mt-0.5 text-sm font-semibold text-slate-500">
                    Ages {entry.ageRange} · {entry.durationMin} min
                  </p>
                  {entry.timeLabel ? (
                    <>
                      <p className="mt-4 text-xl font-black text-[#0A2D5A]">{entry.timeLabel}</p>
                      <ul className="mt-3 flex flex-wrap gap-2" aria-label={`${entry.title} class days`}>
                        {entry.days.map((day) => (
                          <li
                            key={day}
                            className="rounded-full bg-[#0083CB]/10 px-3 py-1 text-xs font-bold text-[#0083CB]"
                          >
                            {day}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {entry.slots.map((slot) => (
                        <li key={slot.weekday} className="flex flex-wrap items-baseline gap-x-1.5 text-sm text-slate-600">
                          <span className="font-bold text-slate-800">{slot.weekday}:</span>
                          <span>{slot.time}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-sm text-slate-500">
              Days or times don&apos;t work?{" "}
              <Link href="/contact#consultation-form" className="font-semibold text-[#0c6162] hover:underline">
                Tell us what does.
              </Link>
            </p>
          </div>
        </section>

        {/* See it in action — after the conversion block (programs,
            price, demo, schedule), which is what a parent arriving from
            social is actually looking for first. */}
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

        {/* New GoAlgo AI and machine-learning tools */}
        <section className="relative overflow-hidden bg-[#0A2D5A] px-6 py-16 text-white sm:px-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, rgba(255,255,255,0.9) 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div>
              <span className="inline-flex rounded-full bg-[#F2A100] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#0A2D5A]">
                New in coding
              </span>
              <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
                AI &amp; Machine Learning Are Now Live
              </h2>
              <p className="mt-5 text-base leading-7 text-white/80 sm:text-lg">
                In selected Young Engineers coding activities, students can train AI to recognize body and facial
                gestures, turn those gestures into events and connect them directly to their own code.
              </p>
              <p className="mt-5 text-lg font-black text-[#F2A100]">
                The AI detects. The code reacts. The student makes it happen.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <h3 className="font-bold">Machine Learning in Action</h3>
                  <p className="mt-1 text-sm leading-6 text-white/75">
                    Train and test gesture recognition, then use its output in student-created programs.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <h3 className="font-bold">AI-Assisted Coding</h3>
                  <p className="mt-1 text-sm leading-6 text-white/75">
                    GoAlgo AI Chat supports students with commands, events and programming logic.
                  </p>
                </div>
              </div>

              <div className="mt-7">
                <RoboticsCtaButtons variant="dark" initialData={catalogData} />
              </div>
              <p className="mt-4 text-xs leading-5 text-white/60">
                AI features are included in selected lessons. Program availability may vary.
              </p>
            </div>

            <div>
              <div className="relative aspect-video overflow-hidden rounded-[1.75rem] border border-white/15 bg-black shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
                <video
                  className="h-full w-full"
                  controls
                  playsInline
                  preload="metadata"
                  aria-label="AI and machine learning in Young Engineers coding programs"
                >
                  <source src="/videos/goalgo-ai-machine-learning.mp4" type="video/mp4" />
                  Your browser does not support embedded video.
                </video>
              </div>
              <p className="mt-3 text-center text-xs text-white/60">
                Watch the new Young Engineers AI tools in action.
              </p>
            </div>
          </div>
        </section>

        {/* Future-ready learning journey */}
        <section className="relative overflow-hidden bg-white px-6 py-16 sm:px-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,131,203,0.7) 1px,transparent 1px),linear-gradient(90deg,rgba(0,131,203,0.7) 1px,transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#0083CB]">AI-ready foundations</p>
              <h2 className="mt-3 text-2xl font-semibold text-[#0A2D5A] sm:text-3xl">
                From Hands-On Building to Future-Ready Thinking
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                AI-ready thinking starts with learning how to break challenges into steps, recognize patterns, test
                ideas, find errors and improve solutions. Young Engineers develops these foundations through
                age-appropriate building and coding, with AI and machine-learning tools appearing in selected lessons.
              </p>
            </div>

            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {futureReadyJourney.map((stage, index) => (
                <li
                  key={stage.title}
                  className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0083CB] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-base font-black text-[#0A2D5A]">{stage.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{stage.description}</p>
                  {index < futureReadyJourney.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-[#F2A100] px-1.5 py-0.5 text-sm font-black text-white lg:block"
                    >
                      →
                    </span>
                  )}
                </li>
              ))}
            </ol>

            <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-2" aria-label="Future-ready skills">
              {["Computational Thinking", "Algorithmic Reasoning", "Coding Logic", "Engineering Design", "Debugging", "Pattern Recognition", "Creative Problem-Solving"].map((skill) => (
                <span key={skill} className="rounded-full bg-[#0A2D5A] px-3 py-1.5 text-xs font-bold text-white">
                  {skill}
                </span>
              ))}
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
        <section id="faq" className="scroll-mt-20 bg-slate-50 px-6 py-16 sm:px-10">
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

        {/* Final CTA */}
        <section className="bg-white px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-slate-50 px-6 py-12 text-center shadow-sm sm:px-10">
            <h2 className="text-2xl font-bold text-[#0A2D5A] sm:text-3xl">Ready to get started?</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Request a spot in a weekly program, or try a class for $10 first. No payment is collected when you
              request a spot.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={ROBOTICS_BOOKING_URL}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0c6162] px-8 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_8px_32px_rgba(12,97,98,0.45)] transition-all duration-300 hover:scale-[1.03] hover:bg-[#0a5051]"
              >
                Request a Spot
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm transition-all duration-300 hover:border-brand-sky hover:text-brand-sky"
              >
                Book a $10 Demo
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
