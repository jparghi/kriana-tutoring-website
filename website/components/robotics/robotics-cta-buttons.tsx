"use client";

import Link from "next/link";
import { useRoboticsAvailability, type CatalogData } from "./robotics-programs";
import { ROBOTICS_BOOKING_URL } from "../../lib/site-links";

const VARIANTS = {
  light: {
    primary:
      "inline-flex items-center justify-center gap-2 rounded-full bg-[#0c6162] px-7 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_8px_32px_rgba(12,97,98,0.45)] transition-all duration-300 hover:scale-[1.03] hover:bg-[#0a5051]",
    secondary:
      "inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm backdrop-blur transition-all duration-300 hover:border-brand-sky hover:text-brand-sky",
  },
  dark: {
    primary:
      "inline-flex items-center justify-center gap-2 rounded-full bg-[#0c6162] px-8 py-3.5 text-sm font-bold uppercase tracking-[0.22em] text-white shadow-[0_8px_28px_rgba(12,97,98,0.4)] transition-all duration-300 hover:scale-[1.03] hover:bg-[#0a5051]",
    secondary:
      "inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.22em] text-white backdrop-blur transition-all duration-300 hover:bg-white/20",
  },
};

export function RoboticsCtaButtons({
  variant = "light",
  mode = "availability",
  initialData,
}: {
  variant?: "light" | "dark";
  /** "discovery" sends the reader straight down the page — programs, then
   * price — which is the order a parent actually decides in, and needs no
   * availability data at all. "availability" (the default) links out to the
   * live booking catalogue with schedule/waitlist-aware wording. */
  mode?: "availability" | "discovery";
  initialData?: CatalogData;
}) {
  const { hasPublishedSchedule, hasOpenRequests, hasOpenWaitlist, loading } = useRoboticsAvailability(initialData);
  const styles = VARIANTS[variant];

  // A parent landing from social asks "what is it? → is it for my child? →
  // how much?" — so the hero answers the first two and then points at the
  // price, rather than sending them off to a schedule listing.
  if (mode === "discovery") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <a href="#programs" className={styles.primary}>
          Explore Programs
        </a>
        <a href="#pricing" className={styles.secondary}>
          See Pricing
        </a>
      </div>
    );
  }

  // While availability is still loading, default to the copy/link for the
  // site's actual steady state (published, open-for-requests schedules)
  // rather than a pessimistic "nothing published yet" placeholder — those
  // two states are now the same in practice, so this avoids the buttons
  // visibly changing text right after the page paints, which reads as
  // broken/flickery on a slower connection while the fetch resolves.
  const primaryLabel = !loading && !hasPublishedSchedule ? "Explore Programs" : "View Weekly Programs";
  const secondaryHref = !loading && !hasPublishedSchedule ? "/contact#consultation-form" : ROBOTICS_BOOKING_URL;
  const secondaryLabel = loading
    ? "View Schedules"
    : hasOpenRequests
      ? "View Schedules"
      : hasOpenWaitlist ? "View Waitlists"
        : hasPublishedSchedule ? "View Schedules" : "Ask About Programs";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a href="#programs" className={styles.primary}>
        {primaryLabel}
      </a>
      <Link href={secondaryHref} className={styles.secondary}>
        {secondaryLabel}
      </Link>
    </div>
  );
}
