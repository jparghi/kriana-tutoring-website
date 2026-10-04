import type { Metadata } from "next"
import { Suspense } from "react"
import { Footer } from "../../../components/footer"
import { RegistrationAgreement } from "../../../components/robotics/registration-agreement"

export const metadata: Metadata = {
  title: { absolute: "Learning-Path Agreement | Young Engineers Kanata" },
  description: "Confirm your Builder or Engineer learning-path agreement for Young Engineers at Kriana Tutoring.",
  // Reached only from a family's private email link.
  robots: { index: false, follow: false },
}

export default function RoboticsAgreementPage() {
  return (
    <>
      <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
        <section className="px-4 pb-14 pt-8 sm:px-8" style={{ background: "linear-gradient(155deg, #FFF7E8 0%, #FFFFFF 50%, #F1F8F8 100%)" }}>
          <div className="mx-auto max-w-xl">
            <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
              <RegistrationAgreement />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
