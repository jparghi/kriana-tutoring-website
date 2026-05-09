# Kriana Public Website

This is a Next.js 14 + Tailwind CSS marketing site that showcases the Kriana Tutoring platform, pricing, and AI-first features.

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to view the landing page.

## Environment Variables

Create `.env.local` with the following values:

```bash
NEXT_PUBLIC_API_URL=https://kriana-backend.onrender.com
```

## Design Notes

- Primary palette uses deep navy backgrounds with teal and gold accents for a tech-forward, trustworthy feel.
- The landing page highlights hero messaging, feature grid, interactive worksheet preview, pricing tiers, and partner integrations.
- Tailwind utility classes drive the layout; update `tailwind.config.ts` to adjust brand colors or extend the theme.
