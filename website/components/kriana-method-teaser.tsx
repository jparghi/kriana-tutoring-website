import Link from "next/link";
import { BookOpenIcon, ClipboardIcon, SearchIcon, TrendingUpIcon } from "./icons";
import { SectionHeading } from "./section-heading";

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const teaserSteps: { step: string; title: string; description: string; icon: IconComponent; accent: string; iconColor: string }[] = [
  {
    step: "01",
    title: "Child Assessment",
    description: "We assess your child before planning anything — so every lesson starts from the right place.",
    icon: SearchIcon,
    accent: "border-brand-sky/20 from-brand-sky/10 to-brand-teal/5",
    iconColor: "text-brand-sky",
  },
  {
    step: "02",
    title: "Personalized Plan",
    description: "A learning path built around your child's pace, gaps, and goals — not a generic curriculum.",
    icon: ClipboardIcon,
    accent: "border-brand-amber/20 from-brand-amber/10 to-brand-rose/5",
    iconColor: "text-amber-600",
  },
  {
    step: "03",
    title: "Weekly Sessions",
    description: "Structured, hands-on sessions that follow the plan and make real progress each visit.",
    icon: BookOpenIcon,
    accent: "border-brand-teal/20 from-brand-teal/10 to-brand-sky/5",
    iconColor: "text-brand-teal",
  },
  {
    step: "04",
    title: "Monthly Progress Reviews",
    description: "We track milestones every month and keep you informed — no report-card surprises.",
    icon: TrendingUpIcon,
    accent: "border-brand-rose/20 from-brand-rose/10 to-brand-amber/5",
    iconColor: "text-brand-rose",
  },
];

export function KrianaMethodTeaser() {
  return (
    <section className="bg-gradient-to-b from-white to-slate-50/60 py-20">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="The Kriana Learning Method™"
          title="A personalized system — not a generic program"
          description="Every child starts with an assessment. Every plan is built around them. Every month we measure progress."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {teaserSteps.map((item) => (
            <div
              key={item.step}
              className={`group relative flex flex-col gap-4 rounded-2xl border bg-gradient-to-br p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(15,23,42,0.09)] ${item.accent}`}
            >
              <span className="pointer-events-none absolute right-4 top-3 text-[2.8rem] font-black leading-none text-slate-900/4 select-none">
                {item.step}
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 shadow-sm transition-transform duration-300 group-hover:scale-110">
                <item.icon className={`h-5 w-5 ${item.iconColor}`} />
              </span>
              <div className="space-y-1">
                <p className="font-bold text-slate-900">{item.title}</p>
                <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/why-kriana"
            className="group inline-flex items-center gap-2.5 rounded-full border border-brand-sky/30 bg-white px-7 py-3.5 text-sm font-bold text-brand-sky shadow-sm transition-all duration-300 hover:border-brand-sky hover:shadow-[0_6px_20px_rgba(74,144,226,0.2)]"
          >
            See the full 6-step method
            <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            href="/contact#consultation-form"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-sky to-brand-teal px-7 py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-[0_6px_24px_rgba(74,144,226,0.4)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_10px_36px_rgba(74,144,226,0.55)]"
          >
            Book a Free Assessment
          </Link>
        </div>
      </div>
    </section>
  );
}
