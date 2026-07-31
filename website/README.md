# Kriana Public Website

This is a Next.js 14 + Tailwind CSS marketing site that showcases the Kriana Tutoring platform, pricing, and AI-first features.

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to view the landing page.

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
