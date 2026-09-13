"use client";

import { FormEvent, useRef, useState } from "react";

// Keep in sync with NEWSLETTER_CONSENT_TEXT in
// netlify/functions/_lib/newsletter-consent.js. The server stores whatever
// wording it holds, so if these ever drift the audit record stops matching
// what the parent actually saw — change both together.
const CONSENT_TEXT =
  "Yes, I'd like to receive learning resources, program updates, upcoming events and promotional emails from Kriana Tutoring. I can unsubscribe at any time.";

const INTEREST_CHOICES = [
  { value: "tutoring", label: "Academic Tutoring" },
  { value: "robotics", label: "Robotics & STEM" },
  { value: "both", label: "Both" },
] as const;

type Interest = (typeof INTEREST_CHOICES)[number]["value"];

export interface NewsletterFormProps {
  /** "footer" is the compact dark-background variant; "section" is the full light block. */
  variant?: "footer" | "section";
}

export function NewsletterForm({ variant = "footer" }: NewsletterFormProps) {
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState<Interest>("both");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState("");

  // Stable per mounted form, so a double-click or a retry after a network
  // blip is deduplicated server-side rather than creating a second signup.
  const clientRequestId = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `nl-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  );

  const dark = variant === "footer";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) {
      setError("Please check the consent box to subscribe.");
      return;
    }
    setError("");
    setStatus("submitting");

    try {
      const response = await fetch("/.netlify/functions/submit-newsletter-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientRequestId: clientRequestId.current,
          parentName,
          email,
          interest,
          marketingConsent: consent,
          consentText: CONSENT_TEXT,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "We could not complete your signup. Please try again.");
      }
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className={dark ? "text-sm text-white/85" : "text-sm text-slate-700"}>
        <p className={dark ? "font-bold text-brand-teal" : "font-bold text-brand-teal"}>
          You&apos;re on the list!
        </p>
        <p className="mt-1">
          Check your inbox for a welcome email from Kriana Tutoring. You can unsubscribe any time.
        </p>
      </div>
    );
  }

  const inputClass = dark
    ? "w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-brand-teal focus:outline-none"
    : "w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-teal focus:outline-none";
  const labelClass = dark ? "text-xs font-bold text-white/70" : "text-xs font-bold text-slate-600";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {variant === "section" && (
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900">Join Kriana Learning Updates</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Get helpful learning tips, free worksheets, STEM activities, upcoming demos, program
            updates and special offers from Kriana Tutoring.
          </p>
        </div>
      )}

      <div className="space-y-1">
        <label className={labelClass} htmlFor="newsletter-name">
          Parent name
        </label>
        <input
          id="newsletter-name"
          type="text"
          required
          minLength={2}
          maxLength={120}
          value={parentName}
          onChange={(e) => setParentName(e.target.value)}
          placeholder="Your name"
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>

      <fieldset className="space-y-1">
        <legend className={labelClass}>I&apos;m interested in</legend>
        <div className="flex flex-wrap gap-2 pt-1">
          {INTEREST_CHOICES.map((choice) => {
            const selected = interest === choice.value;
            return (
              <button
                key={choice.value}
                type="button"
                onClick={() => setInterest(choice.value)}
                aria-pressed={selected}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  selected
                    ? "bg-brand-teal text-white"
                    : dark
                      ? "border border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {choice.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Unchecked by default and required — express consent, per CASL. */}
      <label
        className={`flex gap-2.5 text-xs leading-relaxed ${dark ? "text-white/70" : "text-slate-600"}`}
      >
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-brand-teal"
        />
        <span>{CONSENT_TEXT}</span>
      </label>

      {error && <p className="text-xs font-semibold text-brand-rose">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting" || !consent}
        className="w-full rounded-full bg-brand-teal px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "submitting" ? "Subscribing…" : "Subscribe"}
      </button>
    </form>
  );
}
