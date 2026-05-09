"use client";

import { Fragment, useMemo, useState, useDeferredValue, useEffect, useRef } from "react";
import { ArrowRightIcon, MagnifyingGlassIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { publishedGradeOrder as gradeOrder, gradeToIndex, type GradeLevel, type Worksheet } from "../data/worksheet-catalog";
import { WorksheetCard } from "./worksheet-card";
import { WorksheetGradeMenu } from "./worksheet-grade-menu";

interface WorksheetSearchExperienceProps {
  worksheets: Worksheet[];
}

interface SearchResult {
  worksheet: Worksheet;
  score: number;
  highlights: string[];
}

function normalise(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function computeHighlights(query: string, worksheet: Worksheet) {
  const terms = query
    .split(/[\s,]+/)
    .map((term) => term.trim())
    .filter(Boolean);

  const highlights = new Set<string>();
  for (const term of terms) {
    const normalisedTerm = normalise(term);
    for (const candidate of [worksheet.title, worksheet.subject, ...worksheet.skills, ...worksheet.competencies]) {
      if (normalise(candidate).includes(normalisedTerm)) {
        highlights.add(candidate);
      }
    }
  }

  return Array.from(highlights);
}

function scoreWorksheet(query: string, worksheet: Worksheet) {
  const terms = query
    .split(/[\s,]+/)
    .map((term) => term.trim())
    .filter(Boolean);

  if (terms.length === 0) {
    return 0;
  }

  let score = 0;
  for (const term of terms) {
    const normalisedTerm = normalise(term);
    if (normalise(worksheet.title).includes(normalisedTerm)) {
      score += 8;
    }
    if (normalise(worksheet.summary).includes(normalisedTerm)) {
      score += 4;
    }
    for (const field of [worksheet.subject, worksheet.gradeLevel]) {
      if (normalise(field).includes(normalisedTerm)) {
        score += 3;
      }
    }
    for (const skill of worksheet.skills) {
      if (normalise(skill).includes(normalisedTerm)) {
        score += 2;
      }
    }
    for (const competency of worksheet.competencies) {
      if (normalise(competency).includes(normalisedTerm)) {
        score += 1.5;
      }
    }
  }

  return score;
}

function sortResults(results: SearchResult[]) {
  return results.sort((a, b) => {
    if (b.score === a.score) {
      const gradeDelta =
        (gradeToIndex.get(a.worksheet.gradeLevel) ?? 0) - (gradeToIndex.get(b.worksheet.gradeLevel) ?? 0);
      if (gradeDelta !== 0) {
        return gradeDelta;
      }
      return a.worksheet.title.localeCompare(b.worksheet.title);
    }
    return b.score - a.score;
  });
}

function slugifyGrade(grade: GradeLevel) {
  return grade.toLowerCase().replace(/\s+/g, "-");
}

export function WorksheetSearchExperience({ worksheets }: WorksheetSearchExperienceProps) {
  const [query, setQuery] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [activeGrade, setActiveGrade] = useState<GradeLevel | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const deferredQuery = useDeferredValue(query);

  const uniqueSubjects = useMemo(() => {
    const subjectSet = new Set<string>();
    worksheets.forEach((worksheet) => subjectSet.add(worksheet.subject));
    return Array.from(subjectSet).sort();
  }, [worksheets]);

  const displayedSubjects = useMemo(() => {
    const preferredSubjects = ["Mathematics", "English", "Science"];
    const hasPreferred = preferredSubjects.some((subject) => uniqueSubjects.includes(subject));

    if (hasPreferred) {
      const prioritizedSubjects = [
        ...preferredSubjects,
        ...uniqueSubjects.filter((subject) => !preferredSubjects.includes(subject))
      ];

      return prioritizedSubjects.slice(0, Math.max(preferredSubjects.length, 3));
    }

    if (uniqueSubjects.length === 0) {
      return preferredSubjects;
    }

    return uniqueSubjects.slice(0, 3);
  }, [uniqueSubjects]);

  useEffect(() => {
    setSelectedSubjects((previousSubjects) => {
      const filteredSubjects = previousSubjects.filter((subject) => displayedSubjects.includes(subject));
      return filteredSubjects.length === previousSubjects.length ? previousSubjects : filteredSubjects;
    });
  }, [displayedSubjects]);

  const filteredWorksheets = useMemo(() => {
    const formattedQuery = deferredQuery.trim();
    const baseFiltered = worksheets.filter((worksheet) => {
      const matchesSubject =
        selectedSubjects.length === 0 || selectedSubjects.includes(worksheet.subject);
      return matchesSubject;
    });

    if (!formattedQuery) {
      return {
        results: baseFiltered.map((worksheet) => ({ worksheet, score: 0, highlights: [] })),
        byGrade: groupByGrade(baseFiltered)
      };
    }

    const scoredResults: SearchResult[] = [];
    for (const worksheet of baseFiltered) {
      const score = scoreWorksheet(formattedQuery, worksheet);
      if (score > 0) {
        scoredResults.push({ worksheet, score, highlights: computeHighlights(formattedQuery, worksheet) });
      }
    }

    const orderedResults = sortResults(scoredResults);
    return {
      results: orderedResults,
      byGrade: groupByGrade(orderedResults.map((entry) => entry.worksheet))
    };
  }, [worksheets, selectedSubjects, deferredQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleGrade = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visibleGrade?.target) {
          setActiveGrade((visibleGrade.target as HTMLElement).dataset.grade as GradeLevel);
        }
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    Object.values(sectionRefs.current).forEach((section) => {
      if (section) {
        observer.observe(section);
      }
    });

    return () => observer.disconnect();
  }, [sectionRefs]);

  const handleGradeClick = (grade: GradeLevel) => {
    const section = sectionRefs.current[grade];
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(220px,260px)_1fr]">
      <WorksheetGradeMenu activeGrade={activeGrade} onGradeClick={handleGradeClick} />
      <div className="space-y-16">
        <section className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-[0_32px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-sky/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-sky">
                <SparklesIcon className="h-4 w-4" />
                Worksheet discovery
              </div>
              <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Search across every studio-grade worksheet</h2>
             {/* <p className="max-w-2xl text-sm text-slate-600">
                Blend tactile provocations, interdisciplinary projects, and printable studio moments. Filter by subject or simply describe the learning vibe you want—our semantic search ranks the closest matches instantly.
              </p>*/}
            </div>
            {/*<div className="w-full max-w-sm lg:w-80">
              <div className="rounded-3xl border border-brand-sky/30 bg-white/80 p-5 text-xs text-slate-600 shadow-inner">
                <p className="font-semibold text-slate-900">Live signal</p>
                <p className="mt-1">
                  {filteredWorksheets.results.length > 0
                    ? `${filteredWorksheets.results.length} rich experiences ready to deploy`
                    : "Describe a skill, theme, or competency to surface precision-matched tasks."}
                </p>
              </div>
            </div>*/}
          </div>
          <div className="mt-8 space-y-4">
            <div className="relative flex items-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-4 shadow-sm focus-within:ring-2 focus-within:ring-brand-sky/40">
              <MagnifyingGlassIcon className="h-5 w-5 text-brand-sky" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by skill, mood, or competency"
                className="h-10 w-full flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
              <ArrowRightIcon className="h-5 w-5 text-slate-300" />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 font-semibold uppercase tracking-[0.28em] text-white">
                Subjects
              </span>
              {displayedSubjects.map((subject) => {
                const isActive = selectedSubjects.includes(subject);
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() =>
                      setSelectedSubjects((prev) =>
                        prev.includes(subject) ? prev.filter((item) => item !== subject) : [...prev, subject]
                      )
                    }
                    className={`rounded-full border px-4 py-2 font-semibold uppercase tracking-[0.28em] transition ${
                      isActive
                        ? "border-brand-sky bg-brand-sky/20 text-slate-900"
                        : "border-white/70 bg-white/70 text-slate-600 hover:border-brand-sky/40 hover:text-slate-900"
                    }`}
                  >
                    {subject}
                  </button>
                );
              })}
              {selectedSubjects.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubjects([]);
                  }}
                  className="rounded-full border border-slate-200 px-4 py-2 font-semibold uppercase tracking-[0.28em] text-slate-500 transition hover:border-brand-rose/50 hover:text-brand-rose"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>

          {deferredQuery && filteredWorksheets.results.length > 0 ? (
            <div className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Semantic spotlight</p>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                {filteredWorksheets.results.slice(0, 4).map((entry) => (
                  <div
                    key={entry.worksheet.id}
                    className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-inner"
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-500">
                      <span>{entry.worksheet.gradeLevel}</span>
                      <span>{entry.score.toFixed(1)} signal</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-900">{entry.worksheet.title}</p>
                    <p className="mt-2 text-xs text-slate-600">{entry.worksheet.summary}</p>
                    {entry.highlights.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {entry.highlights.map((highlight) => (
                          <span
                            key={highlight}
                            className="rounded-full bg-brand-sky/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-sky"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {gradeOrder.map((grade) => {
          const worksheetsForGrade = filteredWorksheets.byGrade[grade] ?? [];
          return (
            <Fragment key={grade}>
              <section
                id={slugifyGrade(grade)}
                ref={(element) => {
                  sectionRefs.current[grade] = element;
                }}
                data-grade={grade}
                className="scroll-mt-32 space-y-8"
              >
                <header className="flex items-center gap-3 border-b border-slate-200 pb-4">
                  <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                    {grade}
                  </span>
                  <h3 className="text-base font-semibold text-slate-900">
                    {grade === "JK"
                      ? "Junior Kindergarten"
                      : grade === "SK"
                      ? "Senior Kindergarten"
                      : `${grade} Worksheets`}
                  </h3>
                  <span className="ml-auto text-xs text-slate-400">
                    {worksheetsForGrade.length} {worksheetsForGrade.length === 1 ? "worksheet" : "worksheets"}
                  </span>
                </header>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {worksheetsForGrade.length > 0 ? (
                    worksheetsForGrade.map((worksheet) => <WorksheetCard key={worksheet.id} worksheet={worksheet} />)
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-8 text-sm text-slate-500">
                      <p>
                        No worksheets match the current filters. Remove filters or describe a different competency to unlock more inspiration.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function groupByGrade(entries: Worksheet[]) {
  return entries.reduce<Record<GradeLevel, Worksheet[]>>((accumulator, worksheet) => {
    const bucket = accumulator[worksheet.gradeLevel] ?? [];
    bucket.push(worksheet);
    accumulator[worksheet.gradeLevel] = bucket;
    return accumulator;
  }, {} as Record<GradeLevel, Worksheet[]>);
}
