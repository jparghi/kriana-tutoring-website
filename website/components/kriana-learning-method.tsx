"use client";

import Link from "next/link";
import { motion } from "../lib/motion";
import {
  BookOpenIcon,
  ClipboardIcon,
  MessageCircleIcon,
  SearchIcon,
  StarIcon,
  TrendingUpIcon,
} from "./icons";
import { SectionHeading } from "./section-heading";

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const steps: {
  step: string;
  title: string;
  subtitle: string;
  description: string;
  outcome: string;
  icon: IconComponent;
  accent: string;
  stepColor: string;
  outcomeColor: string;
}[] = [
  {
    step: "01",
    title: "Child Assessment",
    subtitle: "Know before you plan",
    description:
      "Every journey begins with a thorough assessment — not an assumption. We evaluate your child's current knowledge, learning gaps, strengths, and learning style before a single lesson is planned.",
    outcome: "We know exactly where your child is",
    icon: SearchIcon,
    accent: "from-brand-sky/15 to-brand-teal/5 border-brand-sky/20",
    stepColor: "bg-brand-sky/15 text-brand-sky",
    outcomeColor: "bg-brand-sky/10 text-brand-sky border-brand-sky/20",
  },
  {
    step: "02",
    title: "Personalized Learning Plan",
    subtitle: "Built for this child — not all children",
    description:
      "Using assessment results, we create an individualized learning path tailored to your child's pace, grade level, and specific learning objectives. No generic curriculum. No one-size-fits-all.",
    outcome: "Your child has a plan that fits them",
    icon: ClipboardIcon,
    accent: "from-brand-amber/15 to-brand-rose/5 border-brand-amber/20",
    stepColor: "bg-brand-amber/15 text-amber-700",
    outcomeColor: "bg-brand-amber/10 text-amber-700 border-brand-amber/20",
  },
  {
    step: "03",
    title: "Weekly Learning Sessions",
    subtitle: "Structured, engaging, and purposeful",
    description:
      "Each session follows the personalized plan — building from foundational concepts upward. We use hands-on activities, structured worksheets, and patient teaching to make sessions enjoyable and effective.",
    outcome: "Every session moves the needle",
    icon: BookOpenIcon,
    accent: "from-brand-teal/15 to-brand-sky/5 border-brand-teal/20",
    stepColor: "bg-brand-teal/15 text-brand-teal",
    outcomeColor: "bg-brand-teal/10 text-brand-teal border-brand-teal/20",
  },
  {
    step: "04",
    title: "Monthly Progress Review",
    subtitle: "Measure what matters",
    description:
      "Progress is reviewed every month against your child's learning milestones. We adjust the plan as needed — accelerating where they're ready and reinforcing where they need more time.",
    outcome: "Nothing slips — every win is recognized",
    icon: TrendingUpIcon,
    accent: "from-brand-rose/15 to-brand-amber/5 border-brand-rose/20",
    stepColor: "bg-brand-rose/15 text-brand-rose",
    outcomeColor: "bg-brand-rose/10 text-brand-rose border-brand-rose/20",
  },
  {
    step: "05",
    title: "Parent Updates",
    subtitle: "You are always in the loop",
    description:
      "Parents receive regular updates on their child's progress — what was covered, what milestones were hit, and what to reinforce at home. You are a partner in this journey, not a bystander.",
    outcome: "No surprises at report card time",
    icon: MessageCircleIcon,
    accent: "from-brand-sky/15 to-brand-teal/5 border-brand-sky/20",
    stepColor: "bg-brand-sky/15 text-brand-sky",
    outcomeColor: "bg-brand-sky/10 text-brand-sky border-brand-sky/20",
  },
  {
    step: "06",
    title: "Confidence & Academic Growth",
    subtitle: "The outcome that changes everything",
    description:
      "The final result isn't just better grades — it's a child who believes in themselves. Improved confidence in the classroom, stronger marks, and a genuine love of learning that lasts far beyond Grade 8.",
    outcome: "\"I can do this\" — your child's new default",
    icon: StarIcon,
    accent: "from-brand-amber/15 to-brand-teal/5 border-brand-amber/20",
    stepColor: "bg-brand-amber/15 text-amber-700",
    outcomeColor: "bg-brand-amber/10 text-amber-700 border-brand-amber/20",
  },
];

export function KrianaLearningMethod() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50/60 py-24">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-brand-sky/8 blur-3xl" />
        <div className="absolute -right-32 bottom-20 h-80 w-80 rounded-full bg-brand-amber/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-teal/6 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="The Kriana Learning Method™"
          title="A proven system — built around every child"
          description="Six clear steps. One goal: a child who walks into every classroom with confidence and the skills to back it up."
        />

        {/* Method trademark banner */}
        <motion.div
          className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-brand-sky/20 bg-gradient-to-r from-brand-sky/8 via-brand-teal/6 to-brand-amber/8 px-8 py-5 text-center sm:flex-row sm:justify-between sm:text-left"
          initial={{ opacity: 0, transform: "translateY(16px)" }}
          whileInView={{ opacity: 1, transform: "translateY(0px)" }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <p className="text-sm font-bold text-slate-700">
              The Kriana Learning Method™
            </p>
            <p className="text-xs text-slate-500">
              Repeatable · Measurable · Personalized · Proven
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-[0.3em]">
            {["Assessment-Based", "Progress-Tracked", "Parent-Included", "Confidence-First"].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-brand-sky/20 bg-white/70 px-3 py-1.5 text-brand-sky shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Steps grid */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              className={`group relative flex flex-col gap-5 rounded-2xl border bg-gradient-to-br p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.1)] ${item.accent}`}
              initial={{ opacity: 0, transform: "translateY(28px)" }}
              whileInView={{ opacity: 1, transform: "translateY(0px)" }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
            >
              {/* Step number watermark */}
              <span className="pointer-events-none absolute right-5 top-4 text-[4rem] font-black leading-none text-slate-900/4 select-none">
                {item.step}
              </span>

              <div className="flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <item.icon className="h-6 w-6 text-slate-700" />
                </span>
                <span className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.35em] ${item.stepColor}`}>
                  Step {item.step}
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                  {item.subtitle}
                </p>
                <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>
              </div>

              <div className={`mt-auto flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold ${item.outcomeColor}`}>
                <span className="shrink-0">→</span>
                <span>{item.outcome}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA banner */}
        <motion.div
          className="mt-16 flex flex-col items-center gap-5 rounded-3xl border border-brand-sky/20 bg-gradient-to-br from-brand-sky/10 via-brand-teal/8 to-brand-amber/8 p-10 text-center shadow-sm"
          initial={{ opacity: 0, transform: "translateY(20px)" }}
          whileInView={{ opacity: 1, transform: "translateY(0px)" }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center rounded-full border border-brand-sky/20 bg-white/60 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.35em] text-brand-sky">
            Start at Step 1
          </span>
          <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Ready to see The Kriana Learning Method™ in action?
          </h3>
          <p className="max-w-lg text-sm leading-relaxed text-slate-600">
            Book your child&apos;s free assessment and we&apos;ll walk you through every step together — starting with where your child is today.
          </p>
          <Link
            href="/contact#consultation-form"
            className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-brand-sky to-brand-teal px-8 py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-[0_8px_28px_rgba(74,144,226,0.45)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_14px_44px_rgba(74,144,226,0.6)]"
          >
            Book a Free Assessment
            <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
