import Link from "next/link";

export default function ContactSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-brand-sky/10 px-6 py-24">
      <section className="w-full max-w-2xl rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-[0_28px_70px_rgba(15,23,42,0.12)]">
        <p className="inline-flex items-center rounded-full border border-brand-sky/30 bg-brand-sky/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-sky">
          Inquiry received
        </p>
        <h1 className="mt-6 text-4xl font-semibold text-slate-900 sm:text-5xl">
          Thank you for reaching out.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          Your message has been submitted successfully. The Kriana Tutoring team will get back to you within one business day.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-sky to-brand-teal px-8 py-3 text-sm font-bold uppercase tracking-[0.22em] text-white shadow-[0_8px_28px_rgba(74,144,226,0.45)]"
          >
            Return Home
          </Link>
          <Link
            href="tel:+16134006921"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-700"
          >
            Call 613-400-6921
          </Link>
        </div>
      </section>
    </main>
  );
}
