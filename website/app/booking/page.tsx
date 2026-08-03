'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getPrograms, getActiveOfferings, isOfferingSoldOut, formatOfferingWeeklySchedule, applyProgramDiscount } from '../../lib/booking'
import { isRequestOnlyBookingFlow } from '../../lib/booking-flow'
import { Footer } from '../../components/footer'

const CATEGORY_ACCENTS: Record<string, { bg: string; text: string; bar: string }> = {
  'Demo Class':      { bg: 'bg-sky-50',    text: 'text-sky-700',    bar: '#0EA5E9' },
  'Robotics':         { bg: 'bg-purple-50', text: 'text-purple-700', bar: '#7C3AED' },
  'Workshop':         { bg: 'bg-teal-50',   text: 'text-teal-700',   bar: '#00B8A9' },
  'Birthday Party':   { bg: 'bg-pink-50',   text: 'text-pink-700',   bar: '#ED174B' },
  'Summer Camp':      { bg: 'bg-orange-50', text: 'text-orange-700', bar: '#F2A100' },
  'PA Day Workshop':  { bg: 'bg-green-50',  text: 'text-green-700',  bar: '#16A34A' },
  'After School':     { bg: 'bg-indigo-50', text: 'text-indigo-700', bar: '#4338CA' },
  'Parent & Child':   { bg: 'bg-rose-50',   text: 'text-rose-700',   bar: '#FF8A65' },
  'Tutoring':         { bg: 'bg-blue-50',   text: 'text-blue-700',   bar: '#0083CB' },
}
const DEFAULT_ACCENT = { bg: 'bg-slate-100', text: 'text-slate-600', bar: '#94A3B8' }

function CategoryBadge({ category }: { category: string }) {
  const accent = CATEGORY_ACCENTS[category] ?? DEFAULT_ACCENT
  return (
    <span className={`inline-block truncate text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm ${accent.bg} ${accent.text}`}>
      {category}
    </span>
  )
}

