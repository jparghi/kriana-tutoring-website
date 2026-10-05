'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getProgram, getActiveOfferings, applyProgramDiscount } from '../../../lib/booking'
import { isRequestOnlyBookingFlow } from '../../../lib/booking-flow'
import { BIRTHDAY_PARTY_PATH, SCHEDULING_CONTACT_URL } from '../../../lib/site-links'
import BookingLayout from '../../../components/booking/BookingLayout'
import { getPubliclyVisiblePackages } from '../../../lib/robotics-packages.js'

const ROBOTICS_CATEGORY = 'Robotics'

// Class schedules are not published on the site — the timetable changes
// often and was confusing families — so this page describes the program
// (and, for robotics, its learning-path pricing) and asks parents to contact
// us to arrange a schedule instead of picking a published offering.
function ContactToSchedule({ programTitle }: { programTitle: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
      <h2 className="text-lg font-black text-slate-800">Contact us to schedule</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        Class days and times for {programTitle} change often, so we arrange each child&apos;s schedule directly.
        Reach out and we&apos;ll find a time that works for your family.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm font-semibold">
        <Link href={SCHEDULING_CONTACT_URL} className="rounded-xl bg-[#0c6162] px-5 py-2.5 text-white hover:opacity-90">
          Contact Us to Schedule
        </Link>
        <Link href="/booking" className="text-[#0c6162] hover:underline">← Browse other programs</Link>
      </div>
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

const PACKAGE_LOGOS: Record<string, string> = {
  builder: '/images/robotics/packages/builder-package-icon.png',
  engineer: '/images/robotics/packages/engineer-package-icon.png',
}

// Short, scannable descriptors for each publicly-offered plan — kept out of
// lib/robotics-packages.js since it's presentation copy, not pricing/business
// data.
const PACKAGE_DESCRIPTORS: Record<string, string[]> = {
  builder: ['Structured progression', 'Best starting point for most families'],
  engineer: ['Longer learning journey', 'Greater continuity and progression'],
}

function PackageOverview({ programId }: { programId: string }) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-[1.75rem] border border-slate-100 bg-gradient-to-br from-white via-[#0c6162]/[0.03] to-[#0083CB]/[0.05] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] md:p-9">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#0083CB]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[#0c6162]/10 blur-3xl" />

      <div className="relative">
        <h2 className="text-xl font-black text-slate-800 sm:text-2xl">Learning Paths &amp; Pricing</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
          Each path is a complete class package — the longer the path, the lower the per-class rate. Pay in full or
          in monthly payments at the same package rate.
        </p>
      </div>

      <div className="relative mx-auto mt-6 grid max-w-3xl gap-5 sm:grid-cols-2">
        {(() => {
          const packages = getPubliclyVisiblePackages(programId)

          return packages.map((pkg: any) => {
            // Engineer carries the "Best Value" badge and gets the
            // stronger/featured treatment — color, border and badge rather
            // than scaling, so mobile stacking is unaffected.
            const isFeatured = pkg.id === 'engineer'
            // A payment plan is only how the same package is paid for — the
            // package rate applies either way, so no "save when paid in full".
            const installments = pkg.paymentPlanInstallments

            return (
              <div
                key={pkg.id}
                className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${
                  isFeatured ? 'border-[#0083CB] ring-2 ring-[#0083CB]/25' : 'border-slate-200'
                }`}
              >
                {pkg.badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm ${
                      isFeatured ? 'bg-[#0083CB]' : 'bg-[#F2A100]'
                    }`}
                  >
                    {pkg.badge}
                  </span>
                )}

                {PACKAGE_LOGOS[pkg.id] ? (
                  <div className="flex h-24 items-center justify-center">
                    <Image
                      src={PACKAGE_LOGOS[pkg.id]}
                      alt={`${pkg.name} robotics package`}
                      width={180}
                      height={150}
                      className="h-24 w-auto object-contain"
                    />
                  </div>
                ) : (
                  <span className="text-3xl">⭐</span>
                )}
                <p className="mt-2 text-lg font-black text-slate-800">{pkg.name}</p>
                <p className="mt-0.5 text-sm text-slate-500">{pkg.classCount}-Class Learning Path</p>

                {PACKAGE_DESCRIPTORS[pkg.id] && (
                  <ul className="mt-2 space-y-1">
                    {PACKAGE_DESCRIPTORS[pkg.id].map(point => (
                      <li key={point} className="flex items-start gap-1.5 text-xs text-slate-500">
                        <span aria-hidden="true" className="mt-1 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                        {point}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Same figures as the /robotics rate card (RoboticsPricingSection). */}
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">${(pkg.perClassCents / 100).toFixed(0)}</span>
                  <span className="text-xs font-semibold text-slate-500">/class + tax</span>
                </div>
                <p className="mt-0.5 text-xs font-bold text-slate-600">{pkg.classCount} classes</p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  ${(pkg.regularSubtotalCents / 100).toFixed(0)} total
                </p>
                <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                  Pay in full or {installments} monthly payments of ${(pkg.regularSubtotalCents / installments / 100).toFixed(0)} + tax
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{pkg.classCount}-class learning commitment</p>
              </div>
            )
          })
        })()}
      </div>

      <div className="relative mt-8 rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
        <p className="text-sm font-bold text-slate-700">How payment works</p>
        <p className="mt-1.5 text-sm text-slate-500">
          Builder is a 20-class learning commitment and Engineer a 36-class one. Pay the program total in full, or
          in monthly payments — 2 for Builder, 4 for Engineer — at the same package rate. Monthly payments are only a
          payment schedule; they don&apos;t make the program month-to-month. Payment is by Interac e-Transfer.
        </p>
      </div>

      <p className="relative mt-6 text-center text-sm text-slate-500">
        Not sure which learning path is right for your child?{' '}
        <Link href="/contact#consultation-form" className="font-semibold text-[#0c6162] hover:underline">
          We&apos;re happy to help.
        </Link>
      </p>
    </div>
  )
}

function ProgramDetailContent() {
  const { programId } = useParams<{ programId: string }>()
  const router = useRouter()
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

  // Birthday Party is request-based, never a weekly programOffering — this
  // generic "Weekly Program Schedules" view doesn't apply to it (it would
  // just show "still being planned" forever). Send visitors to the real,
  // complete birthday experience page instead.
  useEffect(() => {
    if (program?.category === 'Birthday Party') {
      router.replace(BIRTHDAY_PARTY_PATH)
    }
  }, [program, router])

  const isRobotics = program?.category === ROBOTICS_CATEGORY

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

  if (program.category === 'Birthday Party') return (
    <BookingLayout backTo="/booking" backLabel="All Programs">
      <div className="flex items-center justify-center h-48 text-slate-400">Redirecting…</div>
    </BookingLayout>
  )

  // A demo offering (offeringType === 'demo') is a distinct product sold from
  // the /demo and /booking listing pages — never use it for this header.
  const nextOffering = offerings.find(o => o.offeringType !== 'demo')
  const listedTuition = Number(
    nextOffering?.tuitionCents
      || (program.isDepositOnly ? program.depositAmount : program.price)
      || 0
  )
  const colorClass = CATEGORY_COLORS[program.category] ?? 'bg-slate-100 text-slate-600'
  const headerDiscount = applyProgramDiscount(listedTuition, program)

  return (
    <BookingLayout backTo="/booking" backLabel="All Programs">
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

          <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-1">{program.title}</h1>

          {/* Same program.learnMoreUrl field used on the demo registration
              form and the robotics program cards — generic across every
              program, no per-program code needed. */}
          {program.learnMoreUrl && (
            <a
              href={program.learnMoreUrl}
              target="_blank"
              rel="noreferrer"
              className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-[#0c6162] hover:underline"
            >
              Learn more about {program.title}
              <span aria-hidden="true">↗</span>
            </a>
          )}

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
            {!isRobotics && (
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
                  <p className="text-sm font-bold text-slate-700">{offerings.length > 0 ? 'Confirmed after review' : 'Contact us'}</p>
                )}
              </div>
            )}
            {!isRequestOnlyBookingFlow && program.isDepositOnly && program.price && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">Total Price</p>
                <p className="text-sm font-bold text-slate-700">${(program.price / 100).toFixed(2)} CAD</p>
              </div>
            )}
          </div>

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

      {isRobotics && <PackageOverview programId={programId} />}

      <ContactToSchedule programTitle={program.title} />
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
