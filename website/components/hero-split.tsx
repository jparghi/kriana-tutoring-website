import Image from "next/image";
import Link from "next/link";
import { ClipboardIcon, HeartIcon, TargetIcon, UsersIcon } from "./icons";

const featureHighlights = [
  {
    title: "Personalized Plans",
    icon: TargetIcon,
  },
  {
    title: "Monthly Progress Reports",
    icon: ClipboardIcon,
  },
  {
    title: "Small Groups & 1-on-1",
    icon: UsersIcon,
  },
  {
    title: "Confidence That Lasts",
    icon: HeartIcon,
  },
];

export function HeroSplit() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-sky/10 py-20 lg:py-28">
      {/* Background layer */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-40 top-16 h-[600px] w-[600px] animate-float rounded-full bg-gradient-to-br from-brand-sky/30 to-brand-teal/15 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-[520px] w-[520px] animate-float-delayed rounded-full bg-gradient-to-tl from-brand-rose/25 to-brand-amber/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(74,144,226,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(74,144,226,0.6) 1px,transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6 sm:px-10 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
        {/* ── Left column ── */}
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-2">
            <h1 className="text-balance text-[clamp(2.6rem,5.4vw,3.9rem)] font-bold leading-[1.06] text-slate-900">
              Personalized Learning{" "}
              <span className="gradient-text">for Every Child</span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-slate-600">
              Math, English, Reading &amp; More for JK to Grade 8
            </p>
          </div>

          {/* Robotics & Coding callout */}
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
            <span className="shrink-0 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Now offering
            </span>
            <div className="flex items-center gap-3">
              <p className="text-base font-bold text-slate-900">
                Robotics &amp; Coding{" "}
                <span className="block text-xs font-medium text-slate-500 sm:inline sm:text-sm">
                  powered by Young Engineers
                </span>
              </p>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-sky to-brand-teal text-[10px] font-black text-white">
                YE
              </span>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {featureHighlights.map((item) => (
              <div key={item.title} className="flex flex-col items-start gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-sky/10 text-brand-sky">
                  <item.icon className="h-4.5 w-4.5" />
                </span>
                <p className="text-xs font-semibold leading-snug text-slate-700">{item.title}</p>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/contact#consultation-form"
              className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-brand-rose to-brand-amber px-8 py-3.5 text-sm font-bold uppercase tracking-[0.22em] text-white shadow-[0_8px_32px_rgba(255,138,101,0.45)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_14px_44px_rgba(255,138,101,0.6)]"
            >
              Book Free Assessment
            </Link>
            <Link
              href="/booking"
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.22em] text-slate-700 shadow-sm backdrop-blur transition-all duration-300 hover:border-brand-sky hover:text-brand-sky"
            >
              Explore Robotics &amp; Coding
            </Link>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="relative flex items-center justify-center lg:justify-end">
          <div className="absolute -left-10 top-6 hidden h-40 w-40 animate-float rounded-full bg-brand-amber/30 blur-3xl lg:block" />
          <div className="absolute -bottom-8 right-12 hidden h-44 w-44 animate-float-delayed rounded-full bg-brand-sky/25 blur-3xl lg:block" />

          <div className="relative w-full max-w-[480px] overflow-hidden rounded-[40%_60%_55%_45%/50%_45%_55%_50%] border border-slate-200/60 shadow-[0_30px_70px_rgba(15,23,42,0.14)]">
            <Image
              src="/images/young-engineers/hero.png"
              alt="Student learning at Kriana Tutoring"
              width={1448}
              height={1086}
              className="h-full w-full object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
