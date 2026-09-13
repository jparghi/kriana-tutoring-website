# Kriana Tutoring — AI Newsletter & Email Campaign Center

**Revised spec, rewritten against the actual codebase (audit date: 2026-09-13).**
This supersedes the original draft brief. Every "inspect first / find out what we
already have" instruction in that draft has been carried out; the findings are in
Part 1 and the requirements in Part 2+ have been rewritten to match reality.

---

# PART 0 — MINIMUM V1 SCOPE (AUTHORITATIVE — overrides Part 2 where they differ)

Decided 2026-09-13: build the smallest thing that actually works end to end.
Part 1 (audit) stands as written. Part 2 remains the *full* design and is now the
backlog, not the plan. Where Part 0 and Part 2 disagree, **Part 0 wins**.

## The reasoning behind the trim

The consented list is currently **zero people** (§1.5, §1.4). Nothing in the
existing data can be imported as marketing-consented. So the list has to be grown
from scratch, from the signup form, starting the day it ships.

That single fact removes most of the original architecture's justification:

- **No ESP needed yet.** The ESP exists to solve volume, bounce handling and
  deliverability reputation at scale. At 10-150 opted-in recipients none of those
  bite, and the existing nodemailer/SMTP path handles it comfortably if throttled.
- **No queue/cron drainer needed yet.** One background function pass sends 150
  throttled emails in well under its 15-minute limit.
- **No webhook/metrics pipeline needed yet.** With no ESP there are no delivery
  events to receive; we record what our own send loop knows.

This is a deliberate, bounded deferral, not an oversight. **Tripwire: when the
eligible-recipient count crosses 200, stop and add the ESP before sending.** The
send endpoint must enforce this as a hard error, not a warning — see V1-7.

## What ships in Minimum V1

| # | Item | Notes |
|---|---|---|
| V1-1 | `marketingContacts` collection + full consent audit fields | Per F3, unchanged — consent records are the one thing not worth cutting |
| V1-2 | `submit-newsletter-signup.js` public endpoint | Per F1 |
| V1-3 | Rewritten `newsletter-form.tsx`, **footer only** | Fixes the live fake (§1.5) |
| V1-4 | Welcome email via the **existing SMTP path** | Per F20, but reusing `_lib/email-signature.js` |
| V1-5 | Tokenized unsubscribe page + endpoint | Per F16, unchanged — legally required under CASL |
| V1-6 | Portal: contacts list + campaign create/send, admin-only | Two screens, not five |
| V1-7 | Campaign send: Claude generation → edit → preview → test → Send Now | One background function, hard 200-recipient cap |
| V1-8 | Server-side consent enforcement in one shared predicate | Per F6, unchanged — this is the safety core |

## What is explicitly deferred (and why it's safe to defer)

| Deferred | Reason | Trigger to revisit |
|---|---|---|
| Email service provider + webhooks | No volume yet | List > 200, or first bounce complaint |
| Open / click / bounce / delivered metrics | Impossible without an ESP | Ships with the ESP |
| Cron drainer + retry/backoff queue | One pass covers 200 throttled sends | Ships with the ESP |
| Scheduling ("Send Later") | Send Now covers the need | On request |
| Block editor (F10) | Subject + headline + body + CTA as plain fields is enough | On request |
| Gallery image picker (F11) | No media store (§1.8); absolute image URLs can be pasted | On request |
| 7 audience segments → **3** (All / Tutoring / Robotics) | The other four can't be distinguished on a list this small | List > 200 |
| 8 AI edit actions → **3** (Shorter / Friendlier / Regenerate) | Covers the real editing loop | On request |
| Backfill import script (F4) | Nothing is importable — all existing consent is single-purpose (§1.4) | A genuinely consented CSV arrives |
| Home + Gallery signup placements (F2) | Footer is sitewide already | After the footer form proves out |
| Campaign history stats, duplicate, audit log | Sent/failed counts from our own loop suffice | Ships with the ESP |
| Automations, per-recipient personalization (F21/F22) | Already out of scope | — |

## Minimum V1 collections

Only two new collections instead of six:

| Collection | Purpose |
|---|---|
| `marketingContacts` | contact + consent + unsubscribe token hash |
| `newsletterRequestKeys` | signup idempotency |
| `marketingCampaigns` | campaign content, status, and its own sent/failed counters |

`campaignRecipients` is kept — **it is the duplicate-send guard**, and its
deterministic `{campaignId}_{contactId}` doc ID is what makes double-sending
impossible. Do not cut it. `emailEvents` and `campaignAuditLog` are deferred.

## AI provider

**OpenAI** (decided 2026-09-13 — the user already had an OpenAI API account;
Claude was the initial pick and was swapped before launch). Model from
`OPENAI_MODEL`, default `gpt-4o`. Server-side only, in the portal repo, key in
`OPENAI_API_KEY` — never a `VITE_` prefix (Vite inlines those into the browser
bundle).

Structured Outputs (`text.format` with `type: 'json_schema'`, `strict: true`) on
the Responses API. The model returns fields, never HTML.

`netlify/functions/_lib/campaign-ai.js` is the ONLY file that talks to a model.
Changing providers again means rewriting that one file: validation, rendering,
the consent gate and the sender never touch it.

