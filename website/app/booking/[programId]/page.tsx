'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  getProgram, getActiveOfferings,
  formatOfferingDateRange, formatOfferingWeeklySchedule, isOfferingRequestWindowOpen, isOfferingSoldOut,
  statusBadgeClass, applyProgramDiscount,
} from '../../../lib/booking'
import { isRequestOnlyBookingFlow } from '../../../lib/booking-flow'
import BookingLayout from '../../../components/booking/BookingLayout'
import { BookingStepper } from '../../../components/booking/BookingStepper'
import { ROBOTICS_PACKAGES, getRoboticsPackage, isValidPackageId } from '../../../lib/robotics-packages.js'

const ROBOTICS_CATEGORY = 'Robotics'

function OfferingCard({ offering, program, onSelect }: { offering: any; program: any; onSelect: (s: any) => void }) {
  const soldOut = isOfferingSoldOut(offering)
  const requestWindowOpen = isOfferingRequestWindowOpen(offering)
  const hasWaitlist = soldOut && offering.waitlistEnabled && requestWindowOpen
  const dateRange = formatOfferingDateRange(offering)
  const tuition = Number(offering.tuitionCents ?? 0)
  const discount = applyProgramDiscount(tuition, program)

  return (
    <div className={`bg-white rounded-2xl border p-5 transition-all ${
      soldOut || !requestWindowOpen ? 'border-slate-100 opacity-80' : 'border-slate-200 hover:border-[#0c6162] hover:shadow-sm cursor-pointer'
    }`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h4 className="font-bold text-slate-800">{offering.title}</h4>
          {offering.location && (
            <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 shrink-0">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
              </svg>
              {offering.location}
            </p>
          )}
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
          requestWindowOpen ? statusBadgeClass(offering.status) : 'bg-slate-100 text-slate-600'
        }`}>
          {!requestWindowOpen ? 'Requests Closed' : soldOut ? 'Full' : 'Open'}
        </span>
      </div>

      <div className="space-y-1.5 text-sm text-slate-600 mb-4">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-400 shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {formatOfferingWeeklySchedule(offering)}
        </div>
        {dateRange && (
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-400 shrink-0">
              <path d="M8 2v3M16 2v3M3 9h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2z" />
            </svg>
            {dateRange}
          </div>
        )}
        {(offering.classCount > 0 || offering.durationMin) && (
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-400 shrink-0">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            {[
              offering.classCount > 0 ? `${offering.classCount} class${offering.classCount === 1 ? '' : 'es'}` : '',
              offering.durationMin ? `${offering.durationMin} min each` : '',
            ].filter(Boolean).join(' · ')}
          </div>
        )}
        {tuition > 0 && (
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <span aria-hidden="true" className="w-4 text-center text-slate-400">$</span>
            {discount.active ? (
              <span className="flex items-center gap-1.5">
                <span className="text-slate-400 line-through font-normal">${(tuition / 100).toFixed(2)}</span>
                <span className="text-orange-600">${(discount.finalCents / 100).toFixed(2)}</span>
                {offering.currency ?? 'CAD'} tuition
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  🏷️ {discount.label}
                </span>
              </span>
            ) : (
              <>${(tuition / 100).toFixed(2)} {offering.currency ?? 'CAD'} tuition</>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => onSelect(offering)}
        disabled={!requestWindowOpen || (soldOut && !offering.waitlistEnabled)}
        className={`mt-4 w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
          hasWaitlist
            ? 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
            : soldOut || !requestWindowOpen
              ? 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100'
              : 'text-white hover:opacity-90'
        }`}
        style={requestWindowOpen && !soldOut && !hasWaitlist ? { backgroundColor: '#0c6162' } : {}}
      >
        {hasWaitlist
          ? 'Join Waitlist'
          : !requestWindowOpen ? 'Requests Closed'
          : soldOut ? 'Full'
          : isRequestOnlyBookingFlow ? 'Request a Spot →' : 'Select This Program →'}
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

function PackageChooser({ programId }: { programId: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 mb-8">
      <h2 className="text-lg font-black text-slate-800">Choose a Class Package</h2>
      <p className="mt-1 text-sm text-slate-500">
        This program is offered as a fixed class package. Pick one to continue — each total is the complete package
        subtotal, not a monthly price, plus applicable taxes.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {ROBOTICS_PACKAGES.map(pkg => (
          <Link
            key={pkg.id}
            href={`/booking/${programId}?package=${pkg.id}`}
            className="flex flex-col rounded-xl border border-slate-200 p-5 transition-all hover:border-[#0c6162] hover:shadow-sm"
          >
            {pkg.badge && (
              <span className="mb-2 inline-flex w-fit rounded-full bg-[#0083CB]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0083CB]">
                {pkg.badge}
              </span>
            )}
            <p className="font-bold text-slate-800">{pkg.name}</p>
            <p className="mt-0.5 text-sm text-slate-500">{pkg.classCount} classes</p>
            <p className="mt-3 text-xl font-black text-slate-900">${(pkg.subtotalCents / 100).toFixed(0)}</p>
            <p className="text-xs text-slate-400">${(pkg.perClassCents / 100).toFixed(0)}/class · plus applicable taxes</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

function ProgramDetailContent() {
  const { programId } = useParams<{ programId: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [program, setProgram] = useState<any>(null)
  const [offerings, setOfferings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const prog = await getProgram(programId)
        setProgram(prog)
        setOfferings(prog ? await getActiveOfferings(prog) : [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [programId])

  const packageParam = searchParams.get('package') || ''
  const isRobotics = program?.category === ROBOTICS_CATEGORY
  const selectedPackage = isRobotics && isValidPackageId(packageParam) ? getRoboticsPackage(packageParam) : null

  function handleSelectOffering(offering: any) {
    const params = new URLSearchParams()
    if (offering.source === 'legacySession') params.set('sessionId', offering.id)
    else params.set('offeringId', offering.id)
    if (selectedPackage) params.set('package', selectedPackage.id)
    router.push(`/booking/${programId}/register?${params.toString()}`)
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

  const nextOffering = offerings[0]
  const listedTuition = Number(
    nextOffering?.tuitionCents
      || (program.isDepositOnly ? program.depositAmount : program.price)
      || 0
  )
  const colorClass = CATEGORY_COLORS[program.category] ?? 'bg-slate-100 text-slate-600'
  const headerDiscount = applyProgramDiscount(listedTuition, program)

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
            {program.discountActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm animate-pulse">
                🏷️ {program.discountLabel || 'Promotion'}
              </span>
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
              <p className="text-xs text-slate-400 mb-0.5">Tuition</p>
              {listedTuition > 0 ? (
                headerDiscount.active ? (
                  <p className="text-sm font-bold text-orange-600">
                    <span className="mr-1.5 text-xs font-normal text-slate-400 line-through">${(listedTuition / 100).toFixed(2)}</span>
                    ${(headerDiscount.finalCents / 100).toFixed(2)} {nextOffering?.currency ?? 'CAD'}
                  </p>
                ) : (
                  <p className="text-sm font-bold text-slate-700">${(listedTuition / 100).toFixed(2)} {nextOffering?.currency ?? 'CAD'}</p>
                )
              ) : (
                <p className="text-sm font-bold text-slate-700">{offerings.length > 0 ? 'Confirmed after review' : 'Schedule pending'}</p>
              )}
            </div>
            {!isRequestOnlyBookingFlow && program.isDepositOnly && program.price && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">Total Price</p>
                <p className="text-sm font-bold text-slate-700">${(program.price / 100).toFixed(2)} CAD</p>
              </div>
            )}
          </div>

          {isRequestOnlyBookingFlow && offerings.length > 0 && (
            <div className="mt-4 bg-[#e6f4f4] border border-[#0c6162]/15 rounded-xl px-4 py-3">
              <p className="text-sm text-[#0c6162] font-medium">
                No payment is due when you request a spot. We will confirm availability, placement and payment details separately.
              </p>
            </div>
          )}

          {!isRequestOnlyBookingFlow && program.isDepositOnly && (
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

      {isRobotics && !selectedPackage ? (
        <PackageChooser programId={programId} />
      ) : (
        <>
          {selectedPackage && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#0083CB]/25 bg-[#0083CB]/5 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#0083CB]">Selected Package</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-800">
                  {selectedPackage.name} — {selectedPackage.classCount} classes · ${(selectedPackage.perClassCents / 100).toFixed(0)}/class · $
                  {(selectedPackage.subtotalCents / 100).toFixed(0)} total (plus applicable taxes)
                </p>
              </div>
              <Link href={`/booking/${programId}`} className="text-xs font-semibold text-slate-500 hover:text-slate-700">
                Change package
              </Link>
            </div>
          )}

          <h2 className="text-lg font-black text-slate-800 mb-4">
            Weekly Program Schedules
            <span className="ml-2 text-sm font-normal text-slate-400">({offerings.length} published)</span>
          </h2>

          {offerings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <p className="font-semibold text-slate-600">The next schedule is still being planned</p>
              <p className="text-sm text-slate-400 mt-1">There is no registration form until real dates and times are published.</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm font-semibold">
                <Link href="/contact#consultation-form" className="rounded-xl bg-[#0c6162] px-4 py-2.5 text-white hover:opacity-90">
                  Ask About This Program
                </Link>
                <Link href="/booking" className="text-[#0c6162] hover:underline">← Browse other programs</Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {offerings.map(offering => (
                <OfferingCard key={offering.id} offering={offering} program={program} onSelect={handleSelectOffering} />
              ))}
            </div>
          )}
        </>
      )}
    </BookingLayout>
  )
}

export default function ProgramDetailPage() {
  return (
    <Suspense fallback={
      <BookingLayout backTo="/booking" backLabel="All Programs">
        <div className="flex items-center justify-center h-48 text-slate-400">Loading…</div>
      </BookingLayout>
    }>
      <ProgramDetailContent />
    </Suspense>
  )
}
