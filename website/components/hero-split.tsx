import Image from "next/image";
import Link from "next/link";
import { ClipboardIcon, HeartIcon, TargetIcon } from "./icons";

const YOUNG_ENGINEERS_URL = "https://kanata.youngengineers.org/";

const floatingBadges = [
  {
    title: "Confidence That Lasts",
    icon: HeartIcon,
    position: "top-10 -right-4 lg:-right-14",
  },
  {
    title: "Personalized Plans",
    icon: TargetIcon,
    position: "top-1/2 -right-8 -translate-y-1/2 lg:-right-20",
  },
  {
    title: "Real Progress, Every Month",
    icon: ClipboardIcon,
    position: "bottom-10 -right-4 lg:-right-10",
  },
];

export function HeroSplit() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-sky/10 pb-20 pt-6 lg:pb-28 lg:pt-10">
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

      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6 sm:px-10 lg:grid lg:grid-cols-[0.75fr_1.20fr] lg:items-center lg:gap-0">
        {/* ── Left column ── */}
        <div className="flex flex-col gap-6">
          {/* Eyebrow badge */}
          <span className="inline-flex w-fit items-center gap-2.5 rounded-full border border-brand-rose/25 bg-gradient-to-r from-brand-rose/12 to-brand-amber/12 px-5 py-1.5 text-[11px] font-black uppercase tracking-[0.38em] text-brand-rose shadow-sm backdrop-blur">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-brand-rose opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-rose" />
            </span>
            JK to Grade 8 · Ottawa
          </span>

          {/* Now offering: Robotics & Coding — powered by Young Engineers */}
          <a
            href={YOUNG_ENGINEERS_URL}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex w-fit items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="max-w-[92px]">
              <p className="text-[10px] font-semibold leading-tight text-slate-500">Now offering</p>
              <p className="text-sm font-extrabold leading-tight text-slate-900">Robotics &amp; Coding</p>
              <p className="text-[10px] leading-tight text-slate-500">
                by{" "}
                <span className="font-semibold text-brand-sky group-hover:underline">Young Engineers</span>
              </p>
            </div>

            <div className="h-12 w-px shrink-0 bg-slate-200" />

            <Image
              src="/images/young-engineers/logo.png"
              alt="Young Engineers"
              width={180}
              height={52}
              className="h-12 w-auto shrink-0 object-contain"
            />

            <span className="flex h-20 w-20 shrink-0 items-center justify-center">
              <Image
                src="/images/young-engineers/robowalk.png"
                alt="Young Engineers robot build"
                width={1526}
                height={2034}
                className="h-full w-full object-contain"
              />
            </span>
          </a>

          <div className="flex flex-col gap-2">
            <h1 className="text-balance text-[clamp(2.6rem,5.4vw,3.9rem)] font-bold leading-[1.06] text-slate-900">
              Personalized Learning{" "}
              <span className="gradient-text">for Every Child</span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-slate-600">
              Math, English, Reading &amp; More for JK to Grade 8
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-start gap-3">
            <Link
              href="/contact#consultation-form"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[#0c6162] px-6 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-[0_8px_32px_rgba(12,97,98,0.45)] transition-all duration-300 hover:scale-[1.03] hover:bg-[#0a5051] hover:shadow-[0_14px_44px_rgba(12,97,98,0.6)]"
            >
              Book Free Assessment
            </Link>
            <a
              href={YOUNG_ENGINEERS_URL}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm backdrop-blur transition-all duration-300 hover:border-brand-sky hover:text-brand-sky"
            >
              Explore Robotics &amp; Coding
            </a>
          </div>

          {/* Mobile-only feature list (floating badges are desktop-only) */}
          <div className="grid grid-cols-2 gap-4 lg:hidden">
            {floatingBadges.map((item) => (
              <div key={item.title} className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-sky/10 text-brand-sky">
                  <item.icon className="h-4.5 w-4.5" />
                </span>
                <p className="text-xs font-semibold leading-snug text-slate-700">{item.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="relative mx-auto flex items-center justify-center lg:mx-0 lg:-my-10 lg:justify-end lg:overflow-visible">
          <div className="absolute -left-10 top-6 hidden h-40 w-40 animate-float rounded-full bg-brand-amber/30 blur-3xl lg:block" />
          <div className="absolute -bottom-8 right-12 hidden h-44 w-44 animate-float-delayed rounded-full bg-brand-sky/25 blur-3xl lg:block" />

          {/* Decorative sparkles */}
          <span aria-hidden className="absolute -top-8 left-1/3 hidden text-3xl text-brand-amber animate-pulse-glow lg:block">✦</span>
          <span aria-hidden className="absolute right-2 top-1/4 hidden text-xl text-brand-rose animate-pulse-glow lg:block" style={{ animationDelay: "0.6s" }}>✦</span>
          <span aria-hidden className="absolute -bottom-4 left-4 hidden text-xl text-brand-sky animate-pulse-glow lg:block" style={{ animationDelay: "1.2s" }}>✦</span>
          <span aria-hidden className="absolute -left-10 top-1/2 hidden text-lg text-brand-teal animate-pulse-glow lg:block" style={{ animationDelay: "1.8s" }}>✧</span>
          <span aria-hidden className="absolute -right-8 bottom-10 hidden text-2xl text-brand-amber animate-pulse-glow lg:block" style={{ animationDelay: "0.3s" }}>✧</span>
          <span aria-hidden className="absolute left-1/4 -bottom-10 hidden text-lg text-brand-rose animate-pulse-glow lg:block" style={{ animationDelay: "0.9s" }}>✦</span>
          <span aria-hidden className="absolute right-1/3 -top-10 hidden text-lg text-brand-sky animate-pulse-glow lg:block" style={{ animationDelay: "1.5s" }}>✧</span>

          <div className="relative w-full max-w-[880px] overflow-hidden rounded-[42%_58%_54%_46%/52%_44%_56%_48%] border border-slate-200/60 shadow-[0_30px_70px_rgba(15,23,42,0.14)] lg:w-[115%]">
            <Image
              src="/images/young-engineers/hero.png"
              alt="Student learning at Kriana Tutoring"
              width={1448}
              height={1086}
              className="h-full w-full object-cover"
              priority
            />
          </div>

          {/* Floating feature badges */}
          {floatingBadges.map((item) => (
            <div
              key={item.title}
              className={`absolute ${item.position} hidden max-w-[150px] items-center gap-2 rounded-2xl border border-white/80 bg-white/95 px-3 py-2.5 shadow-[0_12px_32px_rgba(15,23,42,0.14)] backdrop-blur-md lg:flex`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-sky/10 text-brand-sky">
                <item.icon className="h-4 w-4" />
              </span>
              <p className="text-[11px] font-bold leading-snug text-slate-800">{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
