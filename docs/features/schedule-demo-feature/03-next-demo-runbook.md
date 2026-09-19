# Running the Next Demo (Current Tooling)

Last updated: 2026-09-13

This is the process **until** the portal "Demo Campaigns" feature
([04-portal-demo-campaigns-plan.md](./04-portal-demo-campaigns-plan.md)) is
built. The September 2026 program and offering were created by hand, and
there is no creation script yet.

## /demo is permanent now

`/demo` is a year-round landing page, not a per-event page: it keeps the
sold-out recap, the real demo footage and the next-demo waitlist up between
campaigns, and only turns into the $10 booking flyer while a demo is
genuinely on sale. See [The four page states](#the-four-page-states) for how
to move it between states, and
[Replacing the demo video](#replacing-the-demo-video) after a future event.

## Next time you need a demo: checklist

Start about **3 weeks before** the demo date. The detailed steps and field
list are in [Steps](#steps) below.

### First, decide how you'll set it up

- [ ] **Option A, build the portal feature first (recommended if there's
      time).** Ask for the plan in
      [04-portal-demo-campaigns-plan.md](./04-portal-demo-campaigns-plan.md)
      to be built. After that, every demo is: open the portal, enter date +
      capacity, save. Skip to "Before launch" below.
- [ ] **Option B, manual setup with today's tools.** Follow the rest of this
      checklist.

### Setup (manual, Option B)

- [ ] **Pick date, time, venue, capacity, and area name** (the area appears
      as the big heading word, e.g. "Kanata").
- [ ] **Program:** the first time, decide between reusing
      `young-engineers-demo-kanata-sep-2026` or adding a generic
      `young-engineers-demo` (one-line code change + deploy). See
      [step 1](#1-choose-the-program-one-time-decision).
- [ ] **Create the offering** in Firebase (copy the last demo's document and
      edit it). Set `confirmedCount: 0`, `heldCount: 0`,
      **`waitlistEnabled: true`**, and don't copy `publicRegistrationPaused`.
      See [step 2](#2-create-the-offering).
- [ ] **Unpublish the previous demo offering** (`isPublished: false` in the
      Firebase console) if it uses the same program. Otherwise the `/booking`
      "Try for $10" card can still link to the old demo. `/demo` itself
      follows the env vars and isn't affected.
- [ ] **Netlify (website):** set `DEMO_CAMPAIGN_PROGRAM_ID` /
      `DEMO_CAMPAIGN_OFFERING_ID`, then **redeploy**.
- [ ] **Campaign content (only if changed):** video, poster, share image,
      "$10", "ages 6–12", bullets in `app/demo/page.tsx` and
      `public/videos/demo/`, `public/images/demo/`. Deploy.

### Before launch

- [ ] Open `/demo` and check the date, time, venue, heading, and share
      preview.
- [ ] Click "Reserve My Child's Spot — $10" and confirm the register form
      shows the event date.
- [ ] Optional test booking with your own details, then cancel it in the
      portal (Booking → Demo Registrations → Cancel). Cancelling releases
      the seat and the child's one-time eligibility.
- [ ] Invite the previous demo's waitlist families (Portal → Waitlisted,
      tagged **$10 Demo**), then Cancel their old entries.
- [ ] Share the `/demo` link (flyers/QR can add `?ref=flyer` or `utm_*`
      params for tracking).

### While bookings come in

- [ ] Confirm e-transfers as they arrive: Portal → Booking → Demo
      Registrations → **Confirm E-Transfer Received**. Unpaid bookings free
      their seat after 48 hours.
- [ ] **When it fills up, do nothing.** The page switches to fully booked +
      Join the Waitlist on its own.
- [ ] **To close early** while seats remain:
      `set-demo-offering-public-booking.mjs --offering <id> --public-booking paused --apply`
      (dry run first). See
      [02-operations-runbook.md](./02-operations-runbook.md#everyday-switch-changes).
- [ ] Check the waitlist and contact families if a spot opens.

### Day before

- [ ] Run `reconcile-demo-offering-capacity.mjs` (dry run) and fix any stale
      seat counts.
- [ ] Review the registration list and payment status in the portal.

### Demo day and after

- [ ] Registration closes automatically at `enrollmentCloseAt` (usually the
      event start). `/demo` then flips to the evergreen page: sold-out recap,
      demo video, and the waitlist for the NEXT demo. Keep the offering
      published with `waitlistEnabled: true` and `DEMO_CAMPAIGN_*` pointed at
      it — that's what keeps the waitlist working between campaigns.
- [ ] Mark each child **Attended** or **No-Show** in Portal → Demo
      Registrations. Attended activates the $10 credit; no-show voids it.
- [ ] Keep the waitlist entries. They're your invite list for the next demo.

## The four page states

`/demo` derives its state from the offering. `DEMO_PAGE_STATE` (Netlify env
var on the website site, then redeploy) can pin one instead; `auto` or unset
means "derive it".

| State | Page shows | Happens automatically when | Pin it with |
|---|---|---|---|
| `registration_open` | $10 booking flyer, video ad, Reserve CTA | offering is published, in its registration window, and has seats | `DEMO_PAGE_STATE=registration_open` |
| `sold_out` | "…Demo Is Sold Out" + event details + waitlist form | seats run out, `status: 'Full'`, or `publicRegistrationPaused: true` | `DEMO_PAGE_STATE=sold_out` |
| `completed` | Sold-out recap, real demo video, next-demo waitlist | `enrollmentCloseAt` has passed | `DEMO_PAGE_STATE=completed` |
| `waitlist` | Same evergreen page; waitlist form only if an offering is configured | no live offering at all (env unset, unpublished, deleted) | `DEMO_PAGE_STATE=waitlist` |

Two rules the override cannot break:

- **It never unlocks booking.** Pinning `registration_open` on an offering
  that isn't bookable silently falls back to the derived state, so the page
  can never show a $10 CTA the endpoint would reject.
- **It never opens the waitlist.** The form appears only when the configured
  offering has `waitlistEnabled: true` — the same switch
  `submit-demo-waitlist.js` enforces, flipped with
  `set-demo-offering-public-booking.mjs --waitlist on`.

Where the entries go is unchanged: one `waitlist` doc per family, tagged
`waitlistType: 'demo'`, visible in the portal's Waitlist tab ($10 Demo tag),
plus a parent acknowledgement and an admin email. Entries joined after the
window closed carry `demoWaitlistKind: 'next_demo'` and the optional
`programInterest` answer from the /demo form.

## Replacing the demo video

After a future demo, swap the two files and nothing else:

1. Encode the reel for the web (the Sept 2026 one went 20 MB → 4.5 MB):
   ```bash
   ffmpeg -i reel.mp4 -vf scale=720:1280 -c:v libx264 -preset slow -crf 26 \
     -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 96k \
     website/public/videos/demo/young-engineers-demo-sept-2026-highlight.mp4
   ```
2. Grab a poster frame from it:
   ```bash
   ffmpeg -ss 1.5 -i <the mp4> -frames:v 1 -vf scale=540:960 \
     website/public/images/demo/demo-sept-2026-highlight-poster.jpg
   ```
3. If you rename the files, update `HIGHLIGHT_VIDEO_PATH` /
   `HIGHLIGHT_POSTER_PATH` in `app/demo/page.tsx` (they also feed the
   VideoObject schema) and the `src`/`poster` in
   `app/demo/DemoHighlightVideo.tsx`.

The page loads the video with `preload="none"` behind the poster, so file
size costs nothing until a parent taps play — but keep it under ~6 MB.

## How much code is reused

Almost all of it. A new demo is a data and configuration change, not a code
change.

| Part | Size | Changes for a new demo? |
|---|---|---|
| Booking + waitlist endpoints, emails, confirmation pages, register form, capacity rules, portal Waitlist tab | ~2,000 lines | None. All driven by the offering document. |
| `/demo` layout, evergreen + sold-out + booking states, date/time/venue/title, metadata, JSON-LD | `app/demo/page.tsx` + `lib/demo-event.js` | None. Read from the offering. |
| Next-demo waitlist form and success state | `app/demo/DemoWaitlistForm.tsx` | None. Posts to the same endpoint as the register page's waitlist mode. |
| Campaign content in `app/demo/page.tsx`: ad video `/videos/demo/young-engineers-demo-ad-v3.mp4`, poster `/images/demo/demo-video-poster.jpg`, share image `/images/demo/demo-share.png`, "$10", "ages 6–12", "Young Engineers" heading, bullet list, "Good to know" list | ~18 lines | Only if the new demo differs |
| Evergreen recap copy in `app/demo/page.tsx` (the "September 12" sentences, experience grid, FAQs) + the highlight video/poster | ~20 lines + 2 files | After each demo, to point at the newest event |
| `lib/demo-eligibility.js` allowlist | 1 line | Only if a new program ID is used |

Estimated reuse: **98–100%**.

## Steps

### 1. Choose the program (one-time decision)

The website only accepts program IDs in `DEMO_ELIGIBLE_PROGRAM_IDS`
(`website/lib/demo-eligibility.js`).

- **Reuse** `young-engineers-demo-kanata-sep-2026`: no code change, but the
  ID appears in the register URL families see.
- **Recommended:** add a generic program once (e.g. `young-engineers-demo`)
  to the allowlist, deploy, and create its program document:

  ```text
  programs/young-engineers-demo
    title: "Young Engineers Demo Class"
    category: "Demo Class"
    isActive: true
    publicCatalogVersion: 1
    demoEligible: true
    ageRange: "6-12"
    bookingModel: "programOfferings"
    offeringModelVersion: 1
  ```

  Every later demo reuses it.

### 2. Create the offering

Create `programOfferings/<new-id>` (e.g.
`young-engineers-demo-barrhaven-oct-2026-offering`) in the Firebase console
or with an Admin SDK script. Copying the September document and editing it is
simplest.

| Field | Value | Drives |
|---|---|---|
| `programId` | program from step 1 | |
| `offeringType` | `"demo"` | required |
| `status` | `"Open"` | required |
| `isPublished` | `true` | required |
| `publicCatalogVersion` | `1` | required |
| `capacity` | e.g. `20` | seats |
| `confirmedCount`, `heldCount` | `0`, `0` | must start at 0 |
| `eventTitle` | `"Young Engineers Demo Class — Barrhaven"` | badge, share title, page title; text after "—" is the big heading word |
| `eventStartAt`, `eventEndAt` | Firestore timestamps | date/time on page, emails, JSON-LD |
| `timezone` | `"America/Toronto"` | formatting |
| `location` | `"Venue Name, 123 Street, Ottawa, ON K2X 1A1"` | text before the first comma is shown as the venue |
| `enrollmentOpenAt` | timestamp (usually now) | booking window start |
| `enrollmentCloseAt` | timestamp (usually = `eventStartAt`) | booking window end |
| `waitlistEnabled` | `true` (**recommended**) | automatic waitlist when full |
| `publicRegistrationPaused` | leave unset | set later only to close early |
| `createdAt`, `updatedAt` | timestamps | |

### 3. Point the website at it

In Netlify (website site) set:

```env
DEMO_CAMPAIGN_PROGRAM_ID=<program-id>
DEMO_CAMPAIGN_OFFERING_ID=<new-offering-id>
```

Then **trigger a redeploy**. Env var changes only take effect on the next
deploy.

### 4. (Optional) Update campaign content

If the video, images, price, ages, or bullets differ, edit the lines listed
in the reuse table in `app/demo/page.tsx` and the files in
`website/public/videos/demo/` and `website/public/images/demo/`.

### 5. Verify

- `/demo` shows the new date, time, venue, and heading.
- "Reserve My Child's Spot — $10" opens the register form with the event
  date shown.
- A test booking and cancel (or use the local preview in
  [02-operations-runbook.md](./02-operations-runbook.md#local-preview-no-production-access)).

### 6. During the campaign

- **When it fills up:** nothing to do. With `waitlistEnabled: true` the page
  switches to fully booked + Join the Waitlist automatically.
- **To close early:** `set-demo-offering-public-booking.mjs --public-booking paused`.
- **Before the event:** run `reconcile-demo-offering-capacity.mjs` (dry run) so
  stale seat counts don't close the demo early.

## Things to know

- **One $10 demo per child, ever.** A child who attended or no-showed an
  earlier demo is blocked by `demoEligibilityLocks`. Cancelled registrations
  release the lock. This is existing policy.
- **Unpaid bookings hold a seat** for up to 48 hours (released by the hourly
  `expire-demo-payment-holds` job). A released seat reopens public booking
  automatically unless the demo is paused.
- **Waitlisted families are not notified automatically** when a seat opens.
  Staff contact them from the portal.
- **Previous demo's waitlist** stays in the portal, tagged with its event
  title. It's a good invite list for the new demo.

## Planned helpers (not built)

- `create-demo-offering.mjs`: clone the last demo offering with new date,
  venue, and capacity, and `waitlistEnabled: true` by default.
- The portal feature in
  [04-portal-demo-campaigns-plan.md](./04-portal-demo-campaigns-plan.md),
  which removes steps 2–3 entirely.
