import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Footer } from "../../../components/footer"
import { siteUrl } from "../../../lib/seo"
import { licensedRoboticsPrograms } from "../../../lib/robotics-content"
import { getPubliclyVisiblePackages } from "../../../lib/robotics-packages.js"
import { ROBOTICS_TERMS_VERSION } from "../../../lib/robotics-agreement.js"
import { ROBOTICS_PATH } from "../../../lib/site-links"

// The Robotics Program & Payment Terms that Builder/Engineer parents accept on
// /robotics/agreement. Prices come from the package catalogue, never typed
// here. Any change to the wording below must bump ROBOTICS_TERMS_VERSION
// (lib/robotics-agreement.js) so each acceptance records which text applied.

export const metadata: Metadata = {
  title: { absolute: "Robotics Program & Payment Terms | Young Engineers Kanata" },
  description: "Registration, payment, attendance and cancellation terms for Young Engineers robotics learning paths at Kriana Tutoring.",
  alternates: { canonical: `${siteUrl}/robotics/terms` },
}

const PRICED_PROGRAM_IDS = ["smartivo", "bricks-challenge", "algo-play"]
const ETRANSFER_EMAIL = process.env.NEXT_PUBLIC_ETRANSFER_EMAIL || "info@krianatutoring.com"

type Pkg = { id: string; name: string; classCount: number; perClassCents: number; regularSubtotalCents: number; paymentPlanInstallments: number }

function dollars(cents: number) {
  return `$${(cents / 100).toLocaleString("en-CA", { maximumFractionDigits: 2 })}`
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-200 pt-6">
      <h2 className="text-lg font-black text-[#0A2D5A]">
        {n}. {title}
      </h2>
      <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-slate-700">{children}</div>
    </section>
  )
}

