# Kriana Public Website

This is a Next.js 14 + Tailwind CSS marketing site that showcases the Kriana Tutoring platform, pricing, and AI-first features.

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to view the landing page.

## Local Development With Netlify Functions

Plain `npm run dev` only runs Next.js — any page that calls `/.netlify/functions/*`
(e.g. `/booking`, which calls `get-public-catalog`) will 404 on those requests
because there's no function runtime behind it.

To test those pages locally, run the Netlify CLI instead so functions are served
too. Requires the [Netlify CLI](https://docs.netlify.com/cli/get-started/)
(`npm install -g netlify-cli`) and this site linked (`netlify link`):

```bash
npm run dev:functions
```

This keeps the site on the familiar `http://localhost:3000` URL — Next.js itself
runs internally on port 3500, but you never need to visit that port directly.
(Netlify's dev proxy refuses to share a single port between itself and the
framework it wraps, which is why the internal port has to differ.)

Function calls read credentials from `.env.local` (Firebase Admin, SMTP, Stripe,
etc.) — see below.

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
