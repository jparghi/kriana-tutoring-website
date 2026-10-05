"use client"

import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import {
  AGREEMENT_COMMITMENT_STATEMENT,
  AGREEMENT_TERMS_STATEMENT,
  ROBOTICS_TERMS_URL,
} from "../../lib/robotics-agreement.js"

type View = {
  childFirstName: string
  programTitle: string
  registrationNumber: string
  packageName: string
  classCount: number | null
  installments: number | null
  accepted: boolean
  acceptedBy: string
  paymentRecorded: boolean
  etransfer: { sendTo: string; payInFullCents: number; planPaymentCents: number | null; message: string } | null
}

function money(cents: number) {
  return `$${(cents / 100).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const ENDPOINT = "/.netlify/functions/registration-agreement"

// The parent's Builder/Engineer learning-path agreement: typed full name plus
// two required checkboxes. Recorded on the registration by the
// registration-agreement function; payment is by Interac e-Transfer.
export function RegistrationAgreement() {
  const params = useSearchParams()
  const r = params.get("r") ?? ""
  const t = params.get("t") ?? ""
  const [view, setView] = useState<View | null>(null)
  const [loadError, setLoadError] = useState("")
  const [fullName, setFullName] = useState("")
  const [commitmentAccepted, setCommitmentAccepted] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`${ENDPOINT}?r=${encodeURIComponent(r)}&t=${encodeURIComponent(t)}`)
      .then(async (response) => {
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.error || "This agreement link could not be opened.")
        setView(result)
      })
      .catch((err) => setLoadError(err.message))
  }, [r, t])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ r, t, fullName, commitmentAccepted, termsAccepted }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || "We could not save your agreement.")
      setView(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not save your agreement.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <Image src="/images/young-engineers/logo.png" alt="Young Engineers" width={180} height={52} className="h-9 w-auto" />
        <span className="text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">in partnership with</span>
        <Image src="/images/kriana-tutoring-logo-horizontal-5.png" alt="Kriana Tutoring" width={1266} height={294} className="h-8 w-auto" />
      </div>

      <h1 className="mt-6 text-[28px] font-black leading-[1.12] text-[#0A2D5A] sm:text-4xl">Learning-Path Agreement</h1>

      {loadError ? (
        <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">{loadError}</p>
      ) : !view ? (
        <p className="mt-5 text-sm text-slate-500">Loading…</p>
      ) : (
        <>
          <dl className="mt-5 grid gap-x-6 gap-y-3 rounded-2xl border border-[#CFE3E3] bg-[#F1F8F8] px-5 py-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Program</dt>
              <dd className="font-semibold text-slate-800">{view.programTitle}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Child</dt>
              <dd className="font-semibold text-slate-800">{view.childFirstName}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Learning Path</dt>
              <dd className="font-semibold text-[#0c6162]">
                {view.packageName} — {view.classCount} classes
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Reference</dt>
              <dd className="font-semibold text-slate-800">{view.registrationNumber}</dd>
            </div>
          </dl>

          {view.accepted ? (
            <AcceptedPanel view={view} />
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <label className="block text-sm font-bold text-[#0A2D5A]">
                Parent/Guardian Full Name
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base font-normal text-slate-900 focus:border-[#0c6162] focus:outline-none focus:ring-2 focus:ring-[#0c6162]/30"
                />
              </label>
              <label className="flex items-start gap-3 text-sm leading-relaxed text-slate-700">
                <input
                  type="checkbox"
                  required
                  checked={commitmentAccepted}
                  onChange={(e) => setCommitmentAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#0c6162]"
                />
                <span>{AGREEMENT_COMMITMENT_STATEMENT}</span>
              </label>
              <div className="flex items-start gap-3 text-sm leading-relaxed text-slate-700">
                <input
                  id="terms-accepted"
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#0c6162]"
                />
                <span>
                  <label htmlFor="terms-accepted">{AGREEMENT_TERMS_STATEMENT}</label>{" "}
                  <a href={ROBOTICS_TERMS_URL} target="_blank" rel="noopener" className="font-bold text-[#0c6162] underline-offset-2 hover:underline">
                    View Robotics Program &amp; Payment Terms
                  </a>
                </span>
              </div>
              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#0c6162] px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0a5051] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Accept Agreement"}
              </button>
            </form>
          )}
        </>
      )}

      <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
        Questions? Call{" "}
        <a href="tel:+16134006921" className="font-semibold text-slate-700 underline-offset-2 hover:underline">613-400-6921</a>{" "}
        or email{" "}
        <a href="mailto:info@krianatutoring.com" className="font-semibold text-slate-700 underline-offset-2 hover:underline">info@krianatutoring.com</a>.
      </p>
    </>
  )
}

/** After acceptance: thank the parent and, if payment isn't recorded yet,
 * repeat the e-Transfer instructions from the email. */
function AcceptedPanel({ view }: { view: View }) {
  const etransfer = view.etransfer
  return (
    <div className="mt-6 rounded-2xl border border-[#CFE3E3] bg-white p-5">
      <p className="text-base font-bold text-[#0A2D5A]">Thank you — your agreement is recorded.</p>
      <p className="mt-1 text-sm text-slate-600">Accepted by {view.acceptedBy}.</p>
      {view.paymentRecorded ? (
        <p className="mt-3 text-sm text-slate-600">
          We&apos;ve also received your payment. We&apos;ll confirm {view.childFirstName}&apos;s registration by email shortly.
        </p>
      ) : etransfer ? (
        <div className="mt-4 rounded-xl bg-[#F1F8F8] px-4 py-3.5">
          <p className="text-sm font-bold text-[#0A2D5A]">Next: pay by Interac e-Transfer</p>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-slate-500">Send to</dt>
              <dd className="font-semibold text-slate-800">{etransfer.sendTo}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-slate-500">{etransfer.planPaymentCents ? "Pay in full" : "Amount"}</dt>
              <dd className="font-semibold text-slate-800">{money(etransfer.payInFullCents)} incl. HST</dd>
            </div>
            {etransfer.planPaymentCents && (
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-slate-500">{view.installments} monthly payments</dt>
                <dd className="font-semibold text-slate-800">
                  {money(etransfer.planPaymentCents)} incl. HST each — send the first now
                </dd>
              </div>
            )}
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-slate-500">e-Transfer message</dt>
              <dd className="font-semibold text-slate-800">{etransfer.message}</dd>
            </div>
          </dl>
          <p className="mt-2.5 text-xs text-slate-500">
            Your registration is confirmed once your first payment is received. We&apos;ll confirm by email.
          </p>
        </div>
      ) : null}
    </div>
  )
}
