# SEO Progress: Kriana Tutoring Website

_Last updated: 2026-06-02_

---

## Done

### Phase 1 — Critical fixes
- [x] **Root layout placeholder description removed** — replaced "inspired by The7 Online Courses demo" with real production copy (`website/app/layout.tsx`)
- [x] **Root layout OpenGraph updated** — proper title, description, `siteName`, `type: "website"`
- [x] **Twitter/X card added** — `summary_large_image` card with title, description, image reference (`website/app/layout.tsx`)
- [x] **ESLint pre-existing error fixed** — unescaped `'` in `video-storyboard.tsx` that was blocking builds

### Phase 2 — Structured data
- [x] **`WebSite` schema added** — enables Google Sitelinks searchbox; injected into root layout (`website/lib/seo.ts`, `website/app/layout.tsx`)
- [x] **`breadcrumbSchema()` helper added** — reusable utility in `website/lib/seo.ts`
- [x] **`BreadcrumbList` schema on blog posts** — Home → Blog → Post (`website/app/blog/[slug]/page.tsx`)
- [x] **`BreadcrumbList` schema on service pages** — Home → Services → Service (`website/app/services/[slug]/page.tsx`)
- [x] **`areaServed` expanded** — now typed `City` objects: Ottawa, Kanata, Stittsville, Nepean, Barrhaven (`website/lib/seo.ts`)

### Phase 3 — Weak page titles
- [x] **About** — "About Us" → "About Kriana Tutoring | Ottawa's Learning-with-Heart Tutors"
- [x] **Worksheets** — "Worksheets" → "Free Ontario Math & Reading Worksheets JK–Grade 8 | Kriana"
- [x] **Practice Tests** — "Practice Tests" → "Ontario Practice Tests & Assessments Grade 1–8 | Kriana"
- [x] **Register** — "Register" → "Enroll Your Child | Kriana Tutoring Ottawa"

### Phase 4 — Canonical tags (partial)
- [x] Homepage (`/`)
- [x] Services listing (`/services`)
- [x] Services detail pages (`/services/[slug]`)
- [x] Blog post pages (`/blog/[slug]`)
- [x] About (`/about`)
- [x] Worksheets (`/worksheets`)
- [x] Practice Tests (`/practice-tests`)
- [x] Register (`/register`)

---

## To Do

### Phase 4 — Canonical tags (remaining pages)
- [ ] Contact page — `website/app/contact/page.tsx` → `https://www.krianatutoring.com/contact`
- [ ] Blog listing — `website/app/blog/page.tsx` → `https://www.krianatutoring.com/blog`
- [ ] Why Kriana — `website/app/why-kriana/page.tsx` → `https://www.krianatutoring.com/why-kriana`
- [ ] Offline tutoring resource — `website/app/resources/offline-tutoring/page.tsx`

### Phase 5 — OG social image (design task)
- [ ] **Create `kriana-og-social.png` at 1200×630** — save to `website/public/images/`
  - Include: Kriana logo, tagline ("Learning with Heart"), location ("Ottawa · Kanata · Stittsville")
  - Use branded teal/navy background
  - The code already references this file — just needs the asset created

### Phase 6 — FAQ schema on service pages
- [ ] Add `FAQPage` JSON-LD to `/services` listing page
  - Target queries: "how much does tutoring cost in Ottawa", "what grade levels do you tutor"
- [ ] Add `FAQPage` JSON-LD to each `/services/[slug]` page — service-specific FAQs
- [ ] Pattern to follow: existing `faqSchema` in `website/app/contact/page.tsx`

### Phase 7 — Content / blog gaps (ongoing)
- [ ] Blog post: "how to help my child with math homework Ottawa"
- [ ] Blog post: "Grade 3 reading level test Ontario"
- [ ] Blog post: "tutoring vs learning center Ottawa"
- [ ] Blog post: "JK readiness Ottawa"

---

## Verification checklist

Run these after all phases are complete:

- [x] `npm run build` passes with no errors
- [ ] [Google Rich Results Test](https://search.google.com/test/rich-results) — run on `/`, `/contact`, `/services/math-tutoring-for-kids-ottawa`
- [ ] [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) — confirm OG image renders at 1200×630 _(blocked until image created)_
- [ ] View page source on `/` — confirm no "inspired by The7" text in `<meta name="description">`
- [ ] Check `<link rel="canonical">` in `<head>` on each page via browser DevTools
- [ ] Submit updated sitemap to Google Search Console after deploying
