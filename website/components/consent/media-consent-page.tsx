import Image from "next/image"
import Link from "next/link"
import { Footer } from "../footer"
import { MEDIA_CONSENT_STATEMENT } from "../../lib/media-consent"
import { MediaConsentForm } from "./media-consent-form"

type Detail = { label: string; value: React.ReactNode; wide?: boolean }

// Shared layout for the Parent / Guardian Photo & Media Consent pages:
// /consent (general, any Young Engineers activity) and /demo/consent (one
// event). Same wording, form and storage; only the details card differs.
export function MediaConsentPage({
  context,
  details,
  initialSessionId,
  backHref,
  backLabel,
}: {
  context: { id: string; dateLabel?: string; sessions: { id: string; label: string }[] }
  details: Detail[]
  initialSessionId?: string
  backHref: string
  backLabel: string
}) {
  return (
    <>
      <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
        <section className="px-4 pb-14 pt-6 sm:px-8" style={{ background: "linear-gradient(155deg, #FFF7E8 0%, #FFFFFF 50%, #F1F8F8 100%)" }}>
          <div className="mx-auto max-w-xl">
            <Link href={backHref} className="inline-flex min-h-11 items-center text-sm font-bold text-[#0c6162] hover:underline">← {backLabel}</Link>

            <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <Image src="/images/young-engineers/logo.png" alt="Young Engineers" width={180} height={52} className="h-9 w-auto" />
              <span className="text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">in partnership with</span>
              <Image src="/images/kriana-tutoring-logo-horizontal-5.png" alt="Kriana Tutoring" width={1266} height={294} className="h-8 w-auto" />
            </div>

            <h1 className="mt-6 text-[28px] font-black leading-[1.12] text-[#0A2D5A] sm:text-4xl">
              Parent / Guardian Photo &amp; Media Consent Form
            </h1>
            <div className="mt-4 rounded-2xl border border-[#CFE3E3] bg-[#F1F8F8] px-5 py-4">
              <p className="text-sm font-bold text-[#0A2D5A]">Dear Parent / Guardian,</p>
              <p className="mt-1 text-base leading-relaxed text-slate-700">{MEDIA_CONSENT_STATEMENT}</p>
            </div>

            <dl className="mt-5 grid gap-x-6 gap-y-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm sm:grid-cols-2">
              {details.map(detail => (
                <div key={detail.label} className={detail.wide ? "sm:col-span-2" : undefined}>
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{detail.label}</dt>
                  <dd className="font-semibold text-slate-800">{detail.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6">
              <MediaConsentForm
                event={context}
                initialSessionId={initialSessionId}
                backHref={backHref}
                backLabel={backLabel}
              />
            </div>

            <Link
              href="/gallery"
              className="mt-6 flex min-h-11 items-center justify-center gap-2 text-sm font-bold text-[#0c6162] underline-offset-4 hover:underline"
            >
              <span aria-hidden="true">▶</span> See Young Engineers in action.
            </Link>

            <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
              Questions, or want to change your answer later? Contact Kriana Tutoring at{" "}
              <a href="tel:+16134006921" className="font-semibold text-slate-700 underline-offset-2 hover:underline">613-400-6921</a>{" "}
              or{" "}
              <a href="mailto:info@krianatutoring.com" className="font-semibold text-slate-700 underline-offset-2 hover:underline">info@krianatutoring.com</a>.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
