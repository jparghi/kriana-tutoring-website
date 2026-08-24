'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import BookingLayout from '../../../components/booking/BookingLayout'
import { BookingStepper } from '../../../components/booking/BookingStepper'
import { ClassScheduleDisclosure } from '../../../components/booking/ClassScheduleDisclosure'
import { getOffering, getPackageClassSchedule } from '../../../lib/booking'
import { getRoboticsPackage, isValidPackageId } from '../../../lib/robotics-packages.js'

function RequestReceivedContent() {
  const searchParams = useSearchParams()
  const program = searchParams.get('program')
  const reference = searchParams.get('reference')
  const offeringId = searchParams.get('offeringId') ?? ''
  const packageIdParam = searchParams.get('package') ?? ''
  const programId = searchParams.get('programId') ?? ''

  const selectedPackage = isValidPackageId(programId, packageIdParam) ? getRoboticsPackage(programId, packageIdParam) : null
  const [packageSchedule, setPackageSchedule] = useState<any>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!offeringId || !selectedPackage) return
      const offering = await getOffering(offeringId)
      if (!cancelled && offering) setPackageSchedule(getPackageClassSchedule(offering, selectedPackage))
    }
    load()
    return () => { cancelled = true }
    // selectedPackage is derived fresh each render from packageIdParam, which
    // is what actually identifies it — depending on packageIdParam directly
    // avoids re-running this effect on every unrelated re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offeringId, packageIdParam])

  return (
    <BookingLayout maxWidth="max-w-lg">
      <BookingStepper step={3} />

      <div className="text-center mb-7">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[#e6f4f4]">
          <svg viewBox="0 0 24 24" fill="none" stroke="#0c6162" strokeWidth={2.5} className="w-8 h-8" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-3">Your request was received</h1>
        <p className="text-slate-500 leading-relaxed">
          Thank you{program ? <> for your interest in <strong className="text-slate-700">{program}</strong></> : ''}.
          {' '}Our team will review availability and contact you with the next steps.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #0c6162, #0d9e9f)' }} />
        <div className="p-6 space-y-5">
          <div className="bg-[#e6f4f4] border border-[#0c6162]/15 rounded-xl px-4 py-3">
            <p className="text-sm text-[#0c6162] font-bold">No payment is due today.</p>
            <p className="text-sm text-slate-600 mt-1">
              Submitting a request does not confirm a seat. We will confirm the schedule, placement, and payment details separately.
            </p>
          </div>

          {selectedPackage && packageSchedule && packageSchedule.classDates.length > 0 && (
            <div className="rounded-xl border border-[#0083CB]/25 bg-[#0083CB]/5 px-4 py-3.5">
              <p className="text-xs font-bold uppercase tracking-wide text-[#0083CB] mb-1">
                {selectedPackage.name} Package — {packageSchedule.classDates.length} classes
              </p>
              <p className="text-sm text-slate-600 mb-3">
                {packageSchedule.startDate && packageSchedule.endDate
                  ? `${packageSchedule.classDates[0].label} through ${packageSchedule.classDates[packageSchedule.classDates.length - 1].label}`
                  : null}
              </p>
              <ClassScheduleDisclosure schedule={packageSchedule} packageName={selectedPackage.name} />
            </div>
          )}

          <div>
            <h2 className="text-sm font-black text-slate-800 mb-3">What happens next</h2>
            <ol className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-3"><span className="font-black text-[#0c6162]">1.</span><span>We review program availability and your child&apos;s information.</span></li>
              <li className="flex gap-3"><span className="font-black text-[#0c6162]">2.</span><span>We contact you to confirm placement or discuss another suitable option.</span></li>
              <li className="flex gap-3"><span className="font-black text-[#0c6162]">3.</span><span>Payment instructions are provided only after a place is offered.</span></li>
            </ol>
          </div>

          {reference && (
            <div className="bg-slate-50 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Request Reference</p>
              <p className="font-mono font-bold text-slate-700">{reference}</p>
            </div>
          )}

          <p className="text-xs text-slate-500 leading-relaxed">
            Questions? Email <a href="mailto:info@krianatutoring.com" className="text-[#0c6162] font-semibold hover:underline">info@krianatutoring.com</a>.
          </p>
        </div>
      </div>

      <div className="text-center">
        <Link href="/booking" className="text-sm font-semibold text-[#0c6162] hover:underline">Browse More Programs →</Link>
      </div>
    </BookingLayout>
  )
}

export default function RequestReceivedPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-400">Loading…</div>}>
      <RequestReceivedContent />
    </Suspense>
  )
}
