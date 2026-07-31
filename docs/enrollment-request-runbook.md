# Enrollment Request Operations Runbook

Last updated: 2026-07-31

This runbook covers the temporary request-only enrollment workflow shared by:

- public website: `kriana-tutoring-website`;
- staff portal and Firestore configuration: `kriana-tutoring-platform`.

The business model and future cohort design are documented in
[robotics-enrollment-strategy.md](./robotics-enrollment-strategy.md). The
platform's `docs/features/booking system/request-only-security-runbook.md` is
the detailed security source of truth. Update both runbooks when either
repository's contract changes.

## Mode, placement, and payment contract

Both deployments must use `request_only`:

```env
VITE_BOOKING_MODE=request_only
BOOKING_FLOW_MODE=request_only
ENABLE_AUTOMATED_STRIPE_PAYMENTS=false
```

Every legacy booking flag must remain false or unset. The current registration
lifecycle is:

```text
Pending Review -> Offered / Waitlisted / Declined / Cancelled
Waitlisted -> Offered / Cancelled
Offered -> Confirmed / Expired / Cancelled
Confirmed -> Cancelled
```

The linked waitlist lifecycle is:

```text
Waiting -> Offered -> Converted / Expired / Cancelled
Waiting -> Cancelled
```

A seat offer holds capacity for 72 hours. `Confirmed` means
**staff-confirmed placement on the roster**; it does not mean paid.

Payment is an independent state fixed at `Not Requested` in this release. A
public request never creates a paid, pending-payment, or confirmed record, and
the staff lifecycle never requests, records, verifies, or infers payment. Any
offline payment handling is outside this software release and must not be
represented as `Paid`.

Legacy records may still contain `Started`, `Pending Payment`, Stripe, or
e-transfer fields. Preserve and reconcile them; do not reinterpret them as new
requests.

## Server contracts

### Public request submission

The public website accepts requests only through
`/.netlify/functions/submit-enrollment-request`. Configure the public Firebase
variables in `website/.env.example`, Firebase Admin credentials, SMTP and
`ADMIN_EMAIL` if acknowledgement email is required, and an
`ENROLLMENT_RATE_LIMIT_SALT` containing at least 32 random characters.

Missing Admin credentials fail closed without storing a request. SMTP failure
after a successful write is logged and does not delete the stored request.
Every request must contain one `programId`, exactly one of `offeringId` or
legacy `sessionId`, and an 8–100 character `clientRequestId` made only of
letters, digits, `_`, or `-`. The request ID backs seven-day server-side
idempotency.

Rate limiting trusts only Netlify's `x-nf-client-connection-ip` header. A
missing trusted header or a missing/weak salt is a configuration error. Do not
introduce a forwarded-header, public project-ID, or hard-coded salt fallback.

### Staff lifecycle

Staff changes state only through the portal's authenticated
`/.netlify/functions/manage-enrollment-request` endpoint. It requires a valid
Firebase ID token whose `users/{uid}.role` is `admin` or `tutor`. Supported
actions are:

- registrations: `offer_registration`, `waitlist_registration`,
  `decline_registration`, `confirm_registration`, `expire_registration`, and
  `cancel_registration`;
- waitlist: `offer_waitlist`, `confirm_waitlist`, `expire_waitlist`, and
  `cancel_waitlist`.

The UI label for both confirmation actions is **Confirm Placement**. Each action
runs in an Admin SDK transaction and changes offering hold/confirmed counters
with the linked registration/waitlist record. It does not change payment state.
Direct browser writes to lifecycle fields or offering counters are denied.

`expire-enrollment-offers` runs hourly at `0 * * * *`. It finds up to 200 due
`Offered` registrations and 200 due `Offered` waitlist entries per invocation,
then releases their holds transactionally. This request-only expiry job is
separate from the parked legacy e-transfer expiry function and never changes
payment state.

## Public catalogue contract

Browsers do not read Firestore catalogue documents directly. They call
`/.netlify/functions/get-public-catalog`, which uses Firebase Admin internally
and returns an explicit allowlisted projection. Unknown fields—including
internal notes, child/tutor fields, and payment configuration—are never copied
into its response.

The server selects eligible records using positive trust markers:

- `programs`: `isActive == true` and `publicCatalogVersion == 1`;
- `programOfferings`: `programId == <id>`, `publicCatalogVersion == 1`,
  `isPublished == true`, and `status in ['Open', 'Full']`;
- temporary legacy `sessions`: `programId == <id>`,
  `legacyPublicBookingVersion == 1`, and
  `status in ['Active', 'Sold Out']`.

