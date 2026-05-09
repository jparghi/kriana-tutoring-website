"use client";

import { Fragment, useMemo, useState, useDeferredValue, useEffect, useRef } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { publishedGradeOrder as gradeOrder, gradeToIndex, type GradeLevel, type PracticeTest, type TestType, type Difficulty } from "../data/exam-catalog";
import { ExamCard } from "./exam-card";

interface ExamSearchExperienceProps {
  tests: PracticeTest[];
}

const TYPE_OPTIONS: TestType[] = ["Mini Quiz", "Quiz", "Test", "Assessment"];
const DIFFICULTY_OPTIONS: Difficulty[] = ["Easy", "Medium", "Hard"];

function normalise(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function scoreTest(query: string, test: PracticeTest) {
  const terms = query.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean);
  if (terms.length === 0) return 0;
  let score = 0;
  for (const term of terms) {
    const n = normalise(term);
    if (normalise(test.title).includes(n)) score += 8;
    if (normalise(test.summary).includes(n)) score += 4;
    if (normalise(test.subject).includes(n)) score += 3;
    if (normalise(test.gradeLevel).includes(n)) score += 3;
    for (const s of test.skills) if (normalise(s).includes(n)) score += 2;
    for (const t of test.topics) if (normalise(t).includes(n)) score += 1.5;
  }
  return score;
}

function groupByGrade(entries: PracticeTest[]) {
  return entries.reduce<Record<GradeLevel, PracticeTest[]>>((acc, t) => {
    const bucket = acc[t.gradeLevel] ?? [];
    bucket.push(t);
    acc[t.gradeLevel] = bucket;
    return acc;
  }, {} as Record<GradeLevel, PracticeTest[]>);
}

function slugifyGrade(grade: GradeLevel) {
  return grade.toLowerCase().replace(/\s+/g, "-");
}

const DIFFICULTY_PILL: Record<Difficulty, string> = {
  Easy: "border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:border-emerald-400",
  Medium: "border-amber-200 bg-amber-50/60 text-amber-700 hover:border-amber-400",
  Hard: "border-rose-200 bg-rose-50/60 text-rose-700 hover:border-rose-400",
};

const DIFFICULTY_ACTIVE: Record<Difficulty, string> = {
  Easy: "border-emerald-400 bg-emerald-100 text-emerald-800",
  Medium: "border-amber-400 bg-amber-100 text-amber-800",
  Hard: "border-rose-400 bg-rose-100 text-rose-800",
};

