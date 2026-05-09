import Link from "next/link";
import { ArrowDownTrayIcon, ClockIcon } from "@heroicons/react/24/outline";
import type { PracticeTest } from "../data/exam-catalog";

interface ExamCardProps {
  test: PracticeTest;
}

const DIFFICULTY_STYLE: Record<string, string> = {
  Easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Hard: "bg-rose-50 text-rose-700 border-rose-200",
};

const TYPE_STYLE: Record<string, string> = {
  "Mini Quiz": "bg-sky-50 text-sky-700",
  Quiz: "bg-blue-50 text-blue-700",
  Test: "bg-indigo-50 text-indigo-700",
  Assessment: "bg-violet-50 text-violet-700",
};

export function ExamCard({ test }: ExamCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white transition hover:border-slate-300 hover:shadow-md">
      <div className={`h-1 w-full flex-none ${test.previewPalette.accent}`} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
          {test.gradeLevel} · {test.subject}
        </span>

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
          {test.title}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${DIFFICULTY_STYLE[test.difficulty]}`}>
            {test.difficulty}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_STYLE[test.type]}`}>
            {test.type}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <ClockIcon className="h-3 w-3" />
            {test.duration}
          </span>
          <span>{test.questionsCount} questions</span>
        </div>
      </div>

      {/* Download buttons — full-width row at the bottom */}
      <div className="flex border-t border-slate-100">
        <Link
          href={test.downloadUrl}
          title="Download test"
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-white transition hover:opacity-90 ${test.previewPalette.accent}`}
        >
          <ArrowDownTrayIcon className="h-3.5 w-3.5" />
          Test
        </Link>
        {test.answerKeyUrl && (
          <>
            <div className="w-px bg-white/30" />
            <Link
              href={test.answerKeyUrl}
              title="Download answer key"
              className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition hover:opacity-80 ${test.previewPalette.accent} text-white opacity-70`}
            >
              <ArrowDownTrayIcon className="h-3.5 w-3.5" />
              Answer Key
            </Link>
          </>
        )}
        {!test.answerKeyUrl && (
          <Link
            href={test.downloadUrl}
            title="Download test"
            className="sr-only"
          />
        )}
      </div>
    </article>
  );
}
