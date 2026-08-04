'use client'

import { useState } from 'react'
import Link from 'next/link'
import { REGISTRATION_STATUS, PAYMENT_METHOD, statusBadgeClass } from '../../lib/booking'
import { isRequestOnlyBookingFlow } from '../../lib/booking-flow'
import { Footer } from '../../components/footer'

function formatDate(iso: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-CA', { timeZone: 'America/Toronto', dateStyle: 'medium', timeStyle: 'short' })
}

function StatusPill({ status }: { status: string }) {
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadgeClass(status)}`}>{status}</span>
}

function LegacyMyBookingsPage() {
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
    <>
      <main className="min-h-screen bg-white text-slate-900">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-6xl px-6 pt-6 sm:px-10">
          <nav aria-label="Breadcrumb" className="text-xs font-semibold text-slate-500">
            <Link href="/" className="hover:text-brand-sky">
              Home
            </Link>
            <span className="mx-2 text-slate-300">/</span>
            <Link href="/booking" className="hover:text-brand-sky">
              Book a Program
            </Link>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-slate-700">My Bookings</span>
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
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold text-[#0A2D5A] sm:text-4xl">My Bookings</h1>
            <p className="mt-3 text-base text-slate-600">
              Enter your email address to look up your registrations.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-2xl px-6 pb-16 sm:px-10">
          <form onSubmit={handleLookup} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Email Address <span className="text-[#ED174B]">*</span>
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email" required placeholder="jane@example.com" autoComplete="email"
                className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0c6162]/30 focus:border-[#0c6162] transition-all"
                value={email} onChange={e => setEmail(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-sm transition-all duration-200 disabled:opacity-50 hover:shadow-[0_4px_16px_rgba(12,97,98,0.35)]"
                style={{ backgroundColor: '#0c6162' }}
              >
                {loading ? 'Looking up…' : 'Look Up'}
              </button>
            </div>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </form>

          {data && (
            <>
              {data.registrations.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-8 py-16 text-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 mx-auto mb-3">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  <p className="font-semibold text-slate-700 mb-1">No bookings found</p>
                  <p className="text-sm text-slate-500">
                    No registrations found for <strong>{submitted}</strong>.
                    Make sure you&apos;re using the same email you registered with.
                  </p>
                  <Link href="/booking" className="mt-4 inline-block text-sm font-semibold text-[#0c6162] hover:underline">
                    Browse programs →
                  </Link>
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
                      <div key={reg.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
                        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #0c6162, #0d9e9f)' }} />
                        <div className="p-6">
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                            <div>
                              <h3 className="font-bold text-slate-900">{prog?.title ?? 'Program'}</h3>
                              <p className="text-sm text-slate-500 mt-0.5">{reg.childName}</p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <StatusPill status={reg.registrationStatus} />
                              {etransfer && <StatusPill status={reg.paymentStatus} />}
                            </div>
                          </div>
                          {sess && (
                            <div className="text-sm text-slate-600 space-y-1 mb-3">
                              <p className="font-medium text-slate-700">{sess.title}</p>
                              {sess.startDateTime && (
                                <div className="flex items-center gap-2 text-slate-500">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 shrink-0">
                                    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                                  </svg>
                                  {formatDate(sess.startDateTime)}
                                </div>
                              )}
                              {sess.location && (
                                <div className="flex items-center gap-2 text-slate-500">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 shrink-0">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
                                  </svg>
                                  {sess.location}
                                </div>
                              )}
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
                          <p className="text-xs font-mono text-slate-300 mt-3">Ref: {reg.id}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          <div className="text-center mt-10">
            <p className="text-sm text-slate-500">
              Questions about your booking?{' '}
              <a href="mailto:info@krianatutoring.com" className="text-[#0c6162] font-semibold hover:underline">
                Contact us
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

function RequestOnlyBookingsNotice() {
  return (
    <>
      <main className="min-h-[75vh] bg-white text-slate-900">
        <div className="mx-auto max-w-6xl px-6 pt-6 sm:px-10">
          <nav aria-label="Breadcrumb" className="text-xs font-semibold text-slate-500">
            <Link href="/" className="hover:text-brand-sky">Home</Link>
            <span className="mx-2 text-slate-300">/</span>
            <Link href="/booking" className="hover:text-brand-sky">Programs</Link>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-slate-700">My Requests</span>
          </nav>
        </div>

        <section className="px-6 py-14 sm:px-10">
          <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #0c6162, #0d9e9f)' }} />
            <div className="p-7 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-[#e6f4f4]">
                <svg viewBox="0 0 24 24" fill="none" stroke="#0c6162" strokeWidth={2} className="w-7 h-7" aria-hidden="true">
                  <path d="M4 4h16v16H4z" /><path d="m4 7 8 6 8-6" />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-slate-800 mb-3">Check your email for your request</h1>
              <p className="text-slate-500 leading-relaxed mb-3">
                For privacy, registration requests cannot be looked up here by email address.
                We send a request reference to the email used during registration.
              </p>
              <p className="text-sm text-slate-500 mb-7">
                Need an update? Contact us and include that reference so we can help quickly.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3">
                <a
                  href="mailto:info@krianatutoring.com"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-white text-sm font-bold hover:opacity-90"
                  style={{ backgroundColor: '#0c6162' }}
                >
                  Email Us
                </a>
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50"
                >
                  Browse Programs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default function MyBookingsPage() {
  if (isRequestOnlyBookingFlow) return <RequestOnlyBookingsNotice />
  return <LegacyMyBookingsPage />
}
