"use client";

import timelineData from "../data/timeline.json";
import { motion } from "../lib/motion";
import { CompassIcon, MapIcon, RocketIcon, SparkleIcon } from "./icons";
import { SectionHeading } from "./section-heading";

const iconLookup = {
  compass: CompassIcon,
  map: MapIcon,
  rocket: RocketIcon,
  sparkles: SparkleIcon
} as const;

export function TimelineSection() {
  return (
    <section id="timeline" className="relative overflow-hidden bg-slate-50 py-24">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-brand-sky/20 to-transparent" />
      <div className="absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-brand-sky/20 to-transparent lg:block" />
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="Timeline"
          title="A The7-inspired journey that keeps families aligned"
          description="Each chapter mirrors the rhythm of The7 course experience—clean sections, clear momentum, and polished wayfinding tailored for tutoring families."
        />
        <div className="mt-16 space-y-10 border-l border-slate-200 pl-6 sm:pl-10">
          {timelineData.map((item, index) => {
            const Icon = iconLookup[item.icon as keyof typeof iconLookup];
            return (
              <motion.article
                key={item.title}
                className="relative ml-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
                whileInView={{ opacity: 1, transform: "translateY(0px)" }}
                initial={{ opacity: 0, transform: "translateY(40px)" }}
                transition={{ duration: 0.8, delay: index * 0.08 }}
              >
                <span className="absolute -left-10 top-8 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-amber to-brand-rose text-slate-950 shadow-lg shadow-brand-amber/40">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-brand-sky">
                  <span>{item.duration}</span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm font-medium text-brand-rose">{item.subtitle}</p>
                <p className="mt-4 text-sm text-slate-600 sm:text-base">{item.description}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
