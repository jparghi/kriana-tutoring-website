import Link from "next/link";
import { MapPinIcon, PhoneCallIcon, MessageSquareIcon } from "./icons";
import { SectionHeading } from "./section-heading";

const contactItems = [
  {
    title: "Visit our Center",
    description: "205 Metric Circle, Stittsville, Ontario",
    action: {
      label: "Open in Maps",
      href: "https://maps.google.com/?q=Kriana+Tutoring+Kanata"
    },
    icon: MapPinIcon,
    gradient: "from-brand-sky/30 to-brand-teal/20",
    iconColor: "text-brand-sky"
  },
  {
    title: "Call or text",
    description: "+1 (613) 400-6921",
    action: {
      label: "Start a WhatsApp chat",
      href: "https://wa.me/16134006921"
    },
    icon: PhoneCallIcon,
    gradient: "from-brand-teal/30 to-brand-sky/20",
    iconColor: "text-brand-teal"
  },
  {
    title: "Parent concierge",
    description: "info@krianatutoring.com",
    action: {
      label: "Send a message",
      href: "mailto:info@krianatutoring.com"
    },
    icon: MessageSquareIcon,
    gradient: "from-brand-rose/30 to-brand-amber/20",
    iconColor: "text-brand-rose"
  }
];

export function ContactGrid() {
  return (
    <section className="relative overflow-hidden bg-white py-24">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-sky/10 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-[480px] w-[480px] rounded-full bg-brand-teal/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="Connect"
          title="Ready to help your child feel more confident in school?"
          description="Book a free assessment, ask about our programs, or just reach out — we'd love to hear about your child. We respond within one business day."
          tone="light"
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {contactItems.map((item) => (
            <div
              key={item.title}
              className="group relative flex h-full flex-col gap-5 overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_24px_56px_rgba(0,0,0,0.1)]"
            >
              {/* Top gradient shimmer on hover */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-sky/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <span className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} transition-transform duration-300 group-hover:scale-110 ${item.iconColor}`}>
                <item.icon className="h-6 w-6" />
              </span>

              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>

              <Link
                href={item.action.href}
                className={`group/link mt-auto inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] transition-all duration-200 ${item.iconColor} hover:opacity-80`}
              >
                {item.action.label}
                <span aria-hidden="true" className="transition-transform duration-200 group-hover/link:translate-x-1">→</span>
              </Link>
            </div>
          ))}
        </div>

        {/* CTA strip */}
        <div className="mt-14 flex flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-lg font-bold text-slate-900">Start your child&apos;s learning journey today.</p>
            <p className="mt-1 text-sm text-slate-500">Free assessment · No commitment required · Ottawa families welcome.</p>
          </div>
          <Link
            href="/contact#consultation-form"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-brand-sky to-brand-teal px-8 py-3.5 text-sm font-bold uppercase tracking-[0.22em] text-white shadow-[0_8px_28px_rgba(74,144,226,0.5)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_12px_40px_rgba(74,144,226,0.65)]"
          >
            Book a Free Assessment
          </Link>
        </div>
      </div>
    </section>
  );
}
