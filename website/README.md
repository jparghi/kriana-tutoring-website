# Kriana Public Website

This is a Next.js 14 + Tailwind CSS marketing site that showcases the Kriana Tutoring platform, pricing, and AI-first features.

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to view the landing page.

## Booking / Programs Catalog

`/booking` reads programs and offerings through `app/api/public-catalog`, a
normal Next.js API route — not a Netlify Function. That means plain `npm run
dev` is enough; programs and schedules created in the tutor portal show up at
`http://localhost:3000/booking` with no Netlify CLI, no extra ports, and no
Node version juggling required. It reads Firebase Admin credentials straight
from `.env.local` (see Environment Variables below).

A few other flows (Stripe checkout, e-transfer emails, enrollment webhooks,
the birthday availability form's `submit-birthday-request`) are still real
Netlify Functions under `netlify/functions/` and only run under `netlify
dev`, not plain `next dev`. If you need to test one of those (including
submitting the form on `/birthday-parties`):

```bash
cd website   # .nvmrc and package.json both live here, not the repo root
nvm use      # picks up the pinned .nvmrc version (22.14.0) — run netlify dev
             # under an LTS Node; newer non-LTS builds (e.g. 23.x) have
             # crashed the Netlify CLI's dev proxy mid-session
npm run dev:functions
```

This keeps the site on `http://localhost:3000` (Next.js itself runs
internally on port 3500 — you never need to visit that port directly;
Netlify's dev proxy won't share a single port with the framework it wraps).

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the public Firebase values needed for local development. Keep the enrollment flow fail-closed:

```bash
NEXT_PUBLIC_API_URL=https://kriana-backend.onrender.com
NEXT_PUBLIC_BOOKING_FLOW_MODE=request_only
BOOKING_FLOW_MODE=request_only
ENABLE_AUTOMATED_STRIPE_PAYMENTS=false
```

The public registration form writes through a validated Netlify function, so deployed environments also require Firebase Admin credentials. See `.env.example` and `../docs/enrollment-request-runbook.md`. Never commit `.env.local` or service-account credentials.

## Design Notes

- Primary palette uses deep navy backgrounds with teal and gold accents for a tech-forward, trustworthy feel.
- The landing page highlights hero messaging, feature grid, interactive worksheet preview, pricing tiers, and partner integrations.
- Tailwind utility classes drive the layout; update `tailwind.config.ts` to adjust brand colors or extend the theme.
