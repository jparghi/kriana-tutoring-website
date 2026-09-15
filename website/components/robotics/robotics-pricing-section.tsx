import Link from "next/link";

import { getPubliclyVisiblePackages } from "../../lib/robotics-packages.js";
import { licensedRoboticsPrograms } from "../../lib/robotics-content";

// The /robotics rate card. Prices come straight from the canonical package
// catalogue (lib/robotics-packages.js) — never hardcoded here — so this page
// can never drift from what the booking flow actually charges.
//
// Only the three programs that are actually on sale are priced: a
// coming-soon program has no published rate card, and inventing one would
// advertise a price nobody can book.
const PRICED_PROGRAM_IDS = ["smartivo", "bricks-challenge", "algo-play"];

type Pkg = {
  id: string;
  name: string;
  classCount: number;
  perClassCents: number;
  regularSubtotalCents: number;
  badge: string | null;
};

// Presentation copy for each tier — deliberately not in
// lib/robotics-packages.js, which holds pricing/business data only.
const TIER_BLURBS: Record<string, string> = {
  regular: "Shortest commitment · best for trying a program",
  builder: "A structured learning path at a lower per-class rate",
  engineer: "The longest journey at the lowest per-class rate",
};

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

/** Every priced program paired with its own rate card. Resolved by licensed
 * slug, which lib/robotics-packages.js keys alongside the real Firestore id,
 * so the 60-minute Smartivo rates can't be confused with the 75-minute ones. */
function pricedPrograms() {
  return PRICED_PROGRAM_IDS.map((id) => {
    const program = licensedRoboticsPrograms.find((item) => item.id === id)!;
    return { program, packages: getPubliclyVisiblePackages(id) as Pkg[] };
  });
}

function TierHeading({ pkg }: { pkg: Pkg }) {
  const isFeatured = pkg.id === "engineer";
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-black uppercase tracking-[0.14em] text-[#0A2D5A]">{pkg.name}</span>
        {pkg.badge && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white ${
              isFeatured ? "bg-[#0083CB]" : "bg-[#F2A100]"
            }`}
          >
            {pkg.badge}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-xs font-bold text-slate-500">{pkg.classCount} classes</p>
    </div>
  );
}

/** One program's three tiers. Deliberately shows the per-class rate and the
 * saving, but NOT the package total: a four-figure number reads as a scary
 * lump sum in a browsing context, and tuition is billed monthly anyway. The
 * total is never hidden from someone actually committing — it's shown on the
 * register page's review step before anything is submitted. */
function ProgramRateCard({
  program,
  packages,
}: {
  program: (typeof licensedRoboticsPrograms)[number];
  packages: Pkg[];
}) {
  const regular = packages.find((pkg) => pkg.id === "regular");

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ED174B]">
          {program.marketingEyebrow}
        </p>
        <h3 className="mt-1 text-xl font-black text-[#0A2D5A]">{program.title}</h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Ages {program.ageRange.replace("-", "–")} · {program.durationMin} min
        </p>
      </div>

      <ul className="divide-y divide-slate-100">
        {packages.map((pkg) => {
          const savingsPerClassCents = regular ? regular.perClassCents - pkg.perClassCents : 0;
          const totalSavingsCents = savingsPerClassCents * pkg.classCount;
          const isFeatured = pkg.id === "engineer";

          return (
            <li
              key={pkg.id}
              className={`flex flex-wrap items-center justify-between gap-4 px-6 py-5 ${
                isFeatured ? "bg-[#0083CB]/[0.04]" : ""
              }`}
            >
              <TierHeading pkg={pkg} />
              <div className="text-right">
                <p className="text-2xl font-black leading-none text-[#0A2D5A]">
                  {dollars(pkg.perClassCents)}
                  <span className="ml-1 text-xs font-semibold text-slate-500">/class + tax</span>
                </p>
                {totalSavingsCents > 0 ? (
                  <p className="mt-1 text-xs font-bold text-emerald-600">
                    Save {dollars(totalSavingsCents)}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">Standard rate</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="px-6 pb-6 pt-5">
        <Link
          href={`/booking/${program.id}`}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#0c6162] px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#0a5051]"
        >
          Choose {program.title}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

export function RoboticsPricingSection() {
  const programs = pricedPrograms();
  // Every program offers the same three tiers, so the explainer strip can be
  // driven off the first one's catalogue.
  const tiers = programs[0].packages;

  return (
    <section id="pricing" className="scroll-mt-20 bg-white px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ED174B]">Pricing</p>
          <h2 className="mt-3 text-3xl font-bold text-[#0A2D5A] sm:text-4xl">
            Simple, Flexible Robotics Pricing
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Choose the program that fits your child, then choose how long you want to enrol. The longer the
            learning journey, the lower the per-class rate.
          </p>
        </div>

        {/* Step 2 of the parent's decision: how long do you want to enrol? */}
        <ol className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
          {tiers.map((pkg) => {
            const isFeatured = pkg.id === "engineer";
            return (
              <li
                key={pkg.id}
                className={`rounded-2xl border p-5 ${
                  isFeatured ? "border-[#0083CB] bg-[#0083CB]/[0.04]" : "border-slate-200 bg-white"
                }`}
              >
                <TierHeading pkg={pkg} />
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{TIER_BLURBS[pkg.id]}</p>
              </li>
            );
          })}
        </ol>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {programs.map(({ program, packages }) => (
            <ProgramRateCard key={program.id} program={program} packages={packages} />
          ))}
        </div>

        <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 sm:p-7">
          <h3 className="text-sm font-bold text-[#0A2D5A]">Payment &amp; what&apos;s included</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Pricing is per child and applicable taxes are extra. Tuition is billed monthly: the package total is
            averaged across the real months your child&apos;s schedule runs, so the monthly amount stays the same
            even when a month has fewer class dates because of holidays or school breaks. All building materials
            are provided and kits stay at the learning centre. No payment is collected when you request a spot.
          </p>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Not sure which learning path is right for your child?{" "}
          <Link href="/contact#consultation-form" className="font-semibold text-[#0c6162] hover:underline">
            We&apos;re happy to help.
          </Link>
        </p>
      </div>
    </section>
  );
}
