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
  paymentChoices: PaymentChoice[]
  paymentOption: string | null
  canChoosePlan: boolean
  schedule: { number: number; dueDate: string; totalCents: number; received: boolean }[] | null
  etransfer: {
    sendTo: string
    payInFullCents: number
    planPaymentCents: number | null
    nextPaymentCents: number | null
    message: string
  } | null
}

type PaymentChoice = { value: string; label: string; payments: number; amountCents: number }

function dueLabel(isoDate: string) {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })
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
  const [paymentOption, setPaymentOption] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`${ENDPOINT}?r=${encodeURIComponent(r)}&t=${encodeURIComponent(t)}`)
      .then(async (response) => {
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.error || "This agreement link could not be opened.")
        setView(result)
        if (result.paymentOption) setPaymentOption(result.paymentOption)
      })
      .catch((err) => setLoadError(err.message))
  }, [r, t])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (choosing && !paymentOption) {
      setError("Please choose how you would like to pay.")
      return
    }
    setSaving(true)
    setError("")
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ r, t, fullName, commitmentAccepted, termsAccepted, paymentOption }),
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

  async function changePlan(option: string) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "choosePlan", r, t, paymentOption: option }),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(result.error || "We could not change your payment option.")
    setView(result)
    setPaymentOption(result.paymentOption || option)
  }

  const choosing = Boolean(view && view.canChoosePlan && view.paymentChoices.length > 1)

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
            <AcceptedPanel view={view} onChangePlan={changePlan} />
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              {choosing && (
                <PaymentChoices choices={view.paymentChoices} value={paymentOption} onChange={setPaymentOption} />
              )}
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

/** Pay in Full or the monthly plan, with what each e-Transfer is. */
function PaymentChoices({ choices, value, onChange }: { choices: PaymentChoice[]; value: string; onChange: (value: string) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-bold text-[#0A2D5A]">How would you like to pay?</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {choices.map((choice) => (
          <label
            key={choice.value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 text-sm transition-colors ${
              value === choice.value ? "border-[#0c6162] bg-[#F1F8F8]" : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <input
              type="radio"
              name="payment-option"
              value={choice.value}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
              className="mt-1 h-4 w-4 shrink-0 accent-[#0c6162]"
            />
            <span>
              <span className="block font-bold text-slate-800">{choice.label}</span>
              <span className="block text-slate-600">
                {choice.payments > 1 ? `${money(choice.amountCents)} incl. HST each, monthly` : `${money(choice.amountCents)} incl. HST, one payment`}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/** After acceptance: thank the parent and, if payment isn't recorded yet,
 * show the chosen option, its schedule and the e-Transfer instructions —
 * and let them switch options until a payment is recorded. */
function AcceptedPanel({ view, onChangePlan }: { view: View; onChangePlan: (option: string) => Promise<void> }) {
  const etransfer = view.etransfer
  const [changing, setChanging] = useState(false)
  const [option, setOption] = useState(view.paymentOption ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const chosen = view.paymentChoices.find((choice) => choice.value === view.paymentOption)
  const canChange = view.canChoosePlan && view.paymentChoices.length > 1

  async function save() {
    if (!option) return
    setSaving(true)
    setError("")
    try {
      await onChangePlan(option)
      setChanging(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not change your payment option.")
    } finally {
      setSaving(false)
    }
  }

  if (!view.paymentRecorded && etransfer && view.schedule?.length) {
    return (
      <div className="mt-6 rounded-2xl border border-[#CFE3E3] bg-white p-5">
        <p className="text-base font-bold text-[#0A2D5A]">Thank you — your agreement is recorded.</p>
        <p className="mt-1 text-sm text-slate-600">Accepted by {view.acceptedBy}.</p>

        {changing ? (
          <div className="mt-4 space-y-3">
            <PaymentChoices choices={view.paymentChoices} value={option} onChange={setOption} />
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saving || !option}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#0c6162] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save payment option"}
              </button>
              <button
                type="button"
                onClick={() => { setChanging(false); setOption(view.paymentOption ?? "") }}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-slate-700">
                Payment option: <strong>{chosen?.label ?? "—"}</strong>
              </p>
              {canChange && (
                <button type="button" onClick={() => setChanging(true)} className="text-sm font-bold text-[#0c6162] underline-offset-2 hover:underline">
                  Change
                </button>
              )}
            </div>
            <div className="mt-3 rounded-xl bg-[#F1F8F8] px-4 py-3.5">
              <p className="text-sm font-bold text-[#0A2D5A]">Next: pay by Interac e-Transfer</p>
              <dl className="mt-2 space-y-1.5 text-sm">
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-slate-500">Send to</dt>
                  <dd className="font-semibold text-slate-800">{etransfer.sendTo}</dd>
                </div>
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-slate-500">Send now</dt>
                  <dd className="font-semibold text-slate-800">{money(etransfer.nextPaymentCents ?? view.schedule[0].totalCents)} incl. HST</dd>
                </div>
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-slate-500">e-Transfer message</dt>
                  <dd className="font-semibold text-slate-800">{etransfer.message}</dd>
                </div>
              </dl>
              {view.schedule.length > 1 && (
                <table className="mt-3 w-full text-sm">
                  <caption className="mb-1 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Your payment schedule</caption>
                  <tbody>
                    {view.schedule.map((item) => (
                      <tr key={item.number} className="border-t border-[#CFE3E3]">
                        <td className="py-1.5 text-slate-600">Payment {item.number}</td>
                        <td className="py-1.5 text-slate-600">{item.received ? "Received" : `Due ${dueLabel(item.dueDate)}`}</td>
                        <td className="py-1.5 text-right font-semibold text-slate-800">{money(item.totalCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="mt-2.5 text-xs text-slate-500">
                Your registration is confirmed once your first payment is received. We&apos;ll confirm by email.
              </p>
            </div>
          </>
        )}
      </div>
    )
  }

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
