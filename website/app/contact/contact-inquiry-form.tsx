export function ContactInquiryForm() {
  return (
    <form
      name="contact-inquiry"
      method="POST"
      action="/contact/success"
      data-netlify="true"
      netlify-honeypot="bot-field"
      className="order-1 rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)] lg:order-2"
    >
      <input type="hidden" name="form-name" value="contact-inquiry" />
      <p className="hidden">
        <label>
          Don&apos;t fill this out if you&apos;re human: <input name="bot-field" />
        </label>
      </p>

      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="parent-name" className="text-sm font-semibold text-slate-700">
              Parent or guardian name
            </label>
            <input
              id="parent-name"
              name="parent_name"
              type="text"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
              placeholder="Alex Smith"
            />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-semibold text-slate-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="text-sm font-semibold text-slate-700">
              Phone number (optional)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
              placeholder="+1 (613) 555-0123"
            />
          </div>
          <div>
            <label htmlFor="student-grade" className="text-sm font-semibold text-slate-700">
              Student grade level
            </label>
            <select
              id="student-grade"
              name="student_grade"
              required
              className="mt-2 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
              defaultValue=""
            >
              <option value="" disabled>
                Select grade range
              </option>
              <option value="K-2">Kindergarten – Grade 2</option>
              <option value="3-5">Grades 3 – 5</option>
              <option value="6-8">Grades 6 – 8</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="focus-area" className="text-sm font-semibold text-slate-700">
            What subjects or goals should we focus on?
          </label>
          <textarea
            id="focus-area"
            name="focus_area"
            required
            rows={4}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
            placeholder="Tell us about strengths to celebrate, challenges to address, upcoming tests, or enrichment interests."
          />
        </div>

        <div>
          <label htmlFor="preferred-time" className="text-sm font-semibold text-slate-700">
            Preferred consultation time (optional)
          </label>
          <input
            id="preferred-time"
            name="preferred_time"
            type="text"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
            placeholder="Weeknights after 6 PM, Saturday mornings, etc."
          />
        </div>

        <input type="hidden" name="inquiry_type" value="contact" />

        <div className="space-y-3">
          <button
            type="submit"
            className="w-full rounded-full bg-brand-rose px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_18px_40px_rgba(244,63,94,0.35)] transition hover:-translate-y-0.5 hover:bg-brand-sky"
          >
            Submit inquiry
          </button>
          <p className="text-xs leading-relaxed text-slate-500">
            By submitting this form you agree to our privacy policy and consent to be contacted by the Kriana Tutoring team. We respect your inbox and only send information relevant to your request.
          </p>
        </div>
      </div>
    </form>
  );
}
