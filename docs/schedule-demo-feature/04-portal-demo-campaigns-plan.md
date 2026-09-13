# Plan: Portal "Demo Campaigns" Feature

Last updated: 2026-09-11
Status: **Proposed, not started.** Build after the September 12 fix is
deployed, as a separate change.

## Goal

An admin opens the portal, enters a **date, start/end time, and capacity**
for the next demo, and saves. The public `/demo` page then shows that demo,
with no code change, Netlify env edit, or redeploy. When capacity is reached
the page automatically becomes "fully booked + Join the Waitlist". Pausing
and the waitlist switch are buttons in the portal instead of a script.

## Why it isn't possible today

1. **The portal can't write demo offerings.** `firestore.rules`
   (`hasOnlyPublicOfferingFields`) doesn't allow `eventTitle`,
   `eventStartAt`, `eventEndAt`, `publicRegistrationPaused`, and the portal
   writes offerings with the client SDK.
2. **The live demo is selected by Netlify env vars**
   (`DEMO_CAMPAIGN_PROGRAM_ID` / `DEMO_CAMPAIGN_OFFERING_ID`). Changing them
   needs Netlify access and a redeploy.
3. **The program ID must be in the code allowlist**
   (`DEMO_ELIGIBLE_PROGRAM_IDS`).

The automatic waitlist when full already works (see
[01-how-it-works.md](./01-how-it-works.md#demo-states)).

## Design

### Portal page: Booking → Demo Campaigns (admin only)

**Create next demo form**

| Input | Default |
|---|---|
| Date | (required) |
| Start / end time | last demo's times |
| Capacity | last demo's capacity |
| Venue + address | last demo's `location` |
| Area name (heading word, e.g. "Kanata") | last demo's area |
| Registration opens | now |
| Registration closes | event start |
| Waitlist when full | **on** |
| Make this the live `/demo` | **on** |

Saving creates the offering (all required demo fields set, counts at 0) and,
if selected, makes it the live campaign.

**Demo list**

Each demo shows:

- event title, date;
- seats `confirmed + held / capacity`;
- state: Open / Full → Waitlist / Paused / Closed / Not live;
- waitlist count;
- **Live** badge on the current `/demo` campaign.

Actions:

- Pause public booking / Reopen;
- Waitlist on / off;
- Make live on `/demo`;
- Edit date, time, venue, capacity (capacity can't go below `confirmed + held`);
- Open on website.

### Platform: admin-only server endpoint

`apps/app/netlify/functions/manage-demo-campaign.js` (Admin SDK,
`requireAdmin`), with actions:

- `create`: validate inputs, create `programOfferings/{id}` with
  `offeringType: 'demo'`, `status: 'Open'`, `isPublished: true`,
  `publicCatalogVersion: 1`, `confirmedCount: 0`, `heldCount: 0`, event
  fields, window, `waitlistEnabled`.
- `update`: date/time/venue/capacity/window; never writes counts;
  rejects `capacity < confirmedCount + heldCount`.
- `set_switches`: `publicRegistrationPaused`, `waitlistEnabled`.
- `set_live`: write the live-campaign pointer (below) and unpublish the
  previous live demo offering, so the `/booking` "Try for $10" card (which
  links to the first published demo offering per program) can't point at an
  old demo.

Using a server endpoint (rather than loosening `firestore.rules`) keeps demo
offerings unwritable from the client and puts validation in one place.
Existing registrations are never touched. Events snapshot their details at
booking time.

### Firestore: live-campaign pointer

```text
siteSettings/demoCampaign
  programId: "young-engineers-demo"
  offeringId: "<offering-id>"
  updatedAt, updatedByUid
```

- Written only by `manage-demo-campaign` (Admin SDK).
- `firestore.rules`: `match /siteSettings/{id} { allow read, write: if false; }`.

### Website: read the pointer

`lib/demo-campaign.server.js` → `getDemoCampaignConfig()` reads
`siteSettings/demoCampaign` first and falls back to the existing Netlify env
vars, so nothing breaks if the document is missing. `/demo` is already
rendered per request, so switching is immediate.

### One-time setup

- Add a generic program ID (proposed `young-engineers-demo`) to
  `DEMO_ELIGIBLE_PROGRAM_IDS` and create its program document (see
  [03-next-demo-runbook.md](./03-next-demo-runbook.md#1-choose-the-program-one-time-decision)).
  All portal-created demos use it.
- Replace the script-based switches in the runbook with the portal buttons
  (keep the script as a fallback).

## Out of scope

- Uploading the video, poster, share image, and bullet text through the
  portal (would need media upload/storage). These stay in code/`public/`.
- Automatically notifying waitlisted families when a seat opens.
- Converting a waitlist entry directly into a booking.

## Open decision

- Confirm the generic program ID `young-engineers-demo`. It appears in
  the register link families see.

## Test plan (when built)

- Endpoint: admin-only (tutor rejected), validation (dates, capacity ≥
  occupied), create writes exact demo shape with zero counts, update never
  writes counts, `set_live` writes pointer.
- Website: pointer takes precedence over env vars; missing pointer falls back;
  pointer to an invalid offering → `unavailable`.
- Portal: form defaults from last demo; state badges for each state; buttons
  call the endpoint; list reflects capacity-driven Full → Waitlist.
- End-to-end on emulators (see local preview in
  [02-operations-runbook.md](./02-operations-runbook.md#local-preview-no-production-access)):
  create → live on `/demo` → fill to capacity → waitlist form appears → pause
  / reopen.
