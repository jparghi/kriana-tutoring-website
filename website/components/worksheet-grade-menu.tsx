"use client";

import { useEffect, useRef, useState } from "react";
import { publishedGradeOrder as gradeOrder, type GradeLevel } from "../data/worksheet-catalog";

interface WorksheetGradeMenuProps {
  activeGrade: GradeLevel | null;
  onGradeClick?: (grade: GradeLevel) => void;
}

export function WorksheetGradeMenu({ activeGrade, onGradeClick }: WorksheetGradeMenuProps) {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !activeGrade) {
      return;
    }

    const activeElement = containerRef.current.querySelector<HTMLButtonElement>(`[data-grade="${activeGrade}"]`);
    if (activeElement) {
      activeElement.scrollIntoView({ block: "nearest" });
    }
  }, [activeGrade]);

  return (
    <>
      <aside
        ref={containerRef}
        className="hidden lg:block lg:sticky lg:top-32 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto lg:rounded-3xl lg:border lg:border-white/80 lg:bg-white/70 lg:p-4 lg:shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:backdrop-blur-xl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Browse by grade</span>
          <span className={`h-2 w-2 rounded-full transition ${isHovered ? "bg-brand-sky" : "bg-slate-300"}`} aria-hidden="true" />
        </div>
        <nav className="space-y-2">
          {gradeOrder.map((grade) => {
            const isActive = grade === activeGrade;
            return (
              <button
                key={grade}
                type="button"
                data-grade={grade}
                onClick={() => onGradeClick?.(grade)}
                className={`group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                  isActive
                    ? "bg-gradient-to-r from-brand-sky/20 via-white to-brand-rose/20 text-slate-900 shadow-inner"
                    : "bg-transparent text-slate-600 hover:bg-white/70 hover:text-slate-900"
                }`}
              >
                <span>{grade}</span>
                <span
                  className={`h-2 w-10 rounded-full transition group-hover:w-16 ${
                    isActive ? "bg-brand-amber" : "bg-slate-200 group-hover:bg-brand-sky"
                  }`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 lg:hidden">
        <div className="w-full min-w-0 overflow-hidden rounded-3xl border border-white/70 bg-white/70 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Jump to grade</p>
          <nav className="mt-3 flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
            {gradeOrder.map((grade) => {
              const isActive = grade === activeGrade;
              return (
                <button
                  key={grade}
                  type="button"
                  data-grade={grade}
                  onClick={() => onGradeClick?.(grade)}
                  className={`snap-start rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] transition ${
                    isActive
                      ? "border-brand-amber bg-brand-amber/20 text-slate-900"
                      : "border-white/70 bg-white/80 text-slate-600 hover:border-brand-sky/50 hover:text-slate-900"
                  }`}
                >
                  {grade}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