## Revised phase order

- **Phase A (V1-1 → V1-4):** contacts, consent, working signup, welcome email. **DONE**
- **Phase B (V1-5):** unsubscribe page, endpoint, hashed tokens. **DONE**
- **Phase C (V1-6, V1-7, V1-8):** portal screens, Claude generation, send. **DONE**

Note recorded during Phase C: unsubscribe tokens are now DERIVED
(HMAC-SHA256 of the contact's document id under MARKETING_UNSUBSCRIBE_SECRET),
not random. Phase A stored only the token hash, which meant a campaign sent
months later had no way to rebuild a working unsubscribe link. Derivation
keeps "only the hash is stored" while making the token recomputable by any
server holding the secret. The secret must be identical in both repos, and
rotating it invalidates every unsubscribe link already delivered.

Also: MAX_CAMPAIGN_RECIPIENTS (200) is enforced as a hard 409 in
start-campaign-send.js. Raising it without first configuring an email service
provider is the one change this design explicitly does not support.

Note recorded during Phase B: `process-unsubscribe.js` deliberately does NOT use
`enforceRateLimit`. That bucket is 5 requests / 15 min / IP shared across every
submission endpoint, so a parent who had just used another form could be blocked
from unsubscribing. The token's 256 bits of entropy is the authorization; a
malformed token is rejected before any read. Do not "restore" the rate limit.


---

# PART 1 — AUDIT FINDINGS (already done — do not re-litigate)

## 1.1 There are TWO repos sharing ONE Firestore

| | Public website | Staff/admin portal |
|---|---|---|
| Path | `kriana-tutoring-website-ws/kriana-tutoring-website/website` | `kriana-tutoring-platform/apps/app` |
| Stack | Next.js 14 App Router + TypeScript + Tailwind | Vite + React 18 SPA + React Router + Tailwind |
| Deploy | Netlify (`@netlify/plugin-nextjs`), base `website` | Netlify, publish `dist`, SPA redirect `/* -> /index.html` |
| Server code | `website/netlify/functions/*.js` (ESM) | `apps/app/netlify/functions/*.js` (ESM) |
| Shared helpers | `netlify/functions/_lib/` | `netlify/functions/_lib/` |

Both apps point at the **same Firebase project** (`...toring`, i.e. the single
`kriana-tutoring` project). `firestore.rules`, `firestore.indexes.json` and
`storage.rules` live **only in `kriana-tutoring-platform/apps/app/`** — that is the
single source of truth for security rules for both apps.

There is no monorepo link, no shared package. Cross-repo helpers are **copied, not
imported**, and the code says so explicitly (see the header comment in
`apps/app/netlify/functions/_lib/parent-message-email.js`). Follow that existing
convention rather than inventing a shared package.

## 1.2 Email delivery — **THIS IS THE BLOCKER, READ IT FIRST**

There is **no transactional email provider**. No SendGrid, Postmark, Resend, SES,
Mailgun, Brevo or Mailchimp anywhere in either repo.

Every email in the platform is sent by **nodemailer over raw SMTP**:

```js
nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})
```

That exact block is duplicated in:
- `website/netlify/functions/_lib/demo-email.js`
- `website/netlify/functions/_lib/email-signature.js` consumers
  (`submit-enrollment-request.js`, `submit-birthday-request.js`,
  `send-booking-confirmation.js`, `notify-next-waitlisted.js`)
- `apps/app/netlify/functions/_lib/parent-message-email.js`
- `apps/app/netlify/functions/_lib/*-email.js` (demo payment confirmed,
  registration invoice, birthday request status, placement confirmation)

The default host is `smtp.gmail.com` and the credentials are a Google
Workspace/Gmail mailbox (`info@krianatutoring.com`, per `ADMIN_EMAIL` and the
signature block in `demo-email.js`).

### Conclusion — stated plainly

**The existing provider CANNOT be extended for bulk/campaign email.** The original
brief's own hard rule ("do NOT route mass newsletter campaigns through a personal
Gmail mailbox") rules out the only sender we currently have. Concretely, Google
Workspace SMTP relay is capped in the low hundreds of recipients/day, gives us no
bounce/open/click webhooks, no per-message delivery IDs, no list-unsubscribe
header handling, and a bulk send would put the `krianatutoring.com` domain's
Workspace reputation — the mailbox that also carries invoices and registration
confirmations — at risk of suspension.

**Therefore introducing ONE new email provider is REQUIRED, not optional.** This is
the documented limitation the original brief asked for. Required properties:
domain-verified sending for `krianatutoring.com`, a batch/bulk send API, and
delivery/bounce/open/click webhooks.

**Recommendation: Resend** (simplest API, good Netlify-function fit, webhooks,
generous free tier), with **Postmark** (broadcast streams) as the fallback if
deliverability guarantees matter more than DX. Do NOT use Brevo or Mailchimp — the
brief forbids adding a CRM, and both bring their own contact database that would
compete with ours.

**Hard boundary to preserve:**
- Transactional email (registrations, invoices, booking confirmations, demo
  acknowledgements, parent messages) **stays on the existing nodemailer/SMTP path,
  unchanged.** Do not touch those files beyond what is strictly additive.
- Marketing email (campaigns, welcome email for newsletter signups) goes through
  the new provider, in a new `_lib/marketing-email.js` module.

Before writing code, get the user to confirm the provider choice and to add the
domain + DNS records. Everything else in Phase A can proceed without it.

## 1.3 AI integration — **there is none**

- `website/app/api/chat/route.ts` **looks** like an AI endpoint but is a hardcoded
  keyword matcher (`SUBJECT_GUIDANCE` / `FAQ_RESPONSES` string tables). No model
  call. It also contains stale copy (a US phone number `(469) 640-1412` and
  `hello@kriana.com`) that does not match the real business details.
- No `openai`, `@anthropic-ai/sdk`, `langchain` or any LLM package in either
  `package.json`. No `OPENAI_API_KEY` or equivalent in `.env.local` or
  `.env.example` in either repo.

So AI generation is **greenfield**. Add exactly one server-side integration, in the
**platform repo's** Netlify functions (never the browser, never the Next.js public
site). Model choice is the user's call; if unspecified, default to the Claude API
(`claude-sonnet-5` for edit actions, `claude-opus-5` for full campaign generation)
since that is what the rest of the user's tooling uses — but the brief said "GPT",
so **ask once and then stop asking**.

