"use client";

import { useState } from "react";
import Link from "next/link";
import worksheets from "../data/worksheets.json";
import { motion } from "../lib/motion";
import { SectionHeading } from "./section-heading";
import { MessageCircleIcon } from "./icons";

export function WorksheetCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeWorksheet = worksheets[activeIndex];

  return (
    <section className="bg-gradient-to-b from-white via-slate-50 to-amber-50/40 py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="Worksheets"
          title="A cinematic worksheet hub inspired by The7 course slider"
          description="Scroll through AI-ready lessons, download printable PDFs, or launch interactive rooms—no shortcodes required."
        />
        <div className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-brand-sky">
              <span>{activeWorksheet.subject}</span>
              <span>{activeWorksheet.grade}</span>
            </div>
            <motion.div
              key={activeWorksheet.id}
              className="mt-6 space-y-5"
              initial={{ opacity: 0, transform: "translateY(20px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              transition={{ duration: 0.45 }}
            >
              <h3 className="text-3xl font-semibold text-slate-900">{activeWorksheet.title}</h3>
              <p className="text-sm text-slate-600 sm:text-base">{activeWorksheet.description}</p>
              <div className="flex flex-wrap gap-2">
                {activeWorksheet.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-500">
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href={activeWorksheet.downloadUrl}
                className="inline-flex items-center justify-center rounded-full bg-brand-amber px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-brand-sky hover:text-slate-950"
              >
                Download PDF
              </Link>
            </motion.div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {worksheets.map((worksheet, index) => (
                <button
                  key={worksheet.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`rounded-3xl border px-4 py-5 text-left transition ${
                    activeIndex === index
                      ? "border-brand-amber bg-white text-slate-900 shadow-sm"
                      : "border-transparent bg-white/70 text-slate-600 hover:border-brand-amber/60 hover:bg-white"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-sky">{worksheet.grade}</p>
                  <p className="mt-3 text-sm font-semibold">{worksheet.title}</p>
                </button>
              ))}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-sky/20 text-brand-sky">
                  <MessageCircleIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Ask the Tutor</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Launch our AI copilot beside any worksheet to get step-by-step hints, alternate explanations, or bilingual support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
