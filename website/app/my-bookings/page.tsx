'use client'

import { useState } from 'react'
import Link from 'next/link'
import { REGISTRATION_STATUS, PAYMENT_METHOD, statusBadgeClass } from '../../lib/booking'

function formatDate(iso: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-CA', { timeZone: 'America/Toronto', dateStyle: 'medium', timeStyle: 'short' })
}

function StatusPill({ status }: { status: string }) {
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusBadgeClass(status)}`}>{status}</span>
}

export default function MyBookingsPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/get-my-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Something went wrong')
      setData(json)
      setSubmitted(email.trim())
    } catch (err: any) {
      setError(err.message || 'Could not look up bookings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f3f6fb' }}>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-2">
          <Link href="/booking" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0c6162] hover:underline mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            All Programs
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-800 mb-2">My Bookings</h1>
          <p className="text-slate-500">Enter your email address to look up your registrations.</p>
        </div>

        <form onSubmit={handleLookup} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <input
              type="email" required placeholder="jane@example.com" autoComplete="email"
              className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0c6162]/30 focus:border-[#0c6162] transition-all"
              value={email} onChange={e => setEmail(e.target.value)}
            />
            <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-all" style={{ backgroundColor: '#0c6162' }}>
              {loading ? 'Looking up…' : 'Look Up'}
            </button>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </form>

        {data && (
          <>
            {data.registrations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
                <p className="font-semibold text-slate-700 mb-1">No bookings found</p>
                <p className="text-sm text-slate-400">
                  No registrations found for <strong>{submitted}</strong>.
                  Make sure you&apos;re using the same email you registered with.
                </p>
                <Link href="/booking" className="mt-4 inline-block text-sm font-semibold text-[#0c6162] hover:underline">Browse programs →</Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  Found <strong>{data.registrations.length}</strong> registration{data.registrations.length !== 1 ? 's' : ''} for <strong>{submitted}</strong>
                </p>
                {data.registrations.map((reg: any) => {
                  const prog = data.programs?.[reg.programId]
                  const sess = data.sessions?.[reg.sessionId]
                  const isPending = reg.registrationStatus === REGISTRATION_STATUS.PENDING_PAYMENT
                  const etransfer = reg.paymentMethod === PAYMENT_METHOD.ETRANSFER
                  return (
                    <div key={reg.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #0c6162, #0d9e9f)' }} />
                      <div className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div>
                            <h3 className="font-bold text-slate-800">{prog?.title ?? 'Program'}</h3>
                            <p className="text-sm text-slate-500 mt-0.5">{reg.childName}</p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <StatusPill status={reg.registrationStatus} />
                            {etransfer && <StatusPill status={reg.paymentStatus} />}
                          </div>
                        </div>
                        {sess && (
                          <div className="text-sm text-slate-500 space-y-0.5 mb-3">
                            <p>{sess.title}</p>
                            {sess.startDateTime && <p>{formatDate(sess.startDateTime)}</p>}
                            {sess.location && <p>{sess.location}</p>}
                          </div>
                        )}
                        {reg.amountDue > 0 && (
                          <p className="text-sm font-semibold text-slate-700 mb-3">
                            ${(reg.amountDue / 100).toFixed(2)} CAD
                            {reg.isDepositOnly && <span className="text-slate-400 font-normal"> (deposit)</span>}
                            {reg.amountPaid > 0 && <span className="text-green-600 ml-1">· ${(reg.amountPaid / 100).toFixed(2)} paid</span>}
                          </p>
                        )}
                        {isPending && etransfer && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                            <strong>Action needed:</strong> Send e-transfer of ${(reg.amountDue / 100).toFixed(2)} CAD to{' '}
                            <span className="font-mono font-semibold">info@krianatutoring.com</span>. Your spot is held for 24 hours.
                          </div>
                        )}
                        <p className="text-xs font-mono text-slate-300 mt-2">Ref: {reg.id}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        <div className="text-center mt-8">
          <p className="text-sm text-slate-400">
            Questions about your booking?{' '}
            <a href="mailto:info@krianatutoring.com" className="text-[#0c6162] font-semibold hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  )
}