export default function RoboticsTermsPage() {
  const programs = PRICED_PROGRAM_IDS.map((id) => ({
    title: licensedRoboticsPrograms.find((p) => p.id === id)!.title,
    packages: getPubliclyVisiblePackages(id) as Pkg[],
  }))
  const tiers = programs[0].packages
  const builder = tiers.find((p) => p.id === "builder")!
  const engineer = tiers.find((p) => p.id === "engineer")!

  return (
    <>
      <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
        <section className="px-4 pb-16 pt-6 sm:px-8" style={{ background: "linear-gradient(155deg, #FFF7E8 0%, #FFFFFF 40%, #F1F8F8 100%)" }}>
          <div className="mx-auto max-w-3xl">
            <Link href={ROBOTICS_PATH} className="inline-flex min-h-11 items-center text-sm font-bold text-[#0c6162] hover:underline">
              ← Back to Young Engineers programs
            </Link>

            <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <Image src="/images/young-engineers/logo.png" alt="Young Engineers" width={180} height={52} className="h-9 w-auto" />
              <span className="text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">in partnership with</span>
              <Image src="/images/kriana-tutoring-logo-horizontal-5.png" alt="Kriana Tutoring" width={1266} height={294} className="h-8 w-auto" />
            </div>

            <h1 className="mt-6 text-[28px] font-black leading-[1.12] text-[#0A2D5A] sm:text-4xl">Robotics Program &amp; Payment Terms</h1>
            <p className="mt-2 text-sm text-slate-500">
              Version {ROBOTICS_TERMS_VERSION} · Young Engineers programs operated by Kriana Tutoring | Young Engineers Kanata
            </p>

            <div className="mt-5 rounded-2xl border border-[#CFE3E3] bg-[#F1F8F8] px-5 py-4 text-[15px] leading-relaxed text-slate-700">
              <p className="font-bold text-[#0A2D5A]">In short</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5">
                <li>Builder is a {builder.classCount}-class commitment and Engineer a {engineer.classCount}-class commitment. Their per-class rate comes from that commitment.</li>
                <li>
                  Pay in full, or in monthly installments — {builder.paymentPlanInstallments} for Builder, {engineer.paymentPlanInstallments} for
                  Engineer. Installments are only a payment schedule for the program total, not a month-to-month program.
                </li>
                <li>Your registration is confirmed once the agreement is accepted and your first payment is received.</li>
                <li>If a learning path is cancelled early, classes already attended may be recalculated at the applicable current program rate.</li>
              </ul>
            </div>

            <div className="mt-8 space-y-7">
              <Section n={1} title="Learning paths">
                <p>
                  Each learning path is one class package: Builder ({builder.classCount}-class commitment) or Engineer
                  ({engineer.classCount}-class commitment). Each is offered at its per-class rate because your family commits to the
                  complete learning path.
                </p>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5">Program</th>
                        {tiers.map((t) => (
                          <th key={t.id} className="px-4 py-2.5">
                            {t.name} · {t.classCount} classes
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {programs.map(({ title, packages }) => (
                        <tr key={title}>
                          <td className="px-4 py-2.5 font-bold text-[#0A2D5A]">{title}</td>
                          {packages.map((p) => (
                            <td key={p.id} className="px-4 py-2.5 text-slate-700">
                              {dollars(p.perClassCents)}/class
                              <span className="block text-xs text-slate-500">
                                {dollars(p.regularSubtotalCents)} + tax · or {p.paymentPlanInstallments} monthly ×{" "}
                                {dollars(p.regularSubtotalCents / p.paymentPlanInstallments)} + tax
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>All prices are per child, in Canadian dollars, plus 13% HST. Building materials are provided during class and kits stay at the learning centre.</p>
              </Section>

              <Section n={2} title="Registration and confirmation">
                <p>
                  After you register, we email your registration details and payment instructions, and a parent or guardian accepts the
                  learning-path agreement online. Your child&apos;s registration is confirmed once the agreement has been accepted and your first
                  payment has been received. Class dates and schedule details are sent separately.
                </p>
              </Section>

              <Section n={3} title="Payment">
                <p>
                  Payment is by Interac e-Transfer to <strong>{ETRANSFER_EMAIL}</strong>. Please include your child&apos;s name and your
                  registration reference in the e-Transfer message (for example, &ldquo;Vihaan — YE-2026-0026&rdquo;) so we can match your
                  payment.
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    <strong>Builder</strong> ({builder.classCount}-class commitment): pay in full, or in {builder.paymentPlanInstallments} monthly
                    installments.
                  </li>
                  <li>
                    <strong>Engineer</strong> ({engineer.classCount}-class commitment): pay in full, or in {engineer.paymentPlanInstallments}{" "}
                    monthly installments.
                  </li>
                  <li>
                    Installments are equal payments at the same package rate, with no additional fee from Kriana Tutoring. The first installment is
                    due before your registration is confirmed, and the remaining installments are due monthly — we will send you the dates.
                  </li>
                  <li>
                    If an installment becomes overdue, future classes may be paused until the account is brought up to date. Classes missed during
                    a pause are not made up.
                  </li>
                </ul>
                <p>We never ask for credit card or banking details by email or on our website.</p>
              </Section>

              <Section n={4} title="Installments are not month-to-month">
                <p>
                  The installment plan is provided as a convenient way to pay the full program fee and does not convert the program into a
                  month-to-month service. Stopping payments does not end the commitment — to leave the program, please withdraw as described in
                  section 7.
                </p>
              </Section>

              <Section n={5} title="Attendance and missed classes">
                <p>
                  Classes run weekly on the schedule we confirm with you. Please let us know as early as possible if your child will miss a class.
                  Classes missed by the student are not refunded or credited. Where space allows, we may offer a make-up spot in another session
                  of the same program, but make-ups are not guaranteed.
                </p>
              </Section>

              <Section n={6} title="Classes we cancel or reschedule">
                <p>
                  There are no classes on statutory holidays; your package still includes its full number of classes, so the schedule simply
                  runs longer. If we cancel a class (for example for weather or instructor illness), we will reschedule it or, if that isn&apos;t
                  possible, credit or refund that class at the rate you paid. If we need to change the class day or time, we will tell you in
                  advance; if the new time doesn&apos;t work for your family, you may withdraw and receive a refund for the classes not yet held.
                </p>
              </Section>

              <Section n={7} title="Withdrawing from a learning path">
                <p>To withdraw, email info@krianatutoring.com. Withdrawal takes effect from the date we receive your email.</p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    <strong>Before the first class:</strong> everything you have paid is refunded.
                  </li>
                  <li>
                    <strong>After classes have started:</strong> if a discounted Builder or Engineer Learning Path is cancelled before
                    completion, classes already attended may be recalculated using the applicable current program rate or another reasonable rate
                    defined by Kriana Tutoring / Young Engineers. Any resulting balance may become payable. We refund anything you have paid above
                    the recalculated amount.
                  </li>
                </ul>
                <p>Refunds are sent by Interac e-Transfer within 14 days of your withdrawal.</p>
              </Section>

              <Section n={8} title="Changes between programs or paths">
                <p>
                  You may ask to move your child to another program, class time or learning path. Changes depend on space and are adjusted fairly
                  for classes already held; we will confirm any price difference with you before making the change.
                </p>
              </Section>

              <Section n={9} title="Health, safety and behaviour">
                <p>
                  Please tell us about any allergies or medical needs at registration. Children are expected to follow the instructor&apos;s
                  directions and treat others and the equipment with respect. If a child&apos;s behaviour repeatedly prevents others from learning,
                  we will talk with you first; if we have to end a registration, we refund the classes not yet held at the rate you paid.
                </p>
                <p>
                  Photo and media permission is separate — see our{" "}
                  <Link href="/consent" className="font-bold text-[#0c6162] underline-offset-2 hover:underline">
                    Photo &amp; Media Consent form
                  </Link>
                  .
                </p>
              </Section>

              <Section n={10} title="Changes to these terms">
                <p>
                  We may update these terms. The version that applies to your registration is the one shown when you accepted the agreement; your
                  agreement email records that version.
                </p>
              </Section>

              <Section n={11} title="Contact">
                <p>
                  Questions? Email{" "}
                  <a href="mailto:info@krianatutoring.com" className="font-bold text-[#0c6162] underline-offset-2 hover:underline">
                    info@krianatutoring.com
                  </a>{" "}
                  or call{" "}
                  <a href="tel:+16134006921" className="font-bold text-[#0c6162] underline-offset-2 hover:underline">
                    613-400-6921
                  </a>
                  .
                </p>
              </Section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
