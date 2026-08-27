import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Footer } from "../../components/footer";
import { CalendarStarIcon, CheckIcon, ClipboardIcon, GearIcon, UsersIcon } from "../../components/icons";
import { ROBOTICS_PATH } from "../../lib/site-links";
import { applyProgramDiscount, formatPrice } from "../../lib/booking";
import { breadcrumbSchema, localBusinessSchema, siteUrl, toJsonLd } from "../../lib/seo";
import { getAdminDb } from "../../netlify/functions/_lib/firebase-admin.js";
import { buildCatalog } from "../api/public-catalog/_lib";
import { BirthdayAvailabilityForm } from "./BirthdayAvailabilityForm";

// Marketing copy and structure are stable and evergreen; only price/promotion
// facts come from Firestore (via the public catalog), so the page never fails
// to render just because the catalogue is briefly unavailable.
const FALLBACK_REGULAR_CENTS = 24900;
const FALLBACK_LAUNCH_CENTS = 19900;
const FALLBACK_PROMO_LABEL = "Limited-Time Launch Offer";

// Matches CACHE_HEADERS on the public-catalog API routes this page's pricing
// is sourced from, so a staff price/promo edit in the portal reaches this
// page on the same timeline as everywhere else, without going fully dynamic.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Robotics Birthday Parties in Kanata | Young Engineers",
  description:
    "Book a 75-minute Young Engineers robotics birthday experience in Kanata or Stittsville for up to eight children. Launch price $199 plus tax.",
  alternates: { canonical: `${siteUrl}/birthday` },
  openGraph: {
    title: "Robotics Birthday Parties in Kanata | Young Engineers",
    description:
      "Book a 75-minute Young Engineers robotics birthday experience in Kanata or Stittsville for up to eight children. Launch price $199 plus tax.",
    url: `${siteUrl}/birthday`,
    type: "website",
  },
};

async function getBirthdayProgram() {
  try {
    const db = getAdminDb();
    const { programs } = await buildCatalog(db, "Birthday Party");
    return programs.find((p: any) => p.partnerName === "Young Engineers") || programs[0] || null;
  } catch (error) {
    console.error("Failed to load birthday program pricing:", error);
    return null;
  }
}

const included = [
  "75-minute private robotics and engineering session",
  "Up to 8 children, including the birthday child",
  "Young Engineers instructor",
  "Building kits and program materials",
  "Guided model building, testing, and engineering challenge",
  "Setup and cleanup of robotics activity materials",
  "Local travel within Kanata and Stittsville",
];

const parentsProvide = [
  "Suitable indoor venue with tables and chairs",
  "Food, drinks, and birthday cake",
  "Decorations",
  "General child supervision",
  "Entertainment before or after the robotics activity",
  "Cleanup of food, decorations, and the venue",
];

const howItWorks = [
  { title: "Build", description: "Teams work together to construct a motorized model from building kits." },
  { title: "Learn", description: "An instructor guides the group through how the model's mechanics work." },
  { title: "Test", description: "Kids test their build, troubleshoot, and make improvements." },
  { title: "Challenge", description: "The group completes an engaging engineering challenge together." },
];

const faqs = [
  {
    q: "Group Size",
    a: "The package includes up to 8 participating children, including the birthday child.",
  },
  {
    q: "Venue",
    a: "The parent provides a suitable indoor venue with enough table and chair space.",
  },
  {
    q: "Adult Supervision",
    a: "A parent or responsible adult must remain present throughout the session.",
  },
  {
    q: "Timing",
    a: "The robotics activity runs for 75 minutes and begins at the confirmed start time. A late start may reduce activity time.",
  },
  {
    q: "Booking",
    a: "Submitting the form requests availability only. The date is confirmed only after staff approval and payment.",
  },
  {
    q: "Travel",
    a: "Local travel within Kanata and Stittsville is included. Additional travel charges may apply outside the regular service area and must be approved before confirmation.",
  },
  {
    q: "Taxes",
    a: "Applicable taxes will be added to the final invoice or checkout amount.",
  },
  {
    q: "Cancellation",
    a: "Cancellation, refund and payment terms are provided when we approve your requested date. No payment is due when you first request availability.",
  },
];

