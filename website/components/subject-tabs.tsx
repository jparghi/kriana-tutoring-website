"use client";

import { useState } from "react";
import subjects from "../data/subjects.json";
import { motion } from "../lib/motion";
import { SectionHeading } from "./section-heading";

export function SubjectTabs() {
  const [activeSubject, setActiveSubject] = useState(subjects[0]);

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start">
          <div className="lg:w-1/3">
            <SectionHeading
              eyebrow="Subjects"
              align="left"
              title="Reimagined course tiles for every learner"
              description="Inspired by The7's vibrant grids, each subject card pairs pastel gradients with crisp copy to make choosing a pathway effortless."
            />
            <div className="mt-8 space-y-3">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => setActiveSubject(subject)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition ${
                    activeSubject.id === subject.id
                      ? "border-brand-sky/70 bg-white text-brand-sky shadow-sm"
                      : "border-transparent bg-transparent text-slate-500 hover:border-brand-sky/40 hover:bg-white"
                  }`}
                >
                  <span className="text-sm font-semibold uppercase tracking-[0.3em]">{subject.title}</span>
                  <span className="text-xs text-brand-rose">View</span>
                </button>
              ))}
            </div>
          </div>
          <div className="lg:w-2/3">
            <motion.div
              key={activeSubject.id}
              className={`relative overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br ${activeSubject.color} p-8 text-slate-950 shadow-[0_40px_100px_rgba(15,23,42,0.12)]`}
              initial={{ opacity: 0, transform: "translateY(20px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900">
                {activeSubject.title}
              </span>
              <h3 className="mt-6 text-3xl font-semibold">{activeSubject.tagline}</h3>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg">
                  <p className="text-xs uppercase tracking-[0.3em]">Levels</p>
                  <ul className="mt-4 space-y-2 text-sm font-medium text-slate-900">
                    {activeSubject.levels.map((level) => (
                      <li key={level} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                        {level}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg">
                  <p className="text-xs uppercase tracking-[0.3em]">Focus areas</p>
                  <ul className="mt-4 space-y-2 text-sm font-medium text-slate-900">
                    {activeSubject.focus.map((focus) => (
                      <li key={focus} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                        {focus}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
