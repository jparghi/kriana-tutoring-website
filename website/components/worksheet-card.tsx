import Link from "next/link";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import type { Worksheet } from "../data/worksheet-catalog";

interface WorksheetCardProps {
  worksheet: Worksheet;
}

export function WorksheetCard({ worksheet }: WorksheetCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white transition hover:border-slate-300 hover:shadow-md">
      <div className={`h-1 w-full flex-none ${worksheet.previewPalette.accent}`} />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            {worksheet.gradeLevel} · {worksheet.subject}
          </span>
          <Link
            href={worksheet.downloadUrl}
            title={`Download ${worksheet.title}`}
            className="flex-none rounded-lg bg-slate-900 p-1.5 text-white transition hover:bg-brand-sky"
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
          {worksheet.title}
        </h3>

        <div className="flex flex-wrap gap-1">
          {worksheet.skills.slice(0, 2).map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
            >
              {skill}
            </span>
          ))}
          {worksheet.skills.length > 2 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
              +{worksheet.skills.length - 2}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
