import type { Metadata } from "next";
import { WorksheetSearchExperience } from "../../components/worksheet-search-experience";
import { worksheetCatalog } from "../../data/worksheet-catalog";

export const metadata: Metadata = {
  title: "Free Ontario Math & Reading Worksheets JK–Grade 8 | Kriana",
  description:
    "Download free Ontario-aligned math and reading worksheets for JK to Grade 8. Curated by Kriana Tutoring educators in Ottawa — filter by grade, subject, and skill.",
  alternates: { canonical: "https://www.krianatutoring.com/worksheets" }
};

export default function WorksheetsPage() {
  return (
    <main className="relative mx-auto max-w-6xl space-y-16 px-6 pb-24 pt-6 sm:px-10 lg:pt-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-brand-sky/20 via-white/60 to-transparent" aria-hidden="true" />

        {/*<section className="relative overflow-hidden rounded-[48px] border border-white/70 bg-white/80 px-10 py-16 shadow-[0_36px_110px_rgba(15,23,42,0.16)] backdrop-blur-xl">
        <div className="absolute inset-x-10 top-10 -z-10 h-72 rounded-[40px] bg-gradient-to-r from-brand-sky/15 via-brand-rose/10 to-brand-amber/10 blur-3xl" aria-hidden="true" />
        <div className="max-w-3xl space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-sky">The worksheet galaxy</p>
          <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">An interactive studio for every grade</h1>
          <p className="text-base text-slate-600">
            Curate immersive, AI-ready worksheets that blend tactile making, inquiry, and inclusive storytelling. Browse by grade, surface subject-aligned experiences, and unlock the perfect learning flow with predictive search moments.
          </p>
        </div>
        <div className="mt-10 grid gap-6 text-sm text-slate-600 md:grid-cols-3">
          <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">JK – Grade 8</p>
            <p className="mt-2 text-slate-700">Continuum view of emergent to advanced competencies.</p>
          </div>
          <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">AI copilots</p>
            <p className="mt-2 text-slate-700">Each worksheet lists optional AI extensions for hybrid instruction.</p>
          </div>
          <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Search intelligence</p>
            <p className="mt-2 text-slate-700">Semantic filters and live signals surface the best-fit experiences fast.</p>
          </div>
        </div>
      </section>*/}


      <WorksheetSearchExperience worksheets={worksheetCatalog.filter((w) => w.gradeLevel !== "Grade 9")} />
    </main>
  );
}
