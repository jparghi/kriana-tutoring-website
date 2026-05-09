import Link from "next/link";
import { SectionHeading } from "./section-heading";

const helpItems = [
  {
    number: "01",
    title: "Personalized learning support",
    description:
      "We start by understanding your child's specific gaps, strengths, and learning style, then build a plan around them instead of using a generic curriculum.",
    color: "text-brand-sky",
    bg: "bg-brand-sky/10",
  },
  {
    number: "02",
    title: "Strong foundation in Math & English",
    description:
      "From number sense to fractions and phonics to paragraph writing, we support math tutoring for kids and literacy growth on a stronger foundation.",
    color: "text-brand-teal",
    bg: "bg-brand-teal/10",
  },
  {
    number: "03",
    title: "Reading and writing practice",
    description:
      "Structured reading comprehension exercises and guided writing practice give families reading help for grade 1-3 and older students who need clearer communication skills.",
    color: "text-brand-rose",
    bg: "bg-brand-rose/10",
  },
  {
    number: "04",
    title: "Confidence-building approach",
    description:
      "Every session celebrates small wins. We make sure children leave feeling capable, not defeated — and that shift changes everything at school.",
    color: "text-amber-600",
    bg: "bg-brand-amber/15",
  },
  {
    number: "05",
    title: "Regular worksheets & structured practice",
    description:
      "Consistent take-home practice materials reinforce what was learned in sessions and support homework help for kids between tutoring visits.",
    color: "text-brand-sky",
    bg: "bg-brand-sky/10",
  },
  {
    number: "06",
    title: "Friendly, low-stress environment",
    description:
      "Our warm home-based setting feels nothing like school under pressure. Children relax, open up, and find learning genuinely enjoyable.",
    color: "text-brand-teal",
    bg: "bg-brand-teal/10",
  },
];

export function HowWeHelp() {
  return (
    <section className="relative overflow-hidden bg-white py-24">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-brand-sky/10 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-brand-teal/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="How Kriana helps"
          title="A learning plan built around your child"
          description="We don't just cover the curriculum. We diagnose the gaps, rebuild the foundation, and help Ottawa students walk into school feeling prepared."
          tone="light"
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {helpItems.map((item) => (
            <div
              key={item.number}
              className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_20px_48px_rgba(0,0,0,0.1)]"
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg} text-xs font-bold uppercase tracking-[0.3em] ${item.color}`}>
                  {item.number}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 text-center">
          <p className="text-lg font-semibold text-slate-800">
            Ready to see what personalized learning can do for your child?
          </p>
          <Link
            href="/contact#consultation-form"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-sky to-brand-teal px-8 py-3.5 text-sm font-bold uppercase tracking-[0.22em] text-white shadow-[0_8px_28px_rgba(74,144,226,0.5)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_12px_40px_rgba(74,144,226,0.65)]"
          >
            Start Your Child&apos;s Learning Journey
          </Link>
        </div>
      </div>
    </section>
  );
}