Do not touch `app/api/chat/route.ts` as part of this work.

## 1.4 Contacts / leads — **no contact model exists**

There is no `contacts`, `leads`, `subscribers` or `marketingContacts` collection.
Lead-shaped data is scattered across these Firestore collections:

| Collection | Written by | Holds |
|---|---|---|
| `demoRegistrations` | website `submit-demo-registration.js` | parentName, parentEmail, childName, `consentAccepted`, `marketingAttribution` |
| `waitlist` | website `submit-demo-waitlist.js` | same 5-field payload + `consentAccepted` + `marketingAttribution` |
| `registrations` | website `submit-enrollment-request.js` | enrolled/enrolling families, `parentEmail`, `programSnapshot` |
| `birthdayPartyRequests` | website `submit-birthday-request.js` | party enquiries |
| `families` / `students` / `users` | portal | existing customers and staff/parent accounts |

**Critical consent finding:** `demoRegistrations` and `waitlist` already store
`consentAccepted: true`, and there is an existing `marketingAttribution` object on
both (populated from UTM/Facebook attribution at capture time, stamped with
`capturedAt`). **`consentAccepted` is NOT marketing consent.** Read the wording it
records — `DemoWaitlistForm.tsx:212`: *"I confirm this information is accurate and
consent to Kriana contacting me about the next Young Engineers…"*. That is
single-purpose contact consent for one event. It must **never** be imported as
`marketingConsent = true`. `marketingAttribution` is fine to reuse as `leadSource`.

**Contact form is not even stored:** `app/contact/contact-inquiry-form.tsx` POSTs
to `https://api.web3forms.com/submit` — a third-party relay. Contact enquiries
never reach our database. Do not try to source contacts from it; optionally note
this to the user as separate future work.

**Consequence for the original brief's Feature 3:** there is no existing contact
model to extend. A new `marketingContacts` collection is correct and is not
duplication. It is a *marketing projection* of people, keyed by normalized email,
linked back to source records — not a replacement for `registrations`/`families`.

## 1.5 Existing newsletter component — **it is a fake**

`website/components/newsletter-form.tsx` exists and is rendered in
`components/footer.tsx:131`. It has **no backend at all**: `handleSubmit` calls
`preventDefault()`, sets state to `"submitted"`, and renders *"Thanks for
subscribing!"*. The email address is discarded.

This is a live, user-facing correctness bug: the footer currently tells visitors
they subscribed when nothing was recorded. **Feature 1 is a replacement of this
component, not an addition,** and fixing it should be called out as such.

## 1.6 Admin surfaces — use the portal, ignore the website's `/admin`

- **Real admin: the portal SPA.** Routes in `apps/app/src/App.jsx`, all under
  `/tutor/*`, wrapped in `<ProtectedRoute requiredRole="tutor|admin">`. Booking
  admin screens live under `/tutor/booking/*` in `src/pages/admin/`
  (`RegistrationsAdmin.jsx`, `WaitlistAdmin.jsx`, `DemoRegistrationsAdmin.jsx` …) —
  **copy these screens' table/filter/layout idiom exactly.** Sidebar nav is
  data-driven from `src/lib/tutorSidebarNav.js` (`computeVisibleNavLabels`), which
  has its own unit test — add the new nav entry there, not in the JSX.
- **Dead admin: the website's `app/admin/*`.** `lib/admin-client.ts` talks to a
  FastAPI backend at `NEXT_PUBLIC_API_URL` that is not part of this system, using a
  `localStorage` bearer token. It is legacy. **Do not build anything into it.**

**Server-side authorization** is already solved and must be reused verbatim:
`apps/app/netlify/functions/_lib/firebase-admin.js` exports `requireStaff(event)`
and `requireAdmin(event)` — they verify a Firebase ID token from the
`Authorization: Bearer` header and check `users/{uid}.role`. `authErrorResponse` is
the matching error formatter. See `send-parent-message.js` for the canonical
handler shape.