Firestore rules keep `programs`, `programOfferings`, and legacy booking
`sessions` staff-only; marker queries from anonymous clients are denied. The
referenced program must be active and marked. The legacy session marker is
manual-only after audit; never bulk-mark
the overloaded `sessions` collection because it also contains private tutoring
and progress data. Once a program has `bookingModel: 'programOfferings'`, an
empty offering result means no published cohort and the website must not fall
back to legacy sessions.

## Safe local end-to-end testing

Use only the synthetic project ID `demo-kriana-security`. Firebase treats a
`demo-*` project as emulator-only, and calls to services that were not started
fail instead of reaching a live Firebase project. Do not use production service
account credentials or Stripe keys for this test.

1. In `kriana-tutoring-platform/apps/app`, start the shared emulators:

   ```bash
   firebase emulators:start --only auth,firestore,storage --project demo-kriana-security
   ```

   The Emulator Suite UI is at `http://127.0.0.1:4000`.

2. In another terminal in the same directory, seed a local staff account:

   ```bash
   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
   FIREBASE_PROJECT_ID=demo-kriana-security \
   npm run seed:local-staff
   ```

   The local-only login is `admin@local.test` / `LocalTest123!`. The seed script
   refuses to run unless both emulators are configured and the project ID starts
   with `demo-`.

3. Create `kriana-tutoring-platform/apps/app/.env.local` from `.env.example`.
   Use harmless demo Firebase web values, set
   `VITE_FIREBASE_PROJECT_ID=demo-kriana-security`,
   `VITE_USE_FIREBASE_EMULATORS=true`, and keep both booking modes at
   `request_only`. Start the portal through Netlify so its function routes work:

   ```bash
   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
   FIREBASE_PROJECT_ID=demo-kriana-security \
   netlify dev --port 8889
   ```

4. Create `kriana-tutoring-website/website/.env.local` from `.env.example`.
   Use the same demo project ID, set
   `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`, keep both booking modes at
   `request_only`, and set a disposable local
   `ENROLLMENT_RATE_LIMIT_SALT` containing at least 32 characters. Start the
   public site through Netlify from the `website` directory:

   ```bash
   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
   FIREBASE_PROJECT_ID=demo-kriana-security \
   netlify dev --port 8888
   ```

5. Log into `http://localhost:8889`, create an active program and a published
   offering with a real capacity and open enrollment window, then verify the
   following at `http://localhost:8888`:

   - the sanitized program and offering appear publicly;
   - a parent request creates `Pending Review` / `Not Requested` records;
   - no Stripe, card, or e-transfer control appears;
   - staff can offer, waitlist, decline, confirm placement, expire, and cancel;
   - offering hold and confirmed counters remain consistent;
   - private family and enrollment documents are not anonymously readable.

Use `netlify dev`, not the framework's plain development command, for this
end-to-end pass because both applications depend on Netlify Function routes.
Stop all three processes when finished; emulator data is disposable unless an
explicit import/export directory is configured.

## Coordinated two-repository deployment

Treat `kriana-tutoring-platform` and `kriana-tutoring-website` as one release.
Keep both booking modes at `request_only`, every legacy flag false, and Stripe
links deactivated throughout. Announce a short booking/admin maintenance
window.

Values in `[build.environment]` are build-time values, not proof of a Netlify
Functions runtime setting. In each Netlify site's environment-variable UI/CLI,
inspect the Functions runtime context, explicitly set request-only values, and
clear stale legacy flags. Legacy endpoints are also retired with source-level
guards, so an environment-variable change alone cannot restore them.

1. Back up Firestore. In the platform repository root, audit booking-shaped
   sessions, reconcile hybrid/orphan rows, and manually mark only reviewed rows
   reported as `eligibleForLegacyPublicMarker`:

   ```bash
   node apps/app/scripts/audit-legacy-booking-sessions.mjs
   ```

2. Verify the rules currently deployed to production. If they permit anonymous
   access to registrations, waitlists, or private tutoring sessions, deploy an
   emergency privacy rule immediately—even if that temporarily disables the
   old booking UI. Privacy takes precedence over availability.
3. Deploy all indexes declared in `firestore.indexes.json` and wait until each
   reports ready.
4. Build and deploy `kriana-tutoring-platform/apps/app`. Include the
   request-only UI, marker-writing editors,
   `manage-enrollment-request`, the hourly `expire-enrollment-offers` schedule,
   and Firebase Admin credentials. Keep the legacy hold-expiry schedule absent.
