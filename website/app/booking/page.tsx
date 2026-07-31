'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getPrograms, getActiveSessions, SESSION_STATUS } from '../../lib/booking'
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
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${accent.bg} ${accent.text}`}>
      {category}
    </span>
  )
}

function ProgramCard({ program, sessions }: { program: any; sessions: any[] }) {
  const activeSessions = sessions.filter(s => s.status !== SESSION_STATUS.DRAFT && s.status !== SESSION_STATUS.CANCELLED)
  const allSoldOut = activeSessions.length > 0 && activeSessions.every(s => s.status === SESSION_STATUS.SOLD_OUT)
  const accent = CATEGORY_ACCENTS[program.category] ?? DEFAULT_ACCENT

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)]">
      <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: accent.bar }} />
      {program.imageUrl && (
        <div className="h-40 w-full shrink-0 overflow-hidden bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={program.imageUrl}
            alt={program.title}
            className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <CategoryBadge category={program.category} />
          {allSoldOut && (
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">Sold Out</span>
          )}
        </div>
        <h3 className="text-lg font-bold text-slate-900">{program.title}</h3>
        {program.partnerName && (
          <p className="text-xs text-slate-400 mt-0.5 mb-2">with {program.partnerName}</p>
        )}
        {program.description && (
          <p className="text-sm text-slate-500 mt-2 mb-4 leading-relaxed line-clamp-2">{program.description}</p>
        )}
        <div className="space-y-1.5 text-sm text-slate-600">
          {program.ageRange && (
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-400 shrink-0">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              Ages {program.ageRange}
            </div>
          )}
          {program.gradeRange && (
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-400 shrink-0">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              Grades {program.gradeRange}
            </div>
          )}
          {activeSessions.length > 0 && (
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-400 shrink-0">
                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              {activeSessions.length} session{activeSessions.length !== 1 ? 's' : ''} available
            </div>
          )}
        </div>
      </div>
      <div className="px-6 pb-6 flex items-center justify-between border-t border-slate-100 pt-4 mt-1">
        <div>
          <span className="text-xl font-black text-slate-900">
            ${((program.isDepositOnly ? program.depositAmount : program.price) / 100).toFixed(0)}
          </span>
          {program.isDepositOnly && <span className="text-xs text-slate-400 ml-1">deposit</span>}
        </div>
        <Link
          href={`/booking/${program.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white shadow-sm transition-all duration-200 active:scale-95 hover:shadow-[0_4px_16px_rgba(12,97,98,0.35)]"
          style={{ backgroundColor: '#0c6162' }}
        >
          View &amp; Book
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

export default function BookingPage() {
  const [programs, setPrograms] = useState<any[]>([])
  const [sessionsByProgram, setSessionsByProgram] = useState<Record<string, any[]>>({})
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
          map[p.id] = await getActiveSessions(p.id)
        }))
        setSessionsByProgram(map)
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
            <span className="text-slate-700">Book a Program</span>
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
              Choose a program and book your child&apos;s spot online in just a few minutes.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 h-64 animate-pulse" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((program: any) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  sessions={sessionsByProgram[program.id] ?? []}
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
