import Link from "next/link";

export function LocalAreas() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_18px_48px_rgba(6,11,26,0.08)] sm:p-10">
          <p className="inline-flex rounded-full border border-brand-sky/30 bg-brand-sky/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-sky">
            Ottawa Area Support
          </p>
          <h2 className="mt-5 text-3xl font-bold text-slate-900 sm:text-4xl">
            Tutoring in Ottawa for families who want steady academic progress
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            We proudly serve families in Ottawa, Kanata, Stittsville, and surrounding areas. Whether your child needs
            math tutoring for kids, reading help for grade 1-3 learners, or consistent homework help for kids, Kriana
            Tutoring builds a personalized plan that fits your child&apos;s pace.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-bold text-slate-900">Math tutoring for kids</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                We help children strengthen number sense, problem solving, and confidence with patient, step-by-step
                support.
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-bold text-slate-900">Reading help for grade 1-3</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Early literacy support focuses on phonics, fluency, comprehension, and routines that make reading feel
                manageable at home.
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-bold text-slate-900">Homework help for kids</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                We turn after-school stress into structured progress with guided homework support and stronger study
                habits.
              </p>
            </article>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-sky to-brand-teal px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white"
            >
              Explore Services
            </Link>
            <Link
              href="/contact#consultation-form"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-700"
            >
              Book a Free Assessment
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
