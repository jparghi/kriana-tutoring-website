"use client";

import Link from "next/link";
import { motion } from "../lib/motion";
import {
  CheckIcon,
  ClipboardIcon,
  HeartIcon,
  HomeIcon,
  MessageCircleIcon,
  TargetIcon,
  TrendingUpIcon,
  XIcon,
} from "./icons";
import { SectionHeading } from "./section-heading";

const traditionalTraits = [
  { text: "Same worksheets for every student" },
  { text: "No assessment before starting" },
  { text: "Progress measured only at report card time" },
  { text: "Parents rarely updated between sessions" },
  { text: "Focus on drilling content, not building belief" },
  { text: "Large groups — children get lost in the crowd" },
];

const krianaTraits = [
  { text: "Personalized learning plan for every child" },
  { text: "Assessment-based start before any lesson" },
  { text: "Monthly progress reviews with clear milestones" },
  { text: "Regular parent updates — you're always in the loop" },
  { text: "Confidence-first approach: belief drives achievement" },
  { text: "Small groups where every child is seen and heard" },
];

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const differentiators: {
  icon: IconComponent;
  title: string;
  description: string;
  accent: string;
  badge: string;
  badgeLabel: string;
}[] = [
  {
    icon: TargetIcon,
    title: "Assessment-Based Learning",
    description:
      "Before a single lesson begins, we assess your child to understand exactly where they are. We build from their foundation — not from a fixed Grade 3 worksheet.",
    accent: "border-brand-sky/30 from-brand-sky/10 to-brand-teal/5",
    badge: "bg-brand-sky/15 text-brand-sky",
    badgeLabel: "How we start",
  },
  {
    icon: ClipboardIcon,
    title: "Personalized Learning Plans",
    description:
      "Every child receives an individualized path. Not a generic program. Not the same materials as the child before them. A plan built around their pace, their gaps, and their goals.",
    accent: "border-brand-amber/30 from-brand-amber/10 to-brand-rose/5",
    badge: "bg-brand-amber/15 text-amber-700",
    badgeLabel: "Our approach",
  },
  {
    icon: TrendingUpIcon,
    title: "Monthly Progress Tracking",
    description:
      "We measure what matters. Every month, we review progress against your child's learning plan so nothing slips and every win is recognized.",
    accent: "border-brand-teal/30 from-brand-teal/10 to-brand-sky/5",
    badge: "bg-brand-teal/15 text-brand-teal",
    badgeLabel: "Accountability",
  },
  {
    icon: MessageCircleIcon,
    title: "Parent Updates Included",
    description:
      "You are a partner in your child's learning — not a bystander. We keep you informed so you can reinforce progress at home and never be surprised by a report card.",
    accent: "border-brand-rose/30 from-brand-rose/10 to-brand-amber/5",
    badge: "bg-brand-rose/15 text-brand-rose",
    badgeLabel: "Communication",
  },
  {
    icon: HeartIcon,
    title: "Confidence-First Philosophy",
    description:
      "Before we cover content, we rebuild belief. Children who say \"I can't do math\" leave Kriana saying \"I've got this.\" Confidence is a skill — and we teach it.",
    accent: "border-brand-amber/30 from-brand-amber/10 to-brand-teal/5",
    badge: "bg-brand-amber/15 text-amber-700",
    badgeLabel: "Our philosophy",
  },
  {
    icon: HomeIcon,
    title: "Local, Human-Centered Teaching",
    description:
      "Ottawa-based and community-rooted. Children are not numbers in a system. Our warm Stittsville learning environment means students feel safe enough to try — and safe enough to fail forward.",
    accent: "border-brand-teal/30 from-brand-teal/10 to-brand-sky/5",
    badge: "bg-brand-teal/15 text-brand-teal",
    badgeLabel: "Our community",
  },
];

export function HowWereDifferent() {
  return (
    <section className="bg-gradient-to-b from-slate-50/80 to-white py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="Why Kriana is Different"
          title="Every child learns differently. Every child deserves a personalized plan."
          description="Most tutoring centers hand every student the same materials. We start with an assessment and build a learning plan around your child — because one size fits no one."
        />

        {/* ── Traditional vs Personalized comparison ── */}
        <div className="mt-16 overflow-hidden rounded-3xl border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="grid sm:grid-cols-2">
            {/* Traditional column */}
            <motion.div
              className="flex flex-col gap-6 bg-slate-50 p-8 sm:p-10"
              initial={{ opacity: 0, transform: "translateX(-30px)" }}
              whileInView={{ opacity: 1, transform: "translateX(0px)" }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200">
                  <XIcon className="h-4 w-4 text-slate-400" />
                </span>
                <h3 className="text-base font-bold uppercase tracking-[0.3em] text-slate-400">
                  Generic Tutoring
                </h3>
              </div>
              <ul className="flex flex-col gap-3">
                {traditionalTraits.map((trait) => (
                  <li key={trait.text} className="flex items-start gap-3 text-sm text-slate-500">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200">
                      <XIcon className="h-3 w-3 text-slate-400" />
                    </span>
                    {trait.text}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Kriana column */}
            <motion.div
              className="relative flex flex-col gap-6 bg-gradient-to-br from-brand-sky/10 via-brand-teal/8 to-brand-amber/5 p-8 sm:p-10"
              initial={{ opacity: 0, transform: "translateX(30px)" }}
              whileInView={{ opacity: 1, transform: "translateX(0px)" }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {/* Top shimmer */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-sky/50 to-transparent" />
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-teal/20">
                  <CheckIcon className="h-4 w-4 text-brand-teal" />
                </span>
                <h3 className="text-base font-bold uppercase tracking-[0.3em] text-brand-teal">
                  The Kriana Approach
                </h3>
              </div>
              <ul className="flex flex-col gap-3">
                {krianaTraits.map((trait) => (
                  <li key={trait.text} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-teal/20">
                      <CheckIcon className="h-3 w-3 text-brand-teal" />
                    </span>
                    {trait.text}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact#consultation-form"
                className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-brand-sky to-brand-teal px-6 py-3 text-sm font-bold text-white shadow-[0_6px_20px_rgba(74,144,226,0.4)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_10px_32px_rgba(74,144,226,0.55)]"
              >
                See it for your child
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* ── Differentiator cards ── */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {differentiators.map((item, index) => (
            <motion.div
              key={item.title}
              className={`group flex flex-col gap-5 rounded-2xl border bg-gradient-to-br p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] ${item.accent}`}
              initial={{ opacity: 0, transform: "translateY(24px)" }}
              whileInView={{ opacity: 1, transform: "translateY(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.07 }}
            >
              <div className="flex items-start justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <item.icon className="h-6 w-6 text-slate-700" />
                </span>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.35em] ${item.badge}`}>
                  {item.badgeLabel}
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
