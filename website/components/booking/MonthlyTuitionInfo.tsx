'use client'

import { useId, useState } from 'react'

/**
 * Accessible info toggle for "Monthly tuition" — a visible button rather
 * than hover-only tooltip, so it works with keyboard and touch. Same
 * minimal WAI-ARIA disclosure pattern as ClassScheduleDisclosure (a native
 * <button aria-expanded> + <div role="region"> pair).
 */
export function MonthlyTuitionInfo() {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <span className="inline-flex items-center align-middle">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={e => {
          // This toggle is sometimes rendered inside a card that's itself a
          // <Link> (e.g. PackageChooser) — without stopping propagation,
          // clicking it would also navigate away via the surrounding link.
          e.preventDefault()
          e.stopPropagation()
          setOpen(o => !o)
        }}
        aria-label="What does monthly tuition mean?"
        className="ml-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-500 hover:border-[#0c6162] hover:text-[#0c6162]"
      >
        i
      </button>
      {open && (
        <span
          id={panelId}
          role="region"
          aria-label="What does monthly tuition mean?"
          className="absolute z-10 mt-8 w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-xs font-normal normal-case text-slate-600 shadow-lg"
        >
          Monthly tuition is averaged across the full learning path and is not based on the number of classes in an
          individual calendar month.
        </span>
      )}
    </span>
  )
}