## 1.7 Background / async infrastructure

There is no Redis, no Cloud Tasks, no worker process. What exists:

- **Netlify scheduled functions** declared in `netlify.toml`:
  `[functions."expire-demo-payment-holds"] schedule = "0 * * * *"` (website) and
  `[functions."expire-enrollment-offers"]` (portal). These are the cron primitive.
- **Firestore transactions** for atomic state changes (see `expireOneDemoHold`).
- **Idempotency-key collections** — `demoRequestKeys`, `enrollmentRequestKeys`,
  `processedDemoWebhookEvents` — the established pattern for "do this exactly once".
- **Rate limiting** — `submissionRateLimits` collection, HMAC'd client IP with
  `ENROLLMENT_RATE_LIMIT_SALT`, in `submit-enrollment-request.js:387`.
- **Netlify background functions** (a `-background.js` filename suffix, 15-minute
  limit) are **not currently used anywhere** but are available and are the right
  tool here. Normal functions have a ~10s timeout — a synchronous bulk send would
  hard-fail.

`netlify.toml` also carries a very pointed comment about a duplicate scheduled job
that mass-cancelled demo registrations. **Read it before adding any cron job.**

## 1.8 Gallery & media

`website/data/gallery.ts` is a **static TypeScript array** (`galleryMedia`) with
`publicApproved` / `featured` / `order` flags and categories
(`center | academic | robotics | demo`); `lib/gallery.server.ts` filters it. Images
are files in `website/public/`. There is **no media database and no upload UI.**
Firebase Storage exists (`storage.rules` in the portal) but is not used for gallery
media.

## 1.9 Verified business facts (use these — do not invent)

From `_lib/email-signature.js` / `demo-email.js`:

```
Jignasa Parghi
Kriana Tutoring | Young Engineers Kanata
613-400-6921 · info@krianatutoring.com · krianatutoring.com
```

E-transfer/contact address: `NEXT_PUBLIC_ETRANSFER_EMAIL`, default
`info@krianatutoring.com`. Kanata, Ontario. Brand logos already exist as base64
modules: `_lib/kriana-logo-base64.js` and `_lib/young-engineers-logo-base64.js`,
embedded as `cid:` inline attachments. **Reuse those for the campaign template.**
Ignore the stale US phone/email in `app/api/chat/route.ts`.

## 1.10 Tests, lint, schema changes

- Website tests: `website/tests/*.test.mjs`, run with `node --test`.
- Portal tests: `apps/app/tests/*.test.js`, scripts `npm run test:security`,
  `test:enrollment-lifecycle`, `test:demo-lifecycle`.
- Lint: `npm run lint` (Next.js ESLint) in the website repo.
- **There is no SQL migration mechanism.** Firestore is schemaless. "Schema change"
  means: new collection + a `match` block in
  `kriana-tutoring-platform/apps/app/firestore.rules`, plus any composite index in
  `firestore.indexes.json`, plus a one-off backfill script under `apps/app/scripts/`
  following the `seed.mjs` / `seed-local-staff.mjs` style.
- Existing collections are almost all **server-owned**: rules read
  `allow read: if isStaff(); allow write: if false;` and all writes go through
  Firebase Admin in Netlify functions. **`marketingContacts`, `campaigns`,
  `campaignRecipients` and `emailEvents` must follow the same pattern —
  `allow read: if isStaff(); allow write: if false;`.** The browser never writes
  marketing data directly.

---

# PART 2 — REVISED REQUIREMENTS

Numbering follows the original brief so the two can be diffed. Changes from the
original are marked **[CHANGED]**, **[NEW]** or **[DROPPED]** with a reason.

## F1 — Public newsletter signup **[CHANGED: replace the existing fake component]**

Rewrite `website/components/newsletter-form.tsx`. Keep the export name
`NewsletterForm` so `footer.tsx` keeps working; add props for layout variants
(`variant?: "footer" | "section"`).

Heading: **Join Kriana Learning Updates**

Description: *Get helpful learning tips, free worksheets, STEM activities,
upcoming demos, program updates and special offers from Kriana Tutoring.*

Fields: Parent Name (required); Email Address (required, format-validated
client- and server-side); "I'm interested in:" → Academic Tutoring | Robotics &
STEM | Both.

Marketing consent checkbox, **unchecked by default, required to submit**:

> Yes, I'd like to receive learning resources, program updates, upcoming events
> and promotional emails from Kriana Tutoring. I can unsubscribe at any time.

Submits to a **new website Netlify function** `submit-newsletter-signup.js`
(website repo — this is a public form, so it belongs with the other public
submission endpoints). That function must follow the house pattern established by
`submit-demo-waitlist.js`:
- Firebase Admin write only (`_lib/firebase-admin.js`)
- IP rate limiting via `submissionRateLimits` + `ENROLLMENT_RATE_LIMIT_SALT`
- an idempotency key doc (new `newsletterRequestKeys` collection) keyed off a
  digest of normalized email + clientRequestId
- never throws on email-send failure; the contact is saved regardless
- returns a generic success response that does **not** reveal whether the email was
  already subscribed (enumeration guard)

