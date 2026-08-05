'use client'

import { useId, useState } from 'react'

type ClassDateEntry = { date: string; label: string }
type ExcludedDateEntry = { date: string; name: string; label?: string }
type ClassScheduleResult = {
  classDates: ClassDateEntry[]
  excludedDates: ExcludedDateEntry[]
  startDate: string | null
  endDate: string | null
}

/**
 * Accessible disclosure showing a package's exact itemized class dates,
 * plus any Ontario statutory holidays (or other closures) skipped along the
 * way. A single native <button aria-expanded> + <div role="region"> pair is
 * the correct minimal accessible pattern here (WAI-ARIA "disclosure") —
 * no custom keyboard handling is needed since a <button> is already fully
 * operable by keyboard (Enter/Space) and announced correctly by screen
 * readers via aria-expanded/aria-controls.
 */
export function ClassScheduleDisclosure({
  schedule,
  packageName,
  defaultOpen = false,
}: {
  schedule: ClassScheduleResult | null | undefined
  packageName?: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  if (!schedule || schedule.classDates.length === 0) return null

  const count = schedule.classDates.length
  const title = packageName ? `Your ${count} ${packageName} classes` : `Your ${count} classes`

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-semibold text-[#0c6162] transition-colors hover:bg-slate-50 rounded-xl"
      >
        <span>{open ? 'Hide' : 'View'} all class dates</span>
        <svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div id={panelId} role="region" aria-label={title} className="border-t border-slate-100 px-4 py-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
          <ol className="space-y-1 text-sm text-slate-700">
            {schedule.classDates.map((entry, i) => (
              <li key={entry.date} className="flex gap-2">
                <span className="shrink-0 font-semibold text-slate-400">{i + 1}.</span>
                <span>{entry.label}</span>
              </li>
            ))}
          </ol>

          {schedule.excludedDates.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3">
              {schedule.excludedDates.map(entry => (
                <li key={entry.date} className="text-xs text-slate-500">
                  No class {entry.label ?? entry.date} — {entry.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
