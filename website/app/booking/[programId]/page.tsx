'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getProgram, getActiveSessions, getAvailableSeats,
  formatDateTime, SESSION_STATUS, statusBadgeClass,
} from '../../../lib/booking'
import BookingLayout from '../../../components/booking/BookingLayout'
import { BookingStepper } from '../../../components/booking/BookingStepper'

function CapacityBar({ session }: { session: any }) {
  const total = session.capacity ?? 0
  if (!total) return null
  const confirmed = session.confirmedCount ?? 0
  const available = Math.max(0, total - confirmed)
  const pct = Math.round((confirmed / total) * 100)
  const low = available <= 3 && available > 0

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs mb-1">
        <span className={`font-semibold ${low ? 'text-orange-600' : 'text-slate-500'}`}>
          {available === 0 ? 'Sold out' : low ? `Only ${available} spot${available !== 1 ? 's' : ''} left!` : `${available} of ${total} spots left`}
        </span>
        <span className="text-slate-400">{pct}% full</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-400' : low ? 'bg-orange-400' : 'bg-[#0c6162]'}`}
          style={{ width: `${Math.max(4, pct)}%` }}
        />
      </div>
    </div>
  )
}

function SessionCard({ session, onSelect }: { session: any; onSelect: (s: any) => void }) {
  const available = getAvailableSeats(session)
  const soldOut = session.status === SESSION_STATUS.SOLD_OUT || available === 0
  const hasWaitlist = soldOut && session.waitlistEnabled

  return (
    <div className={`bg-white rounded-2xl border p-5 transition-all ${
      soldOut ? 'border-slate-100 opacity-80' : 'border-slate-200 hover:border-[#0c6162] hover:shadow-sm cursor-pointer'
    }`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h4 className="font-bold text-slate-800">{session.title}</h4>
          {session.location && (
            <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 shrink-0">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
              </svg>
              {session.location}
            </p>
          )}
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusBadgeClass(session.status)}`}>
          {session.status}
        </span>
      </div>

      <div className="space-y-1.5 text-sm text-slate-600 mb-4">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-400 shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {formatDateTime(session.startDateTime)}
          {session.endDateTime && <span className="text-slate-400">– {formatDateTime(session.endDateTime)}</span>}
        </div>
        {session.durationMin && (
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-400 shrink-0">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            {session.durationMin} min
          </div>
        )}
      </div>

      <CapacityBar session={session} />

      <button
        onClick={() => onSelect(session)}
        disabled={soldOut && !session.waitlistEnabled}
        className={`mt-4 w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
          hasWaitlist
            ? 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
            : soldOut
              ? 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100'
              : 'text-white hover:opacity-90'
        }`}
        style={!soldOut && !hasWaitlist ? { backgroundColor: '#0c6162' } : {}}
      >
        {hasWaitlist ? 'Join Waitlist' : soldOut ? 'Sold Out' : 'Select This Session →'}
      </button>
    </div>
  )
}

const CATEGORY_COLORS: Record<string, string> = {
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

export default function ProgramDetailPage() {
  const { programId } = useParams<{ programId: string }>()
  const router = useRouter()
  const [program, setProgram] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [prog, sess] = await Promise.all([
          getProgram(programId),
          getActiveSessions(programId),
        ])
        setProgram(prog)
        setSessions(sess)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [programId])

  function handleSelectSession(session: any) {
    router.push(`/booking/${programId}/register?sessionId=${session.id}`)
  }

  if (loading) return (
    <BookingLayout backTo="/booking" backLabel="All Programs">
      <div className="flex items-center justify-center h-48 text-slate-400">Loading…</div>
    </BookingLayout>
  )

  if (!program) return (
    <BookingLayout backTo="/booking" backLabel="All Programs">
      <div className="text-center py-20 text-slate-400">
        Program not found.{' '}
        <Link href="/booking" className="text-[#0c6162] font-semibold hover:underline">Browse programs →</Link>
      </div>
    </BookingLayout>
  )

  const price = program.isDepositOnly ? program.depositAmount : program.price
  const colorClass = CATEGORY_COLORS[program.category] ?? 'bg-slate-100 text-slate-600'

  return (
    <BookingLayout backTo="/booking" backLabel="All Programs">
      <BookingStepper step={1} />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #0c6162, #0d9e9f)' }} />
        {program.imageUrl && (
          <div className="h-56 w-full shrink-0 overflow-hidden bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={program.imageUrl} alt={program.title} className="h-full w-full object-contain p-6" />
          </div>
        )}
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {program.category && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${colorClass}`}>{program.category}</span>
            )}
            {program.partnerName && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">with {program.partnerName}</span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-3">{program.title}</h1>

          {program.description && (
            <p className="text-slate-600 mb-6 leading-relaxed text-base">{program.description}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
            {program.ageRange && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">Age Range</p>
                <p className="text-sm font-bold text-slate-700">{program.ageRange}</p>
              </div>
            )}
            {program.gradeRange && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">Grades</p>
                <p className="text-sm font-bold text-slate-700">{program.gradeRange}</p>
              </div>
            )}
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-0.5">{program.isDepositOnly ? 'Deposit' : 'Price'}</p>
              <p className="text-sm font-bold text-slate-700">{price ? `$${(price / 100).toFixed(2)} CAD` : 'Free'}</p>
            </div>
            {program.isDepositOnly && program.price && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">Total Price</p>
                <p className="text-sm font-bold text-slate-700">${(program.price / 100).toFixed(2)} CAD</p>
              </div>
            )}
          </div>

          {program.isDepositOnly && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-sm text-amber-800 font-medium">
                A deposit of ${(program.depositAmount / 100).toFixed(2)} CAD is required to secure your spot.
                {program.price && ` The remaining balance ($${((program.price - program.depositAmount) / 100).toFixed(2)} CAD) is due before the event.`}
              </p>
            </div>
          )}

          {program.refundPolicyText && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Refund Policy</p>
              <p className="text-sm text-slate-600">{program.refundPolicyText}</p>
            </div>
          )}
        </div>
      </div>

      <h2 className="text-lg font-black text-slate-800 mb-4">
        Choose a Session
        <span className="ml-2 text-sm font-normal text-slate-400">({sessions.length} available)</span>
      </h2>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <p className="font-semibold text-slate-600">No sessions available right now</p>
          <p className="text-sm text-slate-400 mt-1">Check back soon or contact us to be notified.</p>
          <Link href="/booking" className="mt-4 inline-block text-sm font-semibold text-[#0c6162] hover:underline">← Browse other programs</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sessions.map(session => (
            <SessionCard key={session.id} session={session} onSelect={handleSelectSession} />
          ))}
        </div>
      )}
    </BookingLayout>
  )
}