export function ExamSearchExperience({ tests }: ExamSearchExperienceProps) {
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<TestType[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([]);
  const [activeGrade, setActiveGrade] = useState<GradeLevel | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const base = tests.filter((t) => {
      const typeOk = selectedTypes.length === 0 || selectedTypes.includes(t.type);
      const diffOk = selectedDifficulties.length === 0 || selectedDifficulties.includes(t.difficulty);
      return typeOk && diffOk;
    });
    if (!deferredQuery.trim()) return groupByGrade(base);
    const scored = base
      .map((t) => ({ test: t, score: scoreTest(deferredQuery, t) }))
      .filter((e) => e.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (gradeToIndex.get(a.test.gradeLevel) ?? 0) - (gradeToIndex.get(b.test.gradeLevel) ?? 0);
      });
    return groupByGrade(scored.map((e) => e.test));
  }, [tests, selectedTypes, selectedDifficulties, deferredQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target) {
          setActiveGrade((visible.target as HTMLElement).dataset.grade as GradeLevel);
        }
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    Object.values(sectionRefs.current).forEach((s) => s && observer.observe(s));
    return () => observer.disconnect();
  }, [filtered]);

  const handleGradeClick = (grade: GradeLevel) => {
    sectionRefs.current[grade]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleType = (type: TestType) =>
    setSelectedTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);

  const toggleDiff = (diff: Difficulty) =>
    setSelectedDifficulties((prev) => prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff]);

  const gradesWithTests = gradeOrder.filter((g) => (filtered[g] ?? []).length > 0);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(200px,240px)_1fr]">

      {/* Sticky grade nav */}
      <aside className="hidden lg:block">
        <div className="sticky top-28 space-y-1">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Jump to grade</p>
          {gradeOrder.map((grade) => {
            const count = (filtered[grade] ?? []).length;
            const isActive = activeGrade === grade;
            return (
              <button
                key={grade}
                type="button"
                onClick={() => handleGradeClick(grade)}
                disabled={count === 0}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition
                  ${count === 0 ? "cursor-default text-slate-300" : isActive
                    ? "bg-brand-sky/15 text-[#003B73]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
              >
                <span>{grade}</span>
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? "bg-brand-sky/20 text-brand-sky" : "bg-slate-100 text-slate-400"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main content */}
      <div className="space-y-16">

        {/* Search + filter panel */}
        <section className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-[0_32px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="mb-6 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-sky/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-sky">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
              Practice Test Library
            </div>
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
              Find the right test for any grade
            </h2>
          </div>

          {/* Search bar */}
          <div className="relative flex items-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-4 shadow-sm focus-within:ring-2 focus-within:ring-brand-sky/40">
            <MagnifyingGlassIcon className="h-5 w-5 flex-none text-brand-sky" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by subject, topic, or skill…"
              className="h-10 w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {/* Type filter */}
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 font-semibold uppercase tracking-[0.28em] text-white">
              Type
            </span>
            {TYPE_OPTIONS.map((type) => {
              const active = selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`rounded-full border px-4 py-2 font-semibold uppercase tracking-[0.28em] transition
                    ${active
                      ? "border-brand-sky bg-brand-sky/20 text-slate-900"
                      : "border-white/70 bg-white/70 text-slate-600 hover:border-brand-sky/40 hover:text-slate-900"
                    }`}
                >
                  {type}
                </button>
              );
            })}
          </div>

          {/* Difficulty filter */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 font-semibold uppercase tracking-[0.28em] text-white">
              Difficulty
            </span>
            {DIFFICULTY_OPTIONS.map((diff) => {
              const active = selectedDifficulties.includes(diff);
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => toggleDiff(diff)}
                  className={`rounded-full border px-4 py-2 font-semibold uppercase tracking-[0.28em] transition
                    ${active ? DIFFICULTY_ACTIVE[diff] : DIFFICULTY_PILL[diff]}`}
                >
                  {diff}
                </button>
              );
            })}
          </div>

          {(selectedTypes.length > 0 || selectedDifficulties.length > 0) && (
            <button
              type="button"
              onClick={() => { setSelectedTypes([]); setSelectedDifficulties([]); }}
              className="mt-3 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 transition hover:border-brand-rose/50 hover:text-brand-rose"
            >
              Clear filters
            </button>
          )}
        </section>

        {/* Grade sections */}
        {gradesWithTests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-12 text-center">
            <p className="text-sm text-slate-500">No tests match the current filters. Try adjusting your search or filters.</p>
          </div>
        ) : (
          gradeOrder.map((grade) => {
            const testsForGrade = filtered[grade] ?? [];
            if (testsForGrade.length === 0) return null;
            return (
              <Fragment key={grade}>
                <section
                  id={slugifyGrade(grade)}
                  ref={(el) => { sectionRefs.current[grade] = el; }}
                  data-grade={grade}
                  className="scroll-mt-32 space-y-8"
                >
                  <header className="flex items-center gap-3 border-b border-slate-200 pb-4">
                    <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                      {grade}
                    </span>
                    <h3 className="text-base font-semibold text-slate-900">
                      {grade === "JK" ? "Junior Kindergarten" : grade === "SK" ? "Senior Kindergarten" : `${grade} Practice Tests`}
                    </h3>
                    <span className="ml-auto text-xs text-slate-400">
                      {testsForGrade.length} {testsForGrade.length === 1 ? "test" : "tests"}
                    </span>
                  </header>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {testsForGrade.map((test) => (
                      <ExamCard key={test.id} test={test} />
                    ))}
                  </div>
                </section>
              </Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}
