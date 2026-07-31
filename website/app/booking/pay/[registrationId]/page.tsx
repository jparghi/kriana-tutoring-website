'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getRegistration, getProgram, getSession, formatDateTime } from '../../../../lib/booking'
import { isRequestOnlyBookingFlow } from '../../../../lib/booking-flow'
import BookingLayout from '../../../../components/booking/BookingLayout'
import { BookingStepper } from '../../../../components/booking/BookingStepper'
import { LegacyPaymentDisabled } from '../../../../components/booking/LegacyPaymentDisabled'

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-semibold text-slate-700 text-right">{value}</span>
    </div>
  )
}

function LegacyPayPage() {
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

  const amount = data ? `$${(data.reg.amountDue / 100).toFixed(2)} CAD${data.reg.isDepositOnly ? ' deposit' : ''}` : ''
  const canPay = data?.prog?.stripePaymentLinkEnabled && !!data?.prog?.stripePaymentLinkUrl

  return (
    <BookingLayout maxWidth="max-w-xl">
      <BookingStepper step={3} />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #0c6162, #0d9e9f)' }} />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#e6f4f4' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#0c6162" strokeWidth={2} className="w-5 h-5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800">Registration Received</h1>
              <p className="text-sm text-slate-400">One more step — pay securely to complete your booking</p>
            </div>
          </div>

          {loading ? (
            <div className="text-slate-400 text-sm py-4">Loading…</div>
          ) : !data ? (
            <div className="text-slate-500 text-sm py-4">Registration not found.</div>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
                <p className="text-sm text-amber-800 font-medium">
                  Your registration has been received, but the seat is not fully confirmed until payment is received and verified.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl mb-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide px-4 pt-4 pb-2">Registration Details</p>
                <div className="px-4 pb-4">
                  <InfoRow label="Registration #" value={data.reg.registrationNumber} />
                  <InfoRow label="Student" value={data.reg.childName} />
                  <InfoRow label="Program" value={data.prog?.title} />
                  <InfoRow label="Schedule" value={data.sess ? `${data.sess.title} · ${formatDateTime(data.sess.startDateTime)}` : undefined} />
                  <InfoRow label="Amount Due" value={amount} />
                </div>
              </div>

              {canPay ? (
                <>
                  <a
                    href={data.prog.stripePaymentLinkUrl}
                    className="block w-full text-center py-4 rounded-xl text-white font-black text-base transition-all active:scale-[0.98] shadow-sm"
                    style={{ backgroundColor: '#0c6162' }}
                  >
                    Pay Securely by Credit Card →
                  </a>
                  <p className="text-center text-xs text-slate-400 mt-3">
                    You'll enter registration number <span className="font-mono font-semibold">{data.reg.registrationNumber}</span> on Stripe's payment page — please keep it handy.
                  </p>
                </>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-500">
                  Online payment isn't available for this program right now. Our team will follow up with alternate payment instructions —
                  keep your registration number <span className="font-mono font-semibold">{data.reg.registrationNumber}</span> for reference.
                </div>
              )}
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

export default function PayPage() {
  if (isRequestOnlyBookingFlow) return <LegacyPaymentDisabled />
  return <LegacyPayPage />
}
