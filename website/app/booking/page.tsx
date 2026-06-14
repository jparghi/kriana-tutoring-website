'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getPrograms, getActiveSessions, SESSION_STATUS } from '../../lib/booking'

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    'Demo Class':     'bg-sky-100 text-sky-700',
    'Robotics':       'bg-purple-100 text-purple-700',
    'Workshop':       'bg-teal-100 text-teal-700',
    'Birthday Party': 'bg-pink-100 text-pink-700',
    'Summer Camp':    'bg-orange-100 text-orange-700',
    'PA Day Workshop':'bg-green-100 text-green-700',
    'After School':   'bg-indigo-100 text-indigo-700',
    'Parent & Child': 'bg-rose-100 text-rose-700',
    'Tutoring':       'bg-blue-100 text-blue-700',
  }
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${colors[category] ?? 'bg-slate-100 text-slate-600'}`}>
      {category}
    </span>
  )
}

function ProgramCard({ program, sessions }: { program: any; sessions: any[] }) {
  const activeSessions = sessions.filter(s => s.status !== SESSION_STATUS.DRAFT && s.status !== SESSION_STATUS.CANCELLED)
  const allSoldOut = activeSessions.length > 0 && activeSessions.every(s => s.status === SESSION_STATUS.SOLD_OUT)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <CategoryBadge category={program.category} />
          {allSoldOut && (
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Sold Out</span>
          )}
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">{program.title}</h3>
        {program.partnerName && (
          <p className="text-xs text-slate-400 mb-2">with {program.partnerName}</p>
        )}
        {program.description && (
          <p className="text-sm text-slate-500 mb-4 line-clamp-2">{program.description}</p>
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
      <div className="px-6 pb-6 flex items-center justify-between">
        <div>
          <span className="text-xl font-black text-slate-800">
            ${((program.isDepositOnly ? program.depositAmount : program.price) / 100).toFixed(0)}
          </span>
          {program.isDepositOnly && <span className="text-xs text-slate-400 ml-1">deposit</span>}
        </div>
        <Link
          href={`/booking/${program.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all active:scale-95"
          style={{ backgroundColor: '#0c6162' }}
        >
          View & Book
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
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
    <div className="min-h-screen" style={{ backgroundColor: '#f3f6fb' }}>
      <div className="max-w-[1200px] mx-auto px-4 py-8 sm:py-12">

        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 mb-2">Programs & Activities</h1>
          <p className="text-slate-500">Choose a program and book your child&apos;s spot online.</p>
        </div>

        {!loading && categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
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
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 h-64 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 px-8 py-16 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 mx-auto mb-3">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <p className="font-semibold text-slate-700 mb-1">No programs available right now</p>
            <p className="text-sm text-slate-400">Check back soon — new programs are added regularly.</p>
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

        <div className="mt-10 text-center text-sm text-slate-400">
          Looking up a previous booking?{' '}
          <Link href="/my-bookings" className="text-[#0c6162] font-semibold hover:underline">My Bookings →</Link>
        </div>
      </div>
    </div>
  )
}
