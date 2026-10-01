"use client";

import Link from "next/link";
import { SCHEDULING_CONTACT_URL } from "../../lib/site-links";

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
  mode = "contact",
}: {
  variant?: "light" | "dark";
  /** "discovery" sends the reader straight down the page — programs, then
   * price — which is the order a parent actually decides in. "contact" (the
   * default) pairs the programs link with a contact CTA: class schedules
   * aren't published on the site, so parents reach out to arrange one. */
  mode?: "contact" | "discovery";
}) {
  const styles = VARIANTS[variant];

  // A parent landing from social asks "what is it? → is it for my child? →
  // how much?" — so the hero answers the first two and then points at the
  // price, rather than sending them off to a contact form straight away.
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

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a href="#programs" className={styles.primary}>
        Explore Programs
      </a>
      <Link href={SCHEDULING_CONTACT_URL} className={styles.secondary}>
        Contact Us to Schedule
      </Link>
    </div>
  );
}
