'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import BookingLayout from '../../../components/booking/BookingLayout'
import { BookingStepper } from '../../../components/booking/BookingStepper'
import { trackEvent } from '../../../lib/analytics'

const ETRANSFER_EMAIL = process.env.NEXT_PUBLIC_ETRANSFER_EMAIL || 'info@krianatutoring.com'
const HOLD_HOURS = 48
const DEMO_AMOUNT_LABEL = '$10.00 CAD'
const CONTACT_PHONE_DISPLAY = '613-400-6921'
const CONTACT_PHONE_HREF = 'tel:+16134006921'

function googleCalendarUrl({ eventTitle, eventLocation }: { eventTitle: string; eventLocation: string }) {
  // Fixed to the September 12, 2026 campaign date/time — this page only
  // ever renders for the demo e-transfer flow, and the offering's exact
  // start/end aren't passed through as machine-readable values today (only
  // the pre-formatted eventDate/eventTime display strings are). Uses the
  // Google Calendar template link (no new dependency), which works from a
  // tap in any mobile browser, including Facebook/Instagram in-app browsers.
  const dates = '20260912T103000/20260912T113000'
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle || 'Young Engineers Demo Class',
    dates,
    location: eventLocation || 'Kanata Baptist Church, 465 Hazeldean Rd, Kanata, ON K2L 1V1',
    ctz: 'America/Toronto',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function googleMapsUrl(eventLocation: string) {
  const query = eventLocation || 'Kanata Baptist Church, 465 Hazeldean Rd, Kanata, ON K2L 1V1'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

// Landed on directly after submit-demo-registration.js succeeds (see
// DemoRegisterForm in app/booking/[programId]/register/page.tsx) — every
// value shown here comes from that response + the program the family was
// already viewing, carried as query params. No Firestore read: demoRegistrations
// is staff-read-only per firestore.rules, so this page can't (and doesn't
// need to) look the registration back up. Payment is confirmed manually by
// staff once the e-transfer arrives — see the platform repo's
// "Confirm E-Transfer Received" action in DemoRegistrationsAdmin.jsx.
function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)
  if (!value) return null

  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-start sm:items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
        <p className={`text-sm font-semibold text-slate-800 break-all ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
      <button
        onClick={copy}
        className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-2 min-h-[40px] rounded-lg transition-all active:scale-95 ${copied ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
      >
        {copied ? (
          <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>Copied!</>
        ) : (
          <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy</>
        )}
      </button>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-semibold text-slate-700 text-right">{value}</span>
    </div>
  )
}

function DemoETransferContent() {
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference') ?? ''
  const programId = searchParams.get('programId') ?? ''
  const program = searchParams.get('program') ?? ''
  const eventTitle = searchParams.get('eventTitle') ?? ''
  const eventDate = searchParams.get('eventDate') ?? ''
  const eventTime = searchParams.get('eventTime') ?? ''
  const eventLocation = searchParams.get('eventLocation') ?? ''
  // Event title (not the internal program name) is the identifiable part of
  // the e-transfer note — must match the same field in the acknowledgement
  // email (see demo-email.js's etransferMessage()) so the note the parent
  // sees here is the same one they see in their inbox.
  const messageLabel = eventTitle || program
  const message = `${messageLabel || 'Kriana Demo'}${reference ? ` - ${reference}` : ''}`

  useEffect(() => {
    trackEvent('demo_payment_instructions_viewed', { offeringId: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <BookingLayout maxWidth="max-w-xl">
      <BookingStepper step={3} />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #F2A100, #ED174B)' }} />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#fef3e2' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#F2A100" strokeWidth={2} className="w-5 h-5">
                <rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800">Send Your $10 E-Transfer</h1>
              <p className="text-sm text-slate-400">Spot held for {HOLD_HOURS} hours</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
            <p className="text-sm text-amber-800 font-medium">
              Your child&apos;s demo spot is temporarily reserved. Send the e-transfer within <strong>{HOLD_HOURS} hours</strong> to confirm it.
            </p>
          </div>

          <div className="mb-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Send E-Transfer To</p>
            <div className="bg-[#e6f4f4] rounded-xl border border-[#0c6162]/20">
              <CopyRow label="Email Address" value={ETRANSFER_EMAIL} mono />
              <CopyRow label="Amount" value={DEMO_AMOUNT_LABEL} />
              <CopyRow label="Message / Note" value={message} />
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide px-4 pt-4 pb-2">Registration Summary</p>
            <div className="px-4 pb-4">
              <InfoRow label="Event" value={eventTitle || program} />
              <InfoRow label="Date" value={eventDate} />
              <InfoRow label="Time" value={eventTime} />
              <InfoRow label="Location" value={eventLocation} />
              <InfoRow label="Reference" value={reference} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href={googleCalendarUrl({ eventTitle, eventLocation })}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              Add to Calendar
            </a>
            {eventLocation && (
              <a
                href={googleMapsUrl(eventLocation)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                Open in Maps
              </a>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-bold text-amber-700">Try for $10 — Demo is FREE when you enroll.</p>
            <p className="text-sm text-amber-700 mt-1">
              Once your seat is confirmed and your child attends, your $10 is credited toward regular Young Engineers enrollment. No-shows do not receive this credit.
            </p>
          </div>

          <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500 leading-relaxed">
              Your child&apos;s spot is temporarily held. No further action needed after sending — our team will verify your e-transfer and confirm your seat by email.
              Questions or need to reach us? Call or text <a href={CONTACT_PHONE_HREF} className="text-[#0c6162] font-semibold hover:underline">{CONTACT_PHONE_DISPLAY}</a> or email <a href="mailto:info@krianatutoring.com" className="text-[#0c6162] font-semibold hover:underline">info@krianatutoring.com</a>
            </p>
          </div>
        </div>
      </div>
      <div className="text-center">
        {programId && (
          <Link href={`/booking/${programId}`} className="text-sm font-semibold text-[#0c6162] hover:underline mr-4">← Back to Program</Link>
        )}
        <Link href="/booking" className="text-sm font-semibold text-[#0c6162] hover:underline">Browse More Programs →</Link>
      </div>
    </BookingLayout>
  )
}

export default function DemoETransferPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-400">Loading…</div>}>
      <DemoETransferContent />
    </Suspense>
  )
}
