# How the Demo, Fully Booked State, and Waitlist Work

Last updated: 2026-09-11

## Which demo is live

`/demo` shows exactly one offering, chosen by two Netlify environment
variables on the website site:

```env
DEMO_CAMPAIGN_PROGRAM_ID=young-engineers-demo-kanata-sep-2026
DEMO_CAMPAIGN_OFFERING_ID=young-engineers-demo-kanata-sep-2026-offering
```

The demo product is also gated by `ENABLE_DEMO_PAYMENTS=true` (server) and
`NEXT_PUBLIC_ENABLE_DEMO_PAYMENTS=true` (browser). Both are `true` in
production.

The program ID must also be in the code allowlist
`website/lib/demo-eligibility.js` (`DEMO_ELIGIBLE_PROGRAM_IDS`) **and** the
program document must have `demoEligible: true`.

## Demo states

The single source of truth is `demoPublicBookingState(offering)` in
`website/netlify/functions/submit-demo-registration.js`. It runs only after
`assertLiveDemoOffering` confirms the offering exists, is `offeringType:
'demo'`, `isPublished: true`, `publicCatalogVersion: 1`, status `Open` or
`Full`, and its program is active and demo-eligible.

| State | When | `/demo` shows | Register link shows | Booking endpoint |
|---|---|---|---|---|
| `open` | inside window, seats left, not paused | Normal page with "Reserve My Child's Spot — $10" | $10 registration form | Accepts |
| `full` | `confirmedCount + heldCount >= capacity`, **or** status `Full`, **or** `publicRegistrationPaused === true` | "Our {date} demo is fully booked!" + details + Join the Waitlist (if enabled) + Explore Regular Programs + Call + Text | Waitlist form if `waitlistEnabled === true`, otherwise a "fully booked" card with the same links | Rejects (409) |
| `closed` | outside `enrollmentOpenAt`–`enrollmentCloseAt` | "Registration has closed" + Call + Text | (form rejected server-side) | Rejects (409) |
| unavailable | missing/unpublished/invalid offering or program, or bad capacity counters | "This demo isn't available right now" + Call + Text | "not found" | Rejects |

Notes:

- `closed` wins over `full`. After the registration window ends, the page
  says "Registration has closed" and the waitlist closes too.
- `full` by capacity is **automatic**. No staff action is needed when the
  last seat is taken.
- `full` can revert to `open` automatically if a seat frees up (an unpaid
  hold expires after 48 hours via the hourly `expire-demo-payment-holds`
  job, or staff cancel a registration). Use `publicRegistrationPaused` if a
  demo must stay closed regardless of freed seats.

## The two offering switches

Both live on the `programOfferings/{offeringId}` document. Absent means
false.

| Field | `true` means | Typical use |
|---|---|---|
| `publicRegistrationPaused` | Public booking is closed even while seats remain. Capacity, counts, and registrations are untouched. | Close a demo early (September 12: capacity 20, stopped at 13). |
| `waitlistEnabled` | While the demo is `full` (by capacity or pause), the register link shows the free waitlist form and `submit-demo-waitlist` accepts entries. | Collect interested families for a spot opening or the next demo. |

Only the exact boolean `true` counts; strings such as `"true"` are ignored.

Set them with `apps/app/scripts/set-demo-offering-public-booking.mjs` in the
platform repo (see [02-operations-runbook.md](./02-operations-runbook.md)).
The portal's Offerings form **cannot** edit demo offerings, because
`firestore.rules`' `hasOnlyPublicOfferingFields` allowlist doesn't include
the demo event fields (`eventTitle`, `eventStartAt`, `eventEndAt`) or these
switches.

## What a booking does vs. what a waitlist entry does

| Effect | Demo booking (`submit-demo-registration`) | Waitlist join (`submit-demo-waitlist`) |
|---|---|---|
| Holds a seat (`heldCount + 1`) | Yes | **No** |
| `DEMO-{year}-{seq}` number (`counters/DEMO-{year}`) | Yes | **No** — gets a `WL-XXXXXXXX` reference |
| `demoEligibilityLocks/{hash}` (one $10 demo per child) | Yes | **No** |
| `demoCredits/{id}` ($10 credit) | Yes | **No** |
| E-transfer instructions email | Yes | **No** — "You're on the waitlist, no payment is due" email |
| Admin notification email | Yes | Yes ("New demo waitlist request") |
| Document written | `demoRegistrations/{id}` | `waitlist/{id}` with `waitlistType: 'demo'`, `status: 'Waiting'`, `position`, `publicReference`, `eventSnapshot`, `marketingAttribution` |
| Idempotency key | `demoRequestKeys/{sha256(program\|offering\|clientRequestId)}` | `demoRequestKeys/{sha256("waitlist\|"…)}` (prefixed, never collides) |

Waitlist positions share the per-offering `waitlistCounters/offeringId-{id}`
sequence with the regular-program waitlist.

## Portal behavior for demo waitlist entries

Portal → Booking dashboard → **Waitlisted** (`/tutor/booking/waitlist`):

- Demo entries show a **$10 Demo** tag, the demo's event title, parent name,
  email, and phone.