5. Create and verify each real marked `programOfferings` document in the portal.
   Confirm dates, timezone, tuition, publication, capacity, zero initial counts,
   and its program relationship. Set `bookingModel: 'programOfferings'` only
   after the program has valid offerings.
6. With Admin credentials available locally, dry-run the program payment-config
   cleanup. Resolve every destination conflict before apply mode:

   ```bash
   node apps/app/scripts/migrate-program-payment-config.mjs
   ```

7. Deactivate/archive matching links in Stripe, apply the migration, and rerun
   the dry run immediately. Require zero conflicts, zero legacy Stripe fields on
   programs, and zero programs missing `publicCatalogVersion: 1`:

   ```bash
   node apps/app/scripts/migrate-program-payment-config.mjs --apply
   node apps/app/scripts/migrate-program-payment-config.mjs
   ```

8. Build and deploy `kriana-tutoring-website/website` with the Admin submission
   endpoint, sanitized catalogue endpoint, Admin credentials, and the
   strong rate-limit salt. Verify payment, e-transfer, success, cancellation,
   and email-only booking lookup routes remain disabled.
9. From `kriana-tutoring-platform/apps/app`, rerun the rule suite:

   ```bash
   firebase emulators:exec --only firestore --project demo-kriana-security "node scripts/smoke-firestore-rules.mjs"
   ```

10. Deploy the final restrictive rules:

   ```bash
   firebase deploy --only firestore:rules
   ```

11. Submit a production test request. Verify `Pending Review` plus
   `Not Requested`, run each staff lifecycle branch with test data, verify hold
   and confirmed counters, and confirm anonymous family/private reads fail.
12. End maintenance only after both sites pass. Remove the legacy-session
    fallback later, after every program is migrated and all deployed clients no
    longer depend on it.

When currently deployed rules expose private data, do not delay an emergency
lockdown to preserve the old application. For an ordinary coordinated release,
keep maintenance enabled until the Admin-backed applications and final rules
are all verified. Never move, rename, or delete
tutoring lesson/progress documents merely because they share `sessions`.

## Daily staff workflow

For every `Pending Review` request:

1. Check the child's program/age fit and offering capacity.
2. Contact the family if information is incomplete.
3. Offer a seat, waitlist, decline, or cancel the request.
4. Use **Confirm Placement** while the 72-hour offer is active; this converts
   the hold into confirmed roster capacity in one transaction.
5. Treat the resulting `Confirmed` state only as placement. Leave payment at
   `Not Requested`.

Do not include medical notes in routine emails. Staff should view them only in
the authenticated portal. There is no payment-recording action in this release;
offline payment operations are outside the application.

## Waitlist workflow

- A waitlist entry belongs to one offering, not just a general program.
- Positions are allocated server-side.
- Staff must offer the lowest-position waiting family first.
- A seat offer holds capacity for 72 hours.
- The hourly expiry job releases due holds before the next family is offered a
  place.

Automated legacy waitlist-offer email is parked in request-only mode; do not
call it manually.

## TTL policies

In Firebase Console, configure Firestore TTL on both collection groups:

- `submissionRateLimits.expiresAt`: endpoint expiry 24 hours;
- `enrollmentRequestKeys.expiresAt`: endpoint expiry 7 days.

TTL deletion is asynchronous. Endpoint logic must continue comparing and
resetting the current rate-limit window and checking the idempotency expiry; it
must not assume an expired document has already been deleted.

## Rollback without reopening payment or private data

1. Keep `request_only`, all legacy flags false, and Stripe links deactivated.
2. If public submission fails, replace request buttons temporarily with the
   contact form/email and inspect Netlify logs, Admin credentials, the trusted IP
   header, and salt configuration.
3. If the staff lifecycle endpoint fails, disable its UI actions and pause
   transitions. Do not compensate with direct client writes to statuses or
   counters.
4. If expiry fails, disable the schedule while correcting it and manually
   reconcile affected holds through the authenticated endpoint.
5. If the catalogue endpoint fails, verify its Admin credentials, logs,
   markers, parent-program relationships, and indexes. Do not broaden public
   Firestore access to catalogue/private collections or the whole
   `sessions` collection.
6. Roll back to the preceding request-only application build if needed while
   preserving all newly written records. Never use the old payment build as a
   rollback.

## Required operational follow-ups

- Reconcile and deactivate historical Stripe Payment Links.
- Rotate any SMTP or API credentials that appeared in Git history or local
  documentation.
- Define retention/deletion periods for child, medical, and emergency-contact
  data.
- Add verified email or signed magic links before restoring parent self-service
  lookup.
- Add monitoring and end-to-end tests before introducing any future payment
  provider.