Consent is stored as a full audit record, never a bare boolean:

```ts
marketingConsent: boolean
marketingConsentDate: Timestamp
marketingConsentSource: 'website-newsletter'
marketingConsentText: string   // the exact checkbox wording shown, verbatim
```

Store the wording **as rendered**, so a later copy change doesn't rewrite history.
Keep the canonical string in one shared constant used by both the component and the
function (copied into each repo per §1.1's copy-not-import convention, with a
cross-reference comment).

## F2 — Signup locations **[CHANGED: 3 placements, footer is a replacement]**

1. Footer (`components/footer.tsx`) — already renders it; the compact variant.
2. Home page (`app/page.tsx`) — one section-variant block.
3. Gallery page (`app/gallery/page.tsx`) — one section-variant block.

Do **not** add consent UI to `DemoWaitlistForm.tsx`, `register-form.tsx`,
`contact-inquiry-form.tsx` or the demo registration flow in this version. Those
forms have their own single-purpose consent wording (§1.4) and changing them risks
the live booking funnel. Adding a marketing opt-in to the demo flow is a good
follow-up, tracked separately.

## F3 — Contact database **[CHANGED: new collection, justified]**

New Firestore collection **`marketingContacts`**, document ID = a stable digest of
the normalized email (lowercased, trimmed) so a re-submit is an upsert and can
never create a duplicate. Same digest-as-doc-ID trick the codebase already uses for
`demoEligibilityLocks`.

```ts
{
  email: string                  // normalized, lowercase
  emailDisplay: string           // as the parent typed it
  firstName: string
  lastName: string | null

  interests: { tutoring: boolean, robotics: boolean }
  childGrade: string | null
  childAge: number | null

  leadSource: string             // see F4 vocabulary
  leadDate: Timestamp
  marketingAttribution: object | null   // reuse the existing shape from demo flows

  marketingConsent: boolean
  marketingConsentDate: Timestamp | null
  marketingConsentSource: string | null
  marketingConsentText: string | null
  consentHistory: Array<{ consent, date, source, text }>   // append-only

  status: 'lead' | 'prospect' | 'registered' | 'active-student' | 'past-student'

  sourceRefs: Array<{ collection: string, id: string }>    // links back to
                 // demoRegistrations / waitlist / registrations docs

  lastMarketingEmailAt: Timestamp | null
  unsubscribedAt: Timestamp | null
  unsubscribeTokenHash: string   // see F16 — store a HASH, never the token

  createdAt: Timestamp
  updatedAt: Timestamp
}
```

Upsert rules: never downgrade consent (an existing `marketingConsent: true` is not
cleared by a later no-consent form); never clear `unsubscribedAt` on a re-submit
from an import — only an explicit, fresh, consented signup may re-subscribe, and it
must append to `consentHistory`. Merge `interests` (union), fill blank fields only.

Rules block: `allow read: if isStaff(); allow write: if false;`

## F4 — Importing existing leads **[CHANGED: consent is NOT inferable]**

Write a backfill script under `apps/app/scripts/` (not a UI feature) that walks
`demoRegistrations`, `waitlist`, `registrations`, `birthdayPartyRequests` and
`families`, and upserts `marketingContacts` with:

```ts
marketingConsent: false   // ALWAYS, for every one of these sources
```

`consentAccepted` on demo/waitlist docs is single-purpose event consent (§1.4) and
must not be promoted. The script sets `leadSource`, `leadDate` (from `createdAt`),
`marketingAttribution` (copied from the source doc) and `status` — a doc in
`registrations` maps to `registered`, a `families`/active student to
`active-student`, demo/waitlist to `lead`.

`leadSource` vocabulary: `facebook-lead-form`, `website-newsletter`,
`demo-registration`, `demo-waitlist`, `enrollment-request`, `birthday-request`,
`academic-assessment`, `robotics-inquiry`, `referral`, `import`, `other`.

For genuinely consented external lists (e.g. a Facebook Lead Form export whose
form actually carried a marketing opt-in), support a **separate CSV import** that
requires the operator to supply the consent wording and consent date per file, and
records them into `consentHistory`. Reuse `apps/app/src/lib/csv.js` (it has tests).
Run it dry-run first and print a summary before writing.

## F5 — Admin Email Center **[CHANGED: lives in the portal, under /tutor]**

New portal routes, admin-only:

```
/tutor/marketing                      → EmailCenterDashboard.jsx
/tutor/marketing/contacts             → MarketingContactsAdmin.jsx
/tutor/marketing/campaigns            → CampaignsAdmin.jsx
/tutor/marketing/campaigns/new        → CampaignEditor.jsx
/tutor/marketing/campaigns/:id        → CampaignDetail.jsx  (content + stats)
```

Pages go in `apps/app/src/pages/marketing/`, mirroring `src/pages/admin/`. Wrap
each in `<ProtectedRoute requiredRole="admin">` — marketing sending is
**admin-only, not tutor-level**, unlike the booking screens. Add the nav label in
`src/lib/tutorSidebarNav.js` (admin branch only) and update its unit test.

