"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getPubliclyVisiblePackages } from "../../lib/robotics-packages.js";
import { getPrograms } from "../../lib/booking";

const ROBOTICS_CATEGORY = "Robotics";

const PACKAGE_LOGOS: Record<string, string> = {
  builder: "/images/robotics/packages/builder-package-icon.png",
  engineer: "/images/robotics/packages/engineer-package-icon.png",
};

const HIGHLIGHTS = [
  "Instructor-led classes designed for each program and age group",
  "Small class sizes",
  "Hands-on engineering activities",
  "LEGO®-style building blocks",
  "A new model or engineering concept in each class",
  "A balanced mix of hands-on building and age-appropriate coding; device use varies by program",
  "Building kits stay at the learning centre and are not taken home",
];

function formatDollars(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export function PackagesPricingSection({ programId }: { programId: string }) {
  const [promoLabel, setPromoLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadPromo() {
      try {
        const programs = await getPrograms({ activeOnly: true });
        const promoted = programs.find(
          (p: any) => p.category === ROBOTICS_CATEGORY && p.discountActive && p.discountLabel
        );
        if (!cancelled) setPromoLabel(promoted?.discountLabel ?? null);
      } catch {
        // Promo banner is a nice-to-have — pricing itself never depends on it.
      }
    }
    loadPromo();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="packages" className="bg-white px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ED174B]">Class Packages</p>
          {promoLabel && (
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
              🏷️ {promoLabel}
            </span>
          )}
          <h2 className="mt-3 text-2xl font-semibold text-[#0A2D5A] sm:text-3xl">Choose Your Robotics Package</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Classes are offered in the Beaverbrook area of Kanata. Each package is a complete class bundle — pick the
            size that fits your child's schedule.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {(() => {
            const packages = getPubliclyVisiblePackages(programId);
            const regularPkg = packages.find((p: any) => p.id === "regular");

            return packages.map((pkg: any) => {
              const isRegular = pkg.planType === "rolling_monthly";
              // Engineer carries the "Best Value" badge and gets the
              // stronger/featured treatment — color and border rather than
              // scaling, so mobile stacking is unaffected.
              const isFeatured = pkg.id === "engineer";
              const savingsPerClassCents = regularPkg && !isRegular ? regularPkg.perClassCents - pkg.perClassCents : 0;

              return (
                <div
                  key={pkg.id}
                  className={`relative flex flex-col rounded-[1.75rem] border bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)] ${
                    isFeatured ? "border-[#0083CB] ring-2 ring-[#0083CB]/30" : "border-slate-200"
                  }`}
                >
                  {pkg.badge && (
                    <span
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-sm ${
                        isFeatured ? "bg-[#0083CB]" : "bg-[#F2A100]"
                      }`}
                    >
                      {pkg.badge}
                    </span>
                  )}

                  {PACKAGE_LOGOS[pkg.id] && (
                    <div className="flex h-28 items-center justify-center">
                      <Image
                        src={PACKAGE_LOGOS[pkg.id]}
                        alt={`${pkg.name} robotics package`}
                        width={200}
                        height={170}
                        className="h-28 w-auto object-contain"
                      />
                    </div>
                  )}

                  <h3 className="mt-2 text-xl font-black text-[#0A2D5A]">{pkg.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {isRegular ? "Maximum Flexibility" : `${pkg.classCount}-Class Learning Path`}
                  </p>

                  {isRegular ? (
                    <>
                      <div className="mt-5 flex items-baseline gap-2">
                        <span className="text-4xl font-black text-[#0A2D5A]">{formatDollars(pkg.perClassCents)}</span>
                        <span className="text-sm font-semibold text-slate-500">/class + tax</span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-600">No long-term commitment</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Billed for classes actually scheduled that month.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="mt-5 flex items-baseline gap-2">
                        <span className="text-4xl font-black text-[#0A2D5A]">{formatDollars(pkg.perClassCents)}</span>
                        <span className="text-sm font-semibold text-slate-500">/class</span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-600">
                        Minimum commitment: {pkg.minimumClassCommitment} classes
                      </p>
                      {savingsPerClassCents > 0 && (
                        <p className="mt-0.5 text-xs font-semibold text-emerald-600">
                          Save {formatDollars(savingsPerClassCents)}/class compared with Regular
                        </p>
                      )}
                      <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                        Monthly tuition calculated after you choose a schedule
                      </p>
                      {isFeatured && (
                        <p className="mt-1 text-xs font-semibold text-[#0083CB]">Lowest per-class rate</p>
                      )}
                    </>
                  )}

                  <Link
                    href={`/booking?category=Robotics&package=${pkg.id}`}
                    className="mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.02]"
                    style={{ backgroundColor: isFeatured ? "#0083CB" : "#0c6162" }}
                  >
                    Choose {pkg.name}
                  </Link>
                </div>
              );
            });
          })()}
        </div>

        <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 sm:p-7">
          <h3 className="text-sm font-bold text-[#0A2D5A]">How monthly tuition works</h3>
          <p className="mt-1.5 text-sm text-slate-600">
            Classes are generally scheduled weekly, but the number of class dates may vary from month to month due to
            holidays, school breaks and the calendar. Builder and Engineer tuition is averaged across the selected
            learning path, giving families predictable monthly payments while ensuring students receive every class
            included in their program. Regular has no learning-path commitment, so its monthly amount is billed for
            whatever classes are actually held that month.
          </p>
        </div>

        <div className="mt-12 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-7 sm:p-9">
          <h3 className="text-base font-bold text-[#0A2D5A]">What every class includes</h3>
          <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {HIGHLIGHTS.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
                <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0083CB]" />
                {point}
              </li>
            ))}
          </ul>
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
