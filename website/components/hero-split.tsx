import Image from "next/image";
import Link from "next/link";
import { GraduationCapIcon, MessageCircleIcon, SparkleIcon } from "./icons";

const featureHighlights = [
  {
    title: "Personalized Learning Plans",
    description: "Every child receives an individualized path based on their assessment — not a generic curriculum",
    icon: SparkleIcon,
    accent: "from-brand-amber/25 to-brand-rose/10 border-brand-amber/20 text-amber-600"
  },
  {
    title: "Assessment-Based Start",
    description: "We assess before we plan. No guessing — we know exactly where your child is and where they need to go",
    icon: GraduationCapIcon,
    accent: "from-brand-sky/20 to-brand-teal/10 border-brand-sky/20 text-brand-sky"
  },
  {
    title: "Monthly Progress Reviews",
    description: "Parents receive regular updates so you always know how your child is growing",
    icon: MessageCircleIcon,
    accent: "from-brand-teal/20 to-brand-sky/10 border-brand-teal/20 text-brand-teal"
  }
];

export function HeroSplit() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-sky/10 py-24 lg:py-32">
      {/* Background layer */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-40 top-16 h-[600px] w-[600px] animate-float rounded-full bg-gradient-to-br from-brand-sky/30 to-brand-teal/15 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-[520px] w-[520px] animate-float-delayed rounded-full bg-gradient-to-tl from-brand-rose/25 to-brand-amber/15 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-[340px] w-[340px] animate-float-slow -translate-y-1/2 rounded-full bg-brand-teal/12 blur-3xl" />
        {/* Mesh grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(74,144,226,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(74,144,226,0.6) 1px,transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/90 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/60 to-transparent" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 sm:px-10 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-20">
        {/* ── Left column ── */}
        <div className="flex flex-col gap-8 lg:gap-10">

          {/* Eyebrow badge */}
          <div className="flex items-center gap-3">
            <span className="inline-flex w-fit items-center gap-2.5 rounded-full border border-brand-rose/25 bg-gradient-to-r from-brand-rose/12 to-brand-amber/12 px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.38em] text-brand-rose shadow-sm backdrop-blur">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-brand-rose opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-rose" />
              </span>
              JK to Grade 8 · Ottawa, ON
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-balance text-[clamp(2.6rem,5.4vw,3.9rem)] font-bold leading-[1.06] text-slate-900">
            Personalized Learning{" "}
            <span className="relative inline-block">
              <span className="gradient-text">For Every Child.</span>
              {/* Wavy underline */}
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="M2 9 Q38 2 75 7 Q112 12 150 6 Q188 0 225 6 Q262 12 298 5"
                  stroke="url(#wave-grad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
                <defs>
                  <linearGradient id="wave-grad" x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4A90E2" />
                    <stop offset="50%" stopColor="#00B8A9" />
                    <stop offset="100%" stopColor="#4A90E2" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-slate-600">
            Every child learns differently. At Kriana Tutoring, we build a personalized plan for your child — based
            on an individual assessment, not a one-size-fits-all worksheet. We help JK to Grade 8 students in Ottawa
            build real confidence in math and English, with monthly progress updates so you always know how they&apos;re growing.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/contact#consultation-form"
              className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-brand-sky to-brand-teal px-8 py-3.5 text-sm font-bold uppercase tracking-[0.22em] text-white shadow-[0_8px_32px_rgba(74,144,226,0.45)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_14px_44px_rgba(74,144,226,0.6)]"
            >
              <span className="relative z-10 flex items-center gap-2.5">
                Book a Free Assessment
                <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-brand-teal to-brand-sky transition-transform duration-500 group-hover:translate-x-0" />
            </Link>
            <Link
              href="/contact#consultation-form"
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.22em] text-slate-700 shadow-sm backdrop-blur transition-all duration-300 hover:border-brand-rose hover:text-brand-rose hover:shadow-[0_8px_24px_rgba(255,138,101,0.2)]"
            >
              Contact Us Today
              <svg className="h-4 w-4 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {/* Feature highlight cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            {featureHighlights.map((item, idx) => (
              <div
                key={item.title}
                className={`group relative flex gap-3 rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_36px_rgba(15,23,42,0.14)] ${item.accent}`}
              >
                <span className="absolute right-3 top-3 text-[10px] font-bold text-current opacity-20">
                  0{idx + 1}
                </span>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="text-xs leading-relaxed text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-3.5 w-3.5 fill-amber-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </span>
              <span className="font-semibold text-slate-700">5.0 Google rating</span>
            </span>
            <span className="h-3.5 w-px bg-slate-300" />
            <span className="font-medium text-slate-600">25+ happy families</span>
            <span className="h-3.5 w-px bg-slate-300" />
            <span className="font-medium text-slate-600">Ottawa, ON</span>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="relative flex items-start justify-center lg:justify-end">
          <div className="absolute -left-10 top-6 hidden h-40 w-40 animate-float rounded-full bg-brand-amber/30 blur-3xl lg:block" />
          <div className="absolute -bottom-8 right-12 hidden h-44 w-44 animate-float-delayed rounded-full bg-brand-sky/25 blur-3xl lg:block" />

          <div className="relative flex w-full max-w-[520px] flex-col gap-6">

            {/* Info card — gradient-border wrapper */}
            <div className="rounded-[38px] p-px bg-gradient-to-br from-brand-sky/50 via-brand-teal/30 to-brand-rose/30 shadow-[0_40px_90px_rgba(13,116,109,0.18)]">
              <div className="relative overflow-hidden rounded-[37px] bg-white/97 p-8 backdrop-blur-xl">
                {/* Top shimmer line */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-sky/60 to-transparent" />
                {/* Subtle inner glow */}
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-sky/8 blur-2xl" />

                <span className="inline-flex items-center rounded-full border border-brand-sky/20 bg-gradient-to-r from-brand-sky/15 to-brand-teal/15 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.38em] text-brand-sky">
                  Kriana Tutoring
                </span>
                <h3 className="mt-5 text-2xl font-bold text-slate-900 sm:text-[1.65rem] leading-snug">
                  We don&apos;t just tutor —{" "}
                  <span className="gradient-text">we build confident learners</span>
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Your child&apos;s learning plan starts with an assessment, not an assumption. We identify exactly where they are, build a plan around them, and track progress every month — because children deserve more than a generic curriculum.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="relative overflow-hidden rounded-2xl border border-brand-sky/15 bg-gradient-to-br from-brand-sky/10 to-brand-teal/10 p-4">
                    <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-brand-sky/10 blur-xl" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-brand-sky">Tutor Experience</p>
                    <p className="mt-2 text-4xl font-bold text-slate-900 leading-none">
                      4<span className="text-brand-sky text-2xl">+</span>
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-400">years</p>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl border border-brand-rose/15 bg-gradient-to-br from-brand-rose/10 to-brand-amber/10 p-4">
                    <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-brand-rose/10 blur-xl" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-brand-rose">Happy Families</p>
                    <p className="mt-2 text-4xl font-bold text-slate-900 leading-none">
                      25<span className="text-brand-rose text-2xl">+</span>
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-400">served</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero image with floating badge */}
            <div className="relative">
              <div className="overflow-hidden rounded-[32px] border border-slate-200/60 shadow-[0_30px_70px_rgba(15,23,42,0.14)]">
                <Image
                  src="/images/hero-tutoring-kid.png"
                  alt="kids learning math at tutoring center in Ottawa"
                  width={520}
                  height={360}
                  className="h-auto w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                  priority
                />
                {/* Overlay gradient on image bottom */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent rounded-b-[32px]" />
              </div>

              {/* Floating social proof badge */}
              <div className="absolute -left-4 bottom-6 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.18)] backdrop-blur-md lg:-left-8">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-amber/30 to-brand-rose/20 text-lg">
                  ⭐
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-900">5-star experience</p>
                  <p className="text-[10px] text-slate-500 leading-tight">Trusted by Ottawa families</p>
                </div>
              </div>

              {/* Floating new-student badge */}
              <div className="absolute -right-2 top-6 flex items-center gap-2 rounded-xl border border-brand-teal/20 bg-white/95 px-3 py-2.5 shadow-[0_8px_30px_rgba(0,184,169,0.2)] backdrop-blur-md lg:-right-6">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-brand-teal opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-teal" />
                </span>
                <p className="text-[11px] font-bold text-slate-700">Accepting new students</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