- Only **Contact family directly** (label) and **Cancel** are offered.
  "Create 72h Hold" / "Confirm Placement" / "Expire Offer" are hidden for
  demo entries.
- Server-side, `requireRegularWaitlistEntry` in
  `apps/app/netlify/functions/_lib/enrollment-lifecycle.js` refuses offer and
  confirm actions on `waitlistType: 'demo'` entries (error code
  `demo_waitlist_entry`), so the UI hide is backed by enforcement.
- Cancel on a `Waiting` entry only changes its status. It never touches seats.

The regular-program enrollment endpoint (`submit-enrollment-request`) also
rejects any offering with `offeringType: 'demo'`, so a demo can never become
a regular enrollment or regular waitlist target.

## Where things are

### Website (`kriana-tutoring-website/website`)

| File | Role |
|---|---|
| `app/demo/page.tsx` | `/demo` page: the $10 booking state, plus the permanent evergreen page (sold-out recap → real demo video → next-demo waitlist → regular classes → FAQ) used for every other state. Lifecycle-aware metadata, `SoldOut`/`InStock` Event JSON-LD, VideoObject JSON-LD. |
| `app/demo/DemoWaitlistForm.tsx` | Inline next-demo waitlist form + success state. Posts to `submit-demo-waitlist.js` — same endpoint, same `waitlist` doc as the register page's waitlist mode. |
| `app/demo/DemoHighlightVideo.tsx` | Real Sept 2026 footage: poster + tap-to-play, `preload="none"`, `playsInline`, fires `demo_video_played`. |
| `app/demo/DemoRegisterCta.tsx` | CTA link used for both "Reserve…" and "Join the Waitlist" (label + analytics event props). |
| `lib/demo-campaign.server.js` | `resolveDemoCampaignOffering()` → `open` / `full` / `closed` (both with `waitlistOpen`) / `unavailable` / `unconfigured`, plus the `pageState` the page renders (`registration_open` / `sold_out` / `completed` / `waitlist`), overridable with `DEMO_PAGE_STATE`. |
| `lib/demo-event.js` | `describeDemoEvent(offering)` → date, time range, venue, address, area, ISO dates. Makes the page campaign-agnostic. |
| `netlify/functions/submit-demo-registration.js` | `assertLiveDemoOffering`, `demoPublicBookingState`, `validateDemoCatalogueRequest`, booking transaction. |
| `netlify/functions/submit-demo-waitlist.js` | Waitlist endpoint: `validateDemoWaitlistRequest`, `saveDemoWaitlistEntry`. Accepts joins both while a demo is full (`sold_out`) and after its registration window closes (`next_demo`), always gated on `waitlistEnabled`. |
| `netlify/functions/_lib/demo-email.js` | `sendDemoAcknowledgement` (booking) and `sendDemoWaitlistAcknowledgement` (waitlist). |
| `netlify/functions/get-public-catalog.js` | Public offering fields now include `eventTitle`, `eventStartAt`, `eventEndAt`, `publicRegistrationPaused`. |
| `app/booking/[programId]/register/page.tsx` | `DemoRegisterForm` with `mode="waitlist"`, and `DemoFullyBooked` card. |
| `app/booking/waitlist-confirmed/page.tsx` | `?type=demo` wording and Explore Regular Programs link. |
| `components/booking/BookingCatalog.tsx` | `/booking` demo card shows Fully booked / Join Waitlist. |
| `lib/booking.ts` | `isDemoOfferingPubliclyFull()` (presentation mirror of the server rule). |
| `lib/analytics.ts` | Events: `demo_waitlist_click`, `demo_waitlist_started`, `demo_waitlist_submitted`, and for the evergreen page `demo_waitlist_cta_clicked`, `demo_video_played`, `demo_classes_cta_clicked`. |
| `tests/submit-demo-waitlist.test.mjs` (+ additions in `demo-campaign`, `submit-demo-registration`, `submit-enrollment-request` tests) | Coverage for pause, waitlist, inertness, idempotency, regular-flow rejection. |

### Platform (`kriana-tutoring-platform/apps/app`)

| File | Role |
|---|---|
| `src/pages/admin/WaitlistAdmin.jsx` | $10 Demo tag, demo event title, actions limited to Cancel. |
| `netlify/functions/_lib/enrollment-lifecycle.js` | `requireRegularWaitlistEntry` guard in `offerWaitlist` and `confirmWaitlist`. |
| `scripts/set-demo-offering-public-booking.mjs` | Admin SDK script to set `publicRegistrationPaused` / `waitlistEnabled` (dry run by default). |
| `scripts/reconcile-demo-offering-capacity.mjs` (existing) | Recomputes `heldCount`/`confirmedCount` from demo registrations. |
| `tests/enrollment-lifecycle.test.js` | Test for the demo-entry guard. |

## Tests

```bash
# website
cd kriana-tutoring-website/website
node --test tests/*.mjs          # 198 passing on 2026-09-11
npx tsc --noEmit -p .
npx next lint

# platform (the integration test needs the emulator; excluded here)
cd kriana-tutoring-platform/apps/app
node --test $(ls tests/*.test.js | grep -v integration)   # 145 passing
```

Use `node --test tests/*.mjs`, not `node --test tests/`. The directory form
fails in this repo.