function ScheduleBadge({ offerings, hasSchedule }: { offerings: any[]; hasSchedule: boolean }) {
  if (!hasSchedule) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        Coming soon
      </span>
    )
  }

  return (
    <div className="group/sched relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0c6162] bg-[#0c6162]/10 px-2 py-1 rounded-full transition-colors hover:bg-[#0c6162]/20"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        {offerings.length} schedule{offerings.length !== 1 ? 's' : ''}
      </button>

      <div className="pointer-events-none invisible absolute left-1/2 top-full z-20 mt-2 w-52 -translate-x-1/2 translate-y-1 rounded-xl border border-slate-200 bg-white p-3 opacity-0 shadow-xl transition-all duration-150 group-hover/sched:visible group-hover/sched:translate-y-0 group-hover/sched:opacity-100">
        <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-slate-200 bg-white" />
        <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">Upcoming Schedule</p>
        <ul className="space-y-2">
          {offerings.slice(0, 3).map((offering: any) => (
            <li key={offering.id} className="text-xs">
              <p className="font-semibold text-slate-700">{formatOfferingWeeklySchedule(offering)}</p>
              {offering.location && <p className="text-slate-400 truncate">{offering.location}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ProgramCard({ program, offerings }: { program: any; offerings: any[] }) {
  const hasSchedule = offerings.length > 0
  const allSoldOut = hasSchedule && offerings.every(isOfferingSoldOut)
  const nextOffering = offerings[0]
  const listedTuition = nextOffering?.tuitionCents
    || (program.isDepositOnly ? program.depositAmount : program.price)
    || 0
  const discount = applyProgramDiscount(listedTuition, program)
  const accent = CATEGORY_ACCENTS[program.category] ?? DEFAULT_ACCENT
  const ageGrade = [
    program.ageRange ? `Ages ${program.ageRange}` : '',
    program.gradeRange ?? '',
  ].filter(Boolean).join(' · ')

  return (
    <div className="group flex flex-col overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(15,23,42,0.1)]">
      {program.imageUrl ? (
        <div className="relative overflow-hidden rounded-t-xl">
          <div className="h-1 w-full shrink-0" style={{ backgroundColor: accent.bar }} />
          <div className="h-24 w-full shrink-0 overflow-hidden bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={program.imageUrl}
              alt={program.title}
              className="h-full w-full object-contain p-2.5 transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="absolute left-1.5 top-2.5">
            <CategoryBadge category={program.category} />
          </div>
          {allSoldOut && (
            <span className="absolute right-1.5 top-2.5 shrink-0 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full shadow-sm">Sold Out</span>
          )}
        </div>
      ) : (
        <div className="h-1 w-full shrink-0 rounded-t-xl" style={{ backgroundColor: accent.bar }} />
      )}
      <div className="flex flex-1 flex-col p-3">
        {!program.imageUrl && (
          <div className="mb-1.5 flex items-start justify-between gap-1.5">
            <CategoryBadge category={program.category} />
            {allSoldOut && (
              <span className="shrink-0 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Sold Out</span>
            )}
          </div>
        )}
        <h3 className="text-sm font-bold leading-snug text-slate-900 line-clamp-2">{program.title}</h3>
        {program.partnerName && (
          <p className="text-[10px] text-slate-400">with {program.partnerName}</p>
        )}
        {ageGrade && (
          <p className="mt-1 text-[11px] font-medium text-slate-500">{ageGrade}</p>
        )}

        <div className="mt-2">
          <ScheduleBadge offerings={offerings} hasSchedule={hasSchedule} />
        </div>

        <div className="mt-auto pt-3 flex items-end justify-between gap-2 border-t border-slate-100 mt-3">
          {listedTuition > 0 ? (
            <div>
              {discount.active ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[11px] text-slate-400 line-through">${(listedTuition / 100).toFixed(0)}</span>
                  <span className="text-base font-black text-orange-600">${(discount.finalCents / 100).toFixed(0)}</span>
                </div>
              ) : (
                <span className="text-base font-black text-slate-900">${(listedTuition / 100).toFixed(0)}</span>
              )}
              {discount.active && (
                <span className="mt-1 flex w-fit items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
                  🏷️ {discount.label}
                </span>
              )}
            </div>
          ) : (
            <span className="max-w-[6.5rem] text-[10px] font-semibold leading-snug text-slate-500">
              {hasSchedule ? 'Confirmed after review' : 'TBA'}
            </span>
          )}
          <Link
            href={`/booking/${program.id}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all duration-200 active:scale-95 hover:shadow-[0_4px_12px_rgba(12,97,98,0.35)]"
            style={{ backgroundColor: '#0c6162' }}
          >
            {hasSchedule ? (isRequestOnlyBookingFlow ? 'View' : 'Book') : 'View'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3 w-3 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function BookingPage() {
  const [programs, setPrograms] = useState<any[]>([])
  const [offeringsByProgram, setOfferingsByProgram] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    const categoryParam = new URLSearchParams(window.location.search).get('category')
    if (categoryParam) setSelectedCategory(categoryParam)

    async function load() {
      try {
        const progs = await getPrograms({ activeOnly: true })
        setPrograms(progs)
        const map: Record<string, any[]> = {}
        await Promise.all(progs.map(async (p: any) => {
          map[p.id] = await getActiveOfferings(p)
        }))
        setOfferingsByProgram(map)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const categories = ['All', ...Array.from(new Set(programs.map((p: any) => p.category).filter(Boolean)))]
  const filtered = selectedCategory === 'All' ? programs : programs.filter((p: any) => p.category === selectedCategory)

  return (
    <>
      <main className="min-h-screen bg-white text-slate-900">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-6xl px-6 pt-6 sm:px-10">
          <nav aria-label="Breadcrumb" className="text-xs font-semibold text-slate-500">
            <Link href="/" className="hover:text-brand-sky">
              Home
            </Link>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-slate-700">Programs &amp; Schedules</span>
          </nav>
        </div>

        {/* Header */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-brand-sky/10 to-white px-6 pb-10 pt-8 sm:px-10">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(0,131,203,0.7) 1px,transparent 1px),linear-gradient(90deg,rgba(0,131,203,0.7) 1px,transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />
            <div className="absolute -left-32 top-0 h-[320px] w-[320px] rounded-full bg-brand-sky/15 blur-3xl" />
          </div>
          <div className="mx-auto max-w-6xl">
            <h1 className="text-3xl font-bold text-[#0A2D5A] sm:text-4xl">Programs &amp; Activities</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              {isRequestOnlyBookingFlow
                ? 'Choose a program and request a place for your child. We will review availability and contact you with next steps.'
                : 'Choose a program and book your child\'s spot online in just a few minutes.'}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6 pb-16 sm:px-10">
          {!loading && categories.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    selectedCategory === cat
                      ? 'text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  style={selectedCategory === cat ? { backgroundColor: '#0c6162' } : {}}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-white rounded-xl border border-slate-100 h-56 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-8 py-16 text-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 mx-auto mb-3">
                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <p className="font-semibold text-slate-700 mb-1">No programs available right now</p>
              <p className="text-sm text-slate-500">Check back soon — new programs are added regularly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map((program: any) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  offerings={offeringsByProgram[program.id] ?? []}
                />
              ))}
            </div>
          )}

          <div className="mt-12 text-center text-sm text-slate-500">
            Looking up a previous booking?{' '}
            <Link href="/my-bookings" className="text-[#0c6162] font-semibold hover:underline">
              My Bookings →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
