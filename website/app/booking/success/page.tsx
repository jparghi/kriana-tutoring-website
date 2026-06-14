'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getRegistration, getProgram, getSession, formatDateTime } from '../../../lib/booking'
import BookingLayout from '../../../components/booking/BookingLayout'
import { BookingStepper } from '../../../components/booking/BookingStepper'

function buildGoogleCalendarUrl({ title, startDateTime, endDateTime, location, description }: any) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const start = startDateTime?.toDate ? startDateTime.toDate() : new Date(startDateTime)
  const end = endDateTime?.toDate
    ? endDateTime.toDate()
    : endDateTime ? new Date(endDateTime) : new Date(start.getTime() + 60 * 60 * 1000)
  const params = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${fmt(start)}/${fmt(end)}`, details: description ?? '', location: location ?? '' })
  return `https://calendar.google.com/calendar/render?${params}`
}

function buildIcsContent({ title, startDateTime, endDateTime, location, description }: any) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const start = startDateTime?.toDate ? startDateTime.toDate() : new Date(startDateTime)
  const end = endDateTime?.toDate ? endDateTime.toDate() : endDateTime ? new Date(endDateTime) : new Date(start.getTime() + 60 * 60 * 1000)
  return ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',`DTSTART:${fmt(start)}`,`DTEND:${fmt(end)}`,`SUMMARY:${title}`,`DESCRIPTION:${description ?? ''}`,`LOCATION:${location ?? ''}`, 'END:VEVENT','END:VCALENDAR'].join('\r\n')
}

function AddToCalendar({ program, session, childName }: { program: any; session: any; childName: string }) {
  const [open, setOpen] = useState(false)
  if (!session?.startDateTime) return null
  const title = `${program?.title ?? 'Kriana Program'} — ${childName}`
  const description = `Booking for ${childName} · Kriana Tutoring · info@krianatutoring.com`
  const location = session.location ?? ''

  function downloadIcs() {
    const content = buildIcsContent({ title, startDateTime: session.startDateTime, endDateTime: session.endDateTime, location, description })
    const blob = new Blob([content], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'kriana-booking.ics'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="inline-flex items-center justify-center gap-2 text-sm font-bold px-5 py-3 sm:py-2.5 rounded-xl border border-[#0c6162] text-[#0c6162] hover:bg-[#e6f4f4] transition-all w-full sm:w-auto">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        Add to Calendar
      </button>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 z-10 overflow-hidden">
          <a href={buildGoogleCalendarUrl({ title, startDateTime: session.startDateTime, endDateTime: session.endDateTime, location, description })} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setOpen(false)}>
            Google Calendar
          </a>
          <button onClick={() => { downloadIcs(); setOpen(false) }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100">
            Apple / Outlook (.ics)
          </button>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-400 shrink-0 text-sm">{label}</span>
      <span className="font-semibold text-slate-700 text-right text-sm">{value}</span>
    </div>
  )
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const registrationId = searchParams.get('registration_id')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!registrationId) { setLoading(false); return }
      try {
        const reg = await getRegistration(registrationId)
        if (!reg) { setLoading(false); return }
        const [prog, sess] = await Promise.all([getProgram(reg.programId), getSession(reg.sessionId)])
        setData({ reg, prog, sess })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [registrationId])

  return (
    <BookingLayout maxWidth="max-w-lg">
      <BookingStepper step={4} />
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#e6f4f4' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#0c6162" strokeWidth={2.5} className="w-8 h-8"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">You&apos;re registered!</h1>
        <p className="text-slate-500">
          A confirmation email has been sent to{' '}
          {data?.reg?.parentEmail ? <strong>{data.reg.parentEmail}</strong> : 'your email address'}.
        </p>
      </div>

      {!loading && data && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #0c6162, #0d9e9f)' }} />
          <div className="p-6">
            <h2 className="font-bold text-slate-800 mb-3">Booking Summary</h2>
            <Row label="Program" value={data.prog?.title} />
            <Row label="Session" value={data.sess?.title} />
            <Row label="Date & Time" value={formatDateTime(data.sess?.startDateTime)} />
            {data.sess?.location && <Row label="Location" value={data.sess.location} />}
            <Row label="Child" value={data.reg?.childName} />
            <Row label="Parent" value={data.reg?.parentName} />
            {data.reg?.amountPaid > 0 && <Row label="Amount Paid" value={`$${(data.reg.amountPaid / 100).toFixed(2)} CAD`} />}
            <div className="pt-3 mt-1"><span className="text-xs font-mono text-slate-400">Ref: {registrationId}</span></div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-stretch sm:flex-row sm:items-center sm:justify-center gap-3">
        {!loading && data && <AddToCalendar program={data.prog} session={data.sess} childName={data.reg?.childName} />}
        <Link href="/booking" className="inline-flex items-center justify-center gap-2 text-sm font-bold px-5 py-3 sm:py-2.5 rounded-xl text-white transition-all hover:opacity-90 w-full sm:w-auto" style={{ backgroundColor: '#0c6162' }}>
          Browse More Programs →
        </Link>
      </div>
    </BookingLayout>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-400">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  )
}