Dashboard tiles: Total Contacts · Marketing Subscribers · Tutoring Leads ·
Robotics Leads · Existing Families · Unsubscribed, plus a **Create AI Campaign**
button and links to Campaigns / Contacts / Templates. **[DROPPED]** the
"Automations — future" card: don't ship a nav item that goes nowhere.

Counts come from a single server endpoint, not from client-side reads — the rules
block above forbids client writes and we want the counts computed once.

## F6 — Contacts screen **[unchanged in substance]**

Columns: Name · Email · Interest · Source · Status · Consent · Date Added · Last
Email. Search by name/email. Filters: Interest, Source, Status, Marketing status
(Subscribed / Unsubscribed / No marketing consent).

Eligibility is enforced **server-side** in one shared module, and the UI filter is
only a convenience:

```
eligible ⇔ marketingConsent === true && unsubscribedAt == null
```

Put that predicate in exactly one place —
`apps/app/netlify/functions/_lib/marketing-audience.js` — and have audience
counting, test sends, and the actual send loop all call it. Re-check it **per
recipient at send time**, not just when the audience is resolved: a parent can
unsubscribe while a campaign is draining.

Firestore composite indexes will be needed for the filter combinations; add them to
`apps/app/firestore.indexes.json`. Prefer few, well-chosen indexes over one per
filter permutation — server-side filter-in-memory is acceptable at this list size.

## F7 / F8 — Campaign creation and audience **[unchanged in substance]**

Wizard: Details → Audience → Generate with AI → Edit → Preview → Test → Review →
Send/Schedule.

Details: Campaign Name; Objective (Newsletter | Tutoring Promotion | Robotics
Promotion | Demo/Event | Free Worksheet/Resource | Program Announcement | General
Update | Custom); AI Instructions (large textarea).

Audiences: All Marketing Subscribers · Academic Tutoring Leads · Robotics Leads ·
Tutoring + Robotics · Existing Families · Demo Leads · Custom. Show the eligible
count **and the exclusion breakdown** before sending, computed server-side.

## F9 — AI generation **[CHANGED: greenfield, server-side only, in the portal]**

New function `apps/app/netlify/functions/generate-campaign-content.js`, guarded by
`requireAdmin`. API key from `process.env` in the function only — it must never
appear in `VITE_*` (Vite inlines those into the browser bundle) and never in the
Next.js site.

Brand context for the prompt is built from the verified facts in §1.9 plus the
selected audience's characteristics. Output as **structured JSON**, validated
server-side before it reaches the editor:

```
subject · previewText · headline · bodySections[] · ctaText · ctaUrl
```

Section kinds: `academic-tip | free-resource | tutoring-update | robotics-update |
upcoming-event | cta`. Store the structured blocks on the campaign, and render to
HTML server-side at send time — do **not** let the model emit raw HTML that we
inject. CTA URLs must be validated against an allowlist of `krianatutoring.com`
paths (reuse `website/lib/site-links.ts` as the source of valid destinations).

AI edit actions (Make Shorter / Friendlier / More Professional / Improve Subject /
Improve CTA / Focus Tutoring / Focus Robotics / Regenerate) hit the same endpoint
with an `action` discriminator and the current content. Manual editing always
available. **AI never sends.** Generation endpoints must be physically incapable of
triggering a send — separate functions, separate Firestore writes.

## F10 — Editor and brand template **[CHANGED: block editor, not rich text]**

Because content is structured blocks (F9), the editor is a **block list**, not a
WYSIWYG: add/reorder/delete blocks of type heading, paragraph, button, image,
divider. Inline formatting limited to bold and links, stored as a tiny safe subset
and escaped on render with the existing
`apps/app/netlify/functions/_lib/html-escape.js`. No Canva-style builder.

The branded template reuses the existing email chrome: the `cid:` inline logo
pattern and card layout from `_lib/parent-message-email.js` / `_lib/demo-email.js`,
with the Kriana logo from `_lib/kriana-logo-base64.js`.

Header: **Kriana Tutoring** — *Personalized Tutoring • Robotics • STEM*
Footer (verified details from §1.9):

```
Kriana Tutoring
Kanata, Ontario
KrianaTutoring.com

You are receiving this email because you requested updates from Kriana Tutoring.

Unsubscribe
```

Note: the marketing template must **not** carry the personal
`emailSignatureHtml()` sign-off block used by transactional mail — a mass campaign
signed as a personal 1:1 note from Jignasa is a deliverability and tone problem.

## F11 — Media **[CHANGED: static gallery, absolute URLs, no upload]**

Image picker sources `galleryMedia` from `website/data/gallery.ts`, filtered to
`publicApproved === true`. Because the portal is a separate deploy (§1.1), expose
the approved list through the website's existing public-catalog API pattern
(`website/app/api/public-catalog/…`) as a new read-only route, or copy the list —
your call, but say which and why in the PR.

Emails reference images by **absolute `https://krianatutoring.com/...` URL**, not
by copying bytes. **[DROPPED]** "Upload Image" in V1 — there is no media store
(§1.8) and building one is out of scope. Leave the picker's source list
extensible so a Storage-backed source can be added later.

## F12 / F13 — Preview and test send **[unchanged]**

