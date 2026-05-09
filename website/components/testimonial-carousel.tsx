"use client";

import { useRef } from "react";
import testimonials from "../data/testimonials.json";
import { motion } from "../lib/motion";
import { SectionHeading } from "./section-heading";

function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M10 8C6.686 8 4 10.686 4 14v10h10V14H7.5C7.5 11.515 9.015 10 11.5 10L10 8zm14 0c-3.314 0-6 2.686-6 6v10h10V14h-6.5C21.5 11.515 23.015 10 25.5 10L24 8z" />
    </svg>
  );
}

export function TestimonialCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 360;
    scrollRef.current.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/80 to-white py-24">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-12 top-10 h-64 w-64 rounded-full bg-brand-rose/15 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-72 w-72 rounded-full bg-brand-sky/20 blur-3xl" />
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="Parent voices"
          title="Families trust Kriana Tutoring to unlock confidence"
          description="Every word below comes straight from recent Google reviews—capturing the warmth, patience, and progress parents see each week."
        />

        {/* Scroll controls */}
        <div className="mt-10 hidden items-center justify-end gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:border-brand-sky hover:text-brand-sky hover:shadow-[0_4px_16px_rgba(74,144,226,0.2)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:border-brand-sky hover:text-brand-sky hover:shadow-[0_4px_16px_rgba(74,144,226,0.2)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Cards scroll container */}
        <div
          ref={scrollRef}
          className="mt-6 flex snap-x gap-6 overflow-x-auto pb-4 sm:mt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {testimonials.map((testimonial, index) => (
            <motion.blockquote
              key={testimonial.name}
              className="group flex min-h-[380px] w-[82vw] max-w-[30rem] shrink-0 snap-start flex-col gap-5 rounded-3xl border border-slate-200/80 bg-white p-8 text-left text-slate-700 shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-sky/30 hover:shadow-[0_20px_48px_rgba(15,23,42,0.12)] sm:w-[28rem]"
              initial={{ opacity: 0, transform: "translateY(24px)" }}
              whileInView={{ opacity: 1, transform: "translateY(0px)" }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: index * 0.12 }}
            >
              {/* Gradient top accent */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-3xl bg-gradient-to-r from-transparent via-brand-sky/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Stars + quote icon row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <svg key={starIndex} className="h-4 w-4 fill-amber-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <QuoteIcon className="h-8 w-8 text-brand-sky/20" />
              </div>

              <p className="flex-1 text-[1.05rem] leading-relaxed text-slate-600">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              <footer className="flex items-center gap-3 border-t border-slate-100 pt-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-sky/20 to-brand-teal/20 text-sm font-bold text-brand-sky">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{testimonial.name}</div>
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-400">{testimonial.role}</div>
                </div>
                <div className="ml-auto">
                  <svg className="h-5 w-5 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href="https://g.page/r/CTJcA-X2_wUzEAE/review"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-brand-sky to-brand-teal px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_28px_rgba(74,144,226,0.4)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_12px_36px_rgba(74,144,226,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky focus-visible:ring-offset-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Read more reviews on Google
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
