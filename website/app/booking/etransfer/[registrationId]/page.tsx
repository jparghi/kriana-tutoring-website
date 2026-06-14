'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getRegistration, getProgram, getSession, formatDateTime } from '../../../../lib/booking'
import BookingLayout from '../../../../components/booking/BookingLayout'
import { BookingStepper } from '../../../../components/booking/BookingStepper'

const ETRANSFER_EMAIL = process.env.NEXT_PUBLIC_ETRANSFER_EMAIL || 'info@krianatutoring.com'
const HOLD_HOURS = 24

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

export default function ETransferPage() {
  const { registrationId } = useParams<{ registrationId: string }>()
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

  const amount = data ? `$${(data.reg.amountDue / 100).toFixed(2)} CAD` : ''
  const message = data ? `Kriana ${data.prog?.title ?? 'Registration'} - ${data.reg.childName}` : ''

  return (
    <BookingLayout maxWidth="max-w-xl">
      <BookingStepper step={3} />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #0c6162, #0d9e9f)' }} />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#e6f4f4' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#0c6162" strokeWidth={2} className="w-5 h-5">
                <rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800">Send Your E-Transfer</h1>
              <p className="text-sm text-slate-400">Spot held for {HOLD_HOURS} hours</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
            <p className="text-sm text-amber-800 font-medium">
              Your seat is temporarily reserved. Send the e-transfer within <strong>{HOLD_HOURS} hours</strong> to confirm your spot.
            </p>
          </div>

          {loading ? (
            <div className="text-slate-400 text-sm py-4">Loading…</div>
          ) : !data ? (
            <div className="text-slate-500 text-sm py-4">Registration not found.</div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Send E-Transfer To</p>
                <div className="bg-[#e6f4f4] rounded-xl border border-[#0c6162]/20">
                  <CopyRow label="Email Address" value={ETRANSFER_EMAIL} mono />
                  <CopyRow label="Amount" value={amount} />
                  <CopyRow label="Message / Note" value={message} />
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide px-4 pt-4 pb-2">Booking Summary</p>
                <div className="px-4 pb-4">
                  <InfoRow label="Program" value={data.prog?.title} />
                  <InfoRow label="Session" value={data.sess?.title} />
                  <InfoRow label="Date" value={formatDateTime(data.sess?.startDateTime)} />
                  {data.sess?.location && <InfoRow label="Location" value={data.sess.location} />}
                  <InfoRow label="Child" value={data.reg?.childName} />
                  <InfoRow label="Parent" value={data.reg?.parentName} />
                </div>
              </div>
              <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed">
                  No further action needed after sending — our team will verify and send a confirmation email within one business day.
                  Questions? <a href="mailto:info@krianatutoring.com" className="text-[#0c6162] font-semibold hover:underline">info@krianatutoring.com</a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="text-center">
        <Link href="/booking" className="text-sm font-semibold text-[#0c6162] hover:underline">Browse More Programs →</Link>
      </div>
    </BookingLayout>
  )
}
