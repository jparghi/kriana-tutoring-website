"use client";

import Link from "next/link";
import events from "../data/events.json";
import { motion } from "../lib/motion";
import { CalendarStarIcon } from "./icons";

export function EventBanner() {
  return (
    <section className="bg-gradient-to-tr from-brand-sky/10 via-white to-brand-rose/10 py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-rose shadow-sm">
              Events & workshops
            </span>
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Seasonal pop-ups that extend learning beyond the studio</h2>
            <p className="text-sm text-slate-600 sm:text-base">
              Borrowing from The7 banner carousels, each event tile highlights the essentials—date, format, and CTA—in a clean, mobile-first layout.
            </p>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-700 transition hover:border-brand-rose hover:text-brand-rose"
          >
            View calendar
          </Link>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {events.map((eventItem, index) => (
            <motion.div
              key={eventItem.title}
              className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 text-left text-slate-600 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
              initial={{ opacity: 0, transform: "translateY(30px)" }}
              whileInView={{ opacity: 1, transform: "translateY(0px)" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-amber/80 text-slate-950">
                <CalendarStarIcon className="h-6 w-6" />
              </span>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-sky">{eventItem.date}</p>
              <h3 className="text-xl font-semibold text-slate-900">{eventItem.title}</h3>
              <p className="text-sm text-slate-600">{eventItem.description}</p>
              <div className="mt-auto flex items-center justify-between text-xs uppercase tracking-[0.3em] text-brand-rose">
                <span>{eventItem.mode}</span>
                <span>{eventItem.cta}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