export default async function BirthdayPage() {
  const program = await getBirthdayProgram();
  const regularCents = program ? Number(program.price) || FALLBACK_REGULAR_CENTS : FALLBACK_REGULAR_CENTS;
  const discount = program ? applyProgramDiscount(regularCents, program) : null;
  const launchCents = discount?.active ? discount.finalCents : FALLBACK_LAUNCH_CENTS;
  const promoLabel = discount?.active ? discount.label : FALLBACK_PROMO_LABEL;
  const programId = program?.id || "";

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: siteUrl },
    { name: "Robotics & Coding", url: `${siteUrl}/robotics` },
    { name: "Birthday Parties", url: `${siteUrl}/birthday` },
  ]);

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Young Engineers STEM Birthday Experience",
    description:
      "A 75-minute instructor-led robotics and engineering activity for birthday parties, for up to 8 children ages 6-12, offered locally by Kriana Tutoring.",
    provider: { "@id": localBusinessSchema["@id"] },
    areaServed: ["Kanata", "Stittsville", "Ottawa"],
    serviceType: "Robotics birthday party",
    url: `${siteUrl}/birthday`,
    offers: {
      "@type": "Offer",
      price: (launchCents / 100).toFixed(2),
      priceCurrency: "CAD",
      url: `${siteUrl}/birthday`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(serviceSchema) }} />

      <main className="min-h-screen bg-white text-slate-900">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-6xl px-6 pt-6 sm:px-10">
          <nav aria-label="Breadcrumb" className="text-xs font-semibold text-slate-500">
            <Link href="/" className="hover:text-brand-sky">Home</Link>
            <span className="mx-2 text-slate-300">/</span>
            <Link href={ROBOTICS_PATH} className="hover:text-brand-sky">Robotics &amp; Coding</Link>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-slate-700">Birthday Parties</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-12 sm:px-10 lg:grid-cols-2 lg:py-16">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#0083CB]">
                Young Engineers &middot; Birthday Experience
              </p>
              <h1 className="mt-3 text-balance text-4xl font-black leading-[1.05] text-[#0A2D5A] sm:text-5xl">
                Young Engineers STEM Birthday Experience
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-700 sm:text-lg">
                Celebrate your child&apos;s birthday with a hands-on robotics and engineering experience. Children
                work in teams to build a motorized model, explore how it works, and complete an engaging
                engineering challenge&mdash;all guided by a Young Engineers instructor.
              </p>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ED174B]">{promoLabel}</p>
                <p className="mt-1.5 flex flex-wrap items-baseline gap-2">
                  <span className="sr-only">
                    Regular price {formatPrice(regularCents)} plus tax. Now {formatPrice(launchCents)} plus tax, launch price.
                  </span>
                  <span aria-hidden="true" className="text-base font-semibold text-slate-400 line-through">
                    {formatPrice(regularCents)}
                  </span>
                  <span aria-hidden="true" className="text-3xl font-black text-[#0A2D5A]">
                    {formatPrice(launchCents)}
                  </span>
                  <span aria-hidden="true" className="text-sm font-semibold text-slate-500">+ tax</span>
                </p>
              </div>

              <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-[#0A2D5A]">
                <li className="flex items-center gap-1.5">
                  <UsersIcon className="h-4 w-4 shrink-0 text-[#ED174B]" />
                  Up to 8 children &middot; 75 minutes
                </li>
                <li className="flex items-center gap-1.5">
                  <CalendarStarIcon className="h-4 w-4 shrink-0 text-[#ED174B]" />
                  Recommended for ages 6&ndash;12
                </li>
              </ul>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="#availability-form"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#0c6162] px-7 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_8px_32px_rgba(12,97,98,0.35)] transition-all duration-300 motion-safe:hover:scale-[1.03] hover:bg-[#0a5051]"
                >
                  Check Birthday Availability
                </a>
                <Link
                  href={ROBOTICS_PATH}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm transition-all duration-300 hover:border-[#0083CB] hover:text-[#0083CB]"
                >
                  Explore Robotics Programs
                </Link>
              </div>
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-slate-200 shadow-[0_26px_70px_rgba(10,45,90,0.15)]">
              <Image
                src="/images/young-engineers/robotics-birthday-experience-models-v4.png"
                alt="Young Engineers birthday celebration illustration with a robotics model, balloons, confetti, and two children in party hats"
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* Birthday Parties intro */}
        <section className="bg-[#0A2D5A] px-6 py-14 text-white sm:px-10 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Birthday Parties</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/90">
                Every birthday is a milestone, an annual reminder of growth, discovery, and the adventures that lie
                ahead. For your child&apos;s next birthday, give them a day of collaborative discovery. Your child
                can choose one of our innovative models and, together with their friends, embark on a building
                journey. With our specialized kits, every child becomes a creator, an innovator, and a team player.
                Birthdays has never been this memorable!
              </p>
            </div>
            <div className="relative mx-auto aspect-[650/459] w-full max-w-md">
              <Image
                src="/images/young-engineers/birthday-collaborative-discovery-model.png"
                alt="A colorful motorized LEGO model car built from a Young Engineers robotics kit"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </section>

        {/* Visible clarification — not hidden in the FAQ */}
        <section className="bg-[#0A2D5A] px-6 py-6 text-white sm:px-10 border-t border-white/10">
          <p className="mx-auto max-w-3xl text-center text-sm font-semibold leading-6 sm:text-base">
            This package includes the Young Engineers robotics activity only. It does not include venue rental,
            food, decorations, or full-party hosting.
          </p>
        </section>

        {/* What's Included / Parents Provide */}
        <section className="bg-slate-50 px-6 py-16 sm:px-10">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-[#0A2D5A]">
                <GearIcon className="h-5 w-5 shrink-0 text-[#ED174B]" aria-hidden="true" />
                What&apos;s Included
              </h2>
              <ul className="mt-4 space-y-3">
                {included.map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-[#0A2D5A]">
                <ClipboardIcon className="h-5 w-5 shrink-0 text-[#0083CB]" aria-hidden="true" />
                Parents Provide
              </h2>
              <ul className="mt-4 space-y-3">
                {parentsProvide.map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700">
                    <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0083CB]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-white px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-semibold text-[#0A2D5A] sm:text-3xl">How It Works</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-4">
              {howItWorks.map((step, i) => (
                <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#ED174B] text-sm font-black text-white">
                    {i + 1}
                  </div>
                  <h3 className="mt-3 text-base font-bold text-[#0A2D5A]">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Keep Building After the Party */}
        <section className="bg-[#0083CB] px-6 py-14 text-center text-white sm:px-10">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold sm:text-3xl">Keep Building After the Party</h2>
            <p className="mt-3 text-base leading-7 text-white/90">
              Guests who enjoy the birthday experience can explore our regular Young Engineers robotics classes,
              workshops, and camps in Kanata.
            </p>
            <Link
              href={ROBOTICS_PATH}
              className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-[#0083CB] shadow-sm transition-all duration-300 motion-safe:hover:scale-[1.03]"
            >
              Explore Robotics Programs
            </Link>
          </div>
        </section>

        {/* Final CTA + form */}
        <section id="availability-form" className="bg-white px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-[#0A2D5A] sm:text-3xl">Check Birthday Availability</h2>
              <p className="mt-3 text-base text-slate-600">
                Tell us about your preferred date and we&apos;ll follow up with availability and next steps. No
                payment is required to submit a request.
              </p>
            </div>
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
              <BirthdayAvailabilityForm programId={programId} />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-slate-50 px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold text-[#0A2D5A] sm:text-3xl">Frequently Asked Questions</h2>
            <div className="mt-8 space-y-3">
              {faqs.map(faq => (
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
