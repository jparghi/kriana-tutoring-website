"use client";

import Link from "next/link";
import { useRoboticsAvailability } from "./robotics-programs";
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

export function RoboticsCtaButtons({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { hasPublishedSchedule, hasOpenRequests, hasOpenWaitlist, loading } = useRoboticsAvailability();
  const styles = VARIANTS[variant];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a href="#programs" className={styles.primary}>
        {loading ? "Explore Programs" : hasPublishedSchedule ? "View Weekly Programs" : "Explore Programs"}
      </a>
      <Link
        href={hasPublishedSchedule ? ROBOTICS_BOOKING_URL : "/contact#consultation-form"}
        className={styles.secondary}
      >
        {loading
          ? "Ask a Question"
          : hasOpenRequests
            ? "View Schedules"
            : hasOpenWaitlist ? "View Waitlists"
              : hasPublishedSchedule ? "View Schedules" : "Ask About Programs"}
      </Link>
    </div>
  );
}