Desktop and mobile preview showing sender, subject, preview text, body, CTA,
footer, unsubscribe. **Send Test Email** goes only to the signed-in admin's own
account email (from the verified Firebase token — not a free-text field, which
would be an open relay). Test sends bypass the consent gate **by construction**:
they run through a separate code path that never touches `campaignRecipients` and
never increments campaign counters. Subject is prefixed `[TEST]`.

## F14 / F15 — Sending infrastructure **[CHANGED: concrete Netlify design]**

```
CampaignEditor  ──POST──▶  start-campaign-send.js        (requireAdmin, fast)
                              │ 1. idempotency: campaigns/{id}.sendLock via txn
                              │ 2. status draft|scheduled → sending
                              │ 3. resolve eligible contacts, write
                              │    campaignRecipients/{campaignId}_{contactId}
                              │    docs with status 'queued'
                              └─▶ returns immediately (202) with counts
                                        │
send-campaign-batch-background.js ◀─────┘  (invoked, 15-min limit)
   drains N queued recipients per pass, rate-limited to the provider's cap,
   marks each sent|failed, retries transient failures up to 3× with backoff,
   re-invokes itself while work remains

drain-campaign-queue.js   (scheduled, every 5 min in netlify.toml)
   backstop: picks up campaigns stuck in 'sending', and fires scheduled
   campaigns whose sendAt has passed
```

Rules, all non-negotiable:
- Starting a send **must not** block on delivery. 202 + counts, immediately.
- `campaignRecipients` doc ID is deterministic (`{campaignId}_{contactId}`) —
  that alone makes double-sending to one person impossible, the same
  key-as-doc-ID idempotency the repo already uses (§1.7).
- A campaign in status `sending` or `sent` cannot be started again; enforce in a
  Firestore transaction on the campaign doc.
- One recipient's failure never aborts the batch (`Promise.allSettled`, exactly as
  `sendAcknowledgements` already does).
- Re-check the eligibility predicate per recipient immediately before send.
- Log every send outcome. Never log full email bodies or API keys.
- **Read the `netlify.toml` comment about the duplicate cron job (§1.7) before
  adding the scheduled entry.**

## F16 — Unsubscribe **[CHANGED: hashed tokens, public page on the website]**

Token: 32+ random bytes, base64url. Store only a **SHA-256 hash** on the contact
(`unsubscribeTokenHash`); the raw token exists only inside the sent email. No
database IDs in the URL.

Public page in the **website** repo: `app/unsubscribe/[token]/page.tsx`, posting to
a new function `website/netlify/functions/process-unsubscribe.js` which hashes the
token, finds the contact, sets `unsubscribedAt` and `marketingConsent: false`, and
appends to `consentHistory`. Constant-time comparison; the same generic response
whether or not the token matched.

Confirmation copy:

> You've been unsubscribed from Kriana Learning Updates.
> You will no longer receive promotional emails from us.

Also send the `List-Unsubscribe` and `List-Unsubscribe-Post` headers.

**Transactional separation is absolute:** unsubscribing sets fields on
`marketingContacts` only. It must not write to `registrations`, `families`,
`users`, `demoRegistrations` or anything the transactional emailers read. Add a
test that asserts an unsubscribed parent still receives a registration invoice
email. Also add a one-line comment in the unsubscribe function stating this, so a
future change doesn't "helpfully" propagate it.

## F17 / F18 / F19 — Events, reports, history **[unchanged in substance]**

New `emailEvents` collection: `{ campaignId, contactId, recipientId, type,
providerMessageId, timestamp, meta }` with type in `queued | sent | delivered |
opened | clicked | bounced | failed | unsubscribed`. Provider webhook handler at
`apps/app/netlify/functions/email-provider-webhook.js`, **signature-verified**
(follow `stripe-webhook.js`'s verification + `processedDemoWebhookEvents`-style
replay guard).

Report and history screens as originally specified. Only display metrics the
provider actually reports — if opens aren't available, show "—", never a computed
guess. Campaign statuses: Draft | Scheduled | Sending | Sent | Failed | Cancelled.
A `Sent` campaign is read-only; **Duplicate Campaign** creates a new Draft.

## F20 — Welcome email **[CHANGED: sender depends on §1.2]**

On a consented newsletter signup: store contact → record consent → send
**Welcome to Kriana Learning Updates**. It is a marketing email (it goes only to
people who opted in, and it needs an unsubscribe link), so it goes through the new
marketing sender, **not** the SMTP transactional path. Content: thanks, what to
expect (learning tips, free worksheets, tutoring updates, robotics/STEM activities,
demos/events, announcements), links built from `website/lib/site-links.ts`,
unsubscribe footer. Failure to send must not fail the signup.

## F21 / F22 — Future automations and personalization **[unchanged: design only]**

Do not build the automation engine or per-recipient AI. The models above already
accommodate them: `campaignRecipients` is per-contact, `emailEvents` is
time-series, `interests` and `status` support triggers. Do not add an `automations`
collection, a workflow runner, or per-recipient generation in V1.

---

# PART 3 — SECURITY (revised to this codebase)

