"use client";

import { FormEvent, useState } from "react";

export function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "submitted">("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitted");
  }

  if (status === "submitted") {
    return <p className="text-sm font-semibold text-brand-teal">Thanks for subscribing!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        required
        placeholder="Your email address"
        className="w-full min-w-0 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-brand-teal focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-brand-teal px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90"
      >
        Subscribe
      </button>
    </form>
  );
}