- Every portal marketing endpoint: `requireAdmin` from
  `apps/app/netlify/functions/_lib/firebase-admin.js`, with `authErrorResponse`.
- Every public endpoint (signup, unsubscribe): rate-limited via
  `submissionRateLimits`, idempotency-keyed, no enumeration in responses.
- Secrets — AI key, email provider key, webhook signing secret, SMTP creds — live
  in Netlify environment variables read inside functions only. **Never a `VITE_`
  or `NEXT_PUBLIC_` prefix**; Vite and Next both inline those into the browser
  bundle. Add placeholders to both `.env.example` files.
- Campaign HTML is rendered server-side from validated structured blocks and
  escaped with the existing `_lib/html-escape.js`. Never inject model output as raw
  HTML; never `dangerouslySetInnerHTML` model output in the preview — render the
  same block renderer client-side.
- Unsubscribe tokens: random, hashed at rest, constant-time compared.
- Audit trail: a `campaignAuditLog` collection (or an append-only array on the
  campaign) recording created / edited / scheduled / sent / cancelled with
  `{ uid, role, at }` from the verified token — the same shape `parentMessages`
  already uses for logging staff sends.

---

# PART 4 — DATA MODEL SUMMARY

New collections (all `allow read: if isStaff(); allow write: if false;` in
`apps/app/firestore.rules`):

| Collection | Purpose |
|---|---|
| `marketingContacts` | the contact + consent record (F3) |
| `newsletterRequestKeys` | signup idempotency (F1) |
| `campaigns` | draft/scheduled/sent campaign + structured content |
| `campaignRecipients` | one doc per (campaign, contact), deterministic ID |
| `emailEvents` | provider event stream |
| `campaignAuditLog` | admin action trail |

Reused, unchanged: `registrations`, `demoRegistrations`, `waitlist`, `families`,
`users`, `submissionRateLimits`, `programs`, `programOfferings`.

---

# PART 5 — IMPLEMENTATION ORDER

**Phase 0 — decisions (blocking, ask once):**
1. Confirm the email provider (recommendation: Resend) and get domain + DNS done.
2. Confirm the AI model/provider.
Everything in Phase A is unblocked by neither and can start immediately.

**Phase A — contacts, consent, signup.** `marketingContacts` + rules + indexes;
`submit-newsletter-signup.js`; rewrite `newsletter-form.tsx` (fixes the live fake
— §1.5); place it in footer/home/gallery; backfill script with dry-run.

**Phase B — Email Center + campaigns.** Portal routes, nav, dashboard, contacts
screen, campaign CRUD, `marketing-audience.js` with the single eligibility
predicate + its unit tests.

**Phase C — AI generation + editor.** Generation endpoint, structured-block
validation, block editor, edit actions, preview.

**Phase D — sending + unsubscribe.** Marketing sender module, background batch
function, scheduled drainer, test send, unsubscribe page/function/tokens, welcome
email.

**Phase E — events + reporting.** Webhook handler, `emailEvents`, campaign report,
history, duplicate.

No phase may modify the existing transactional email files beyond additive
changes.

---

# PART 6 — VERIFICATION

**Newsletter:** valid signup succeeds · invalid email rejected server-side ·
duplicate email upserts (never a second contact doc) · consent record complete with
verbatim wording · welcome email sent · subscriber visible in the portal.

**Campaign:** draft created · AI generation returns valid structured JSON ·
invalid/malformed model output rejected, not rendered · manual edits persist ·
audience counts correct · **consent enforced server-side even when the client
sends a hand-crafted audience payload** · test email reaches only the admin and
creates no recipient rows · preview matches sent output · send and schedule work.

**Safety:** unsubscribed contact excluded · no-consent contact excluded · calling
the start-send endpoint twice sends once · one failing recipient does not abort the
batch · unsubscribe link works and is idempotent · **an unsubscribed parent still
receives registration/invoice/booking emails** (explicit test).

**Regression — run these, don't assume:**
```
# website repo
cd kriana-tutoring-website-ws/kriana-tutoring-website/website
npm run lint && npm run build && node --test tests/

# portal repo
cd kriana-tutoring-platform/apps/app
npm run test:security && npm run build
```
Plus a manual pass on demo registration, enrollment request, booking confirmation
email, invoice email, and admin/tutor login.

---

# PART 7 — OPEN ITEMS FOR THE USER

1. **Email provider + DNS** — blocking for Phase D. (§1.2)
2. **AI provider/model** — blocking for Phase C. (§1.3)
3. **Contact form goes to web3forms.com**, so contact enquiries are not in our
   database at all and cannot feed the contact list. Worth fixing, but separate
   work. (§1.4)
4. **The footer newsletter form is currently lying to visitors** — it says
   "Thanks for subscribing!" and discards the address. Phase A fixes it; the user
   should know it has been live. (§1.5)
5. **Stale contact details in `app/api/chat/route.ts`** — a US phone number and a
   `hello@kriana.com` address that aren't the business's. Out of scope here, but
   flagged. (§1.3)
6. **Adding a marketing opt-in to the demo/registration forms** would grow the
   consented list much faster than the footer alone — deliberately deferred out of
   V1 to protect the live booking funnel. (§F2)
