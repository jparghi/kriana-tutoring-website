# Demo Operations Runbook

Last updated: 2026-09-11

Every command below that writes to production is an **Admin SDK write to
live Firestore**. Always run it without `--apply` first, read the dry-run
output, then re-run with `--apply`.

Commands run from the platform repo root (`kriana-tutoring-platform`) and
need Firebase Admin credentials in the environment
(`FIREBASE_SERVICE_ACCOUNT_JSON`, or `FIREBASE_PROJECT_ID` +
`FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`, or
`GOOGLE_APPLICATION_CREDENTIALS`). One option is to load the website's
`.env.local`:

```bash
node --env-file="../kriana-tutoring-website-ws/kriana-tutoring-website/website/.env.local" \
  apps/app/scripts/<script>.mjs ...
```

## Go-live for the September 12 demo

**Status: completed 2026-09-11.** Website commit `98a6455` and platform
commit `4d063e7` were deployed, and the owner applied the switches. Verified
afterward:

- live `/demo` shows the fully booked page with Join the Waitlist;
- the public catalog returns `publicRegistrationPaused: true`,
  `waitlistEnabled: true`;
- offering unchanged otherwise (`status=Open capacity=20 confirmed=13 held=1`).

Keep this section as the template for closing any future demo early.

### Order matters

1. **Deploy the website** (`kriana-tutoring-website`). Before this, the live
   code ignores `publicRegistrationPaused`.
2. **Deploy the platform** (`kriana-tutoring-platform`). Before this, the
   portal Waitlist tab would offer "Create 72h Hold" on demo entries.
3. **Set the switches** on the live offering (below).
4. **Verify** on production (below).

**Do not** turn `waitlistEnabled` on before the website deploy. The
pre-deploy regular enrollment endpoint does not reject demo offerings, so a
hand-crafted request could join the regular-program waitlist.

### Set the switches (copy-paste)

Dry run first. It changes nothing:

```bash
cd "/Users/jigish/IdeaProjects/Kriana Tutoring/kriana-tutoring-platform"

node --env-file="../kriana-tutoring-website-ws/kriana-tutoring-website/website/.env.local" \
  apps/app/scripts/set-demo-offering-public-booking.mjs \
  --offering young-engineers-demo-kanata-sep-2026-offering \
  --public-booking paused --waitlist on
```

Expected output (before applying):

```text
Offering young-engineers-demo-kanata-sep-2026-offering (Young Engineers Demo Class — Kanata)
  status=Open capacity=20 confirmed=13 held=1 (unchanged)
  publicRegistrationPaused: undefined -> true
  waitlistEnabled: undefined -> true

Dry run only. Re-run with --apply to write these fields.
```

After it has been applied, the same dry run prints `true -> true` for both
fields. That's how to confirm the switches are already set.

If it matches, apply:

```bash
node --env-file="../kriana-tutoring-website-ws/kriana-tutoring-website/website/.env.local" \
  apps/app/scripts/set-demo-offering-public-booking.mjs \
  --offering young-engineers-demo-kanata-sep-2026-offering \
  --public-booking paused --waitlist on --apply
```

Only `publicRegistrationPaused`, `waitlistEnabled`, and `updatedAt` are
written. Registrations and seat counts are never touched.

### Verify on production

- Refresh `https://krianatutoring.com/demo`. It should show "Our September 12
  demo is fully booked!", Join the Waitlist, Explore Regular Programs, Call,
  Text, and no "Reserve" wording. This is immediate.
- The Join the Waitlist link opens the waitlist form (no $10 / e-transfer
  text).
- The `/booking` "Try for $10" card shows **Fully booked** / **Join Waitlist**
  within about a minute (the public catalog is cached for 60 seconds).
- Optional: submit one waitlist entry with your own details, confirm it
  appears in the portal Waitlist tab, then Cancel it.

### Undo (reopen public booking)

```bash
node --env-file="../kriana-tutoring-website-ws/kriana-tutoring-website/website/.env.local" \
  apps/app/scripts/set-demo-offering-public-booking.mjs \
  --offering young-engineers-demo-kanata-sep-2026-offering \
  --public-booking open --waitlist off          # dry run; add --apply to write
```

### Troubleshooting: "Why is /demo still open?"

On 2026-09-11 the website had been deployed but `/demo` still showed
"Reserve My Child's Spot". The cause was that step 3 hadn't been run yet. Check
in this order:

1. **Is the new website code live?** The `/demo` page title should be
   `$10 Young Engineers Demo Class — Kanata | Kriana Tutoring` (the brand
   appears once). The old code showed `… in Kanata | Kriana Tutoring · Kriana Tutoring`.
2. **Are the switches set?** Run the dry run above. `undefined -> true`
   means not set yet; `true -> true` means set.
3. **Is it simply open by capacity?** Without the pause switch, a demo with
   seats left (e.g. 14 of 20) is correctly bookable.
4. **Did registration close?** After `enrollmentCloseAt` the page shows
   "Registration has closed" instead of fully booked. That's expected.

Registration closes automatically at the event start (Sept 12, 10:30 AM
Toronto). After that `/demo` shows "Registration has closed" and the waitlist
closes.

## Everyday switch changes

```bash
S=apps/app/scripts/set-demo-offering-public-booking.mjs
O=<offering-id>

node $S --offering $O --public-booking paused          # close public booking early
node $S --offering $O --public-booking open            # follow capacity again
node $S --offering $O --waitlist on                    # show waitlist when full/paused
node $S --offering $O --waitlist off                   # hide waitlist (fully booked card only)
node $S --offering $O --public-booking paused --waitlist on   # both at once
# add --apply to each after reviewing the dry run
```

The script:

- refuses non-demo offerings;
- writes only `publicRegistrationPaused`, `waitlistEnabled`, `updatedAt`;
- never changes capacity, counts, status, or registrations.

`/demo` reflects changes immediately (it is rendered per request). The
register page and `/booking` card read the public catalog, which is cached
for up to 60 seconds.

## Fix stale seat counts

If the seat counts don't match the actual registrations (for example, the
phantom held seat found on 2026-09-11), the demo can look full early:

```bash
node apps/app/scripts/reconcile-demo-offering-capacity.mjs          # dry run
node apps/app/scripts/reconcile-demo-offering-capacity.mjs --apply  # write corrected counts
```

## Working the waitlist

Portal → Booking dashboard → **Waitlisted** card, or
`/tutor/booking/waitlist`.

- Demo entries are tagged **$10 Demo**; contact the family by email/phone.
- If you give a family a spot, they register normally (reopen public booking
  briefly, or handle it outside the system per the owner's decision). There
  is intentionally no "convert waitlist entry to booking" action.
- Use **Cancel** to remove an entry once handled.
- Entries keep an `eventSnapshot`, so they remain identifiable after a new
  demo replaces the offering. Use them to invite families to the next demo.

## Local preview (no production access)

Runs the website and portal against local emulators; emails are disabled.

```bash
# 1. Emulators (portal-standard ports: Firestore 8080, Auth 9099)
cd kriana-tutoring-platform/apps/app
firebase emulators:start --only firestore,auth --project demo-kriana-security

# 2. Local admin login: admin@local.test / LocalTest123!
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
  FIREBASE_PROJECT_ID=demo-kriana-security npm run seed:local-staff

# 3. Seed a demo program + offering into the emulator
#    (Admin SDK against FIRESTORE_EMULATOR_HOST; copy the production field
#    shape from 01-how-it-works.md / 03-next-demo-runbook.md and set
#    publicRegistrationPaused / waitlistEnabled as needed)

# 4. Website with functions, offline (no Netlify env pulled), on :3717
cd kriana-tutoring-website/website
env FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_PROJECT_ID=demo-kriana-security \
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-kriana-security \
  DEMO_CAMPAIGN_PROGRAM_ID=young-engineers-demo-kanata-sep-2026 \
  DEMO_CAMPAIGN_OFFERING_ID=young-engineers-demo-kanata-sep-2026-offering \
  NEXT_PUBLIC_ENABLE_DEMO_PAYMENTS=true ENABLE_DEMO_PAYMENTS=true \
  DEMO_ELIGIBILITY_KEY_SALT=local-preview-salt-0123456789abcdefghijkl \
  ENROLLMENT_RATE_LIMIT_SALT=local-preview-rate-limit-salt-0123456789ab \
  SMTP_USER= SMTP_PASS= STRIPE_SECRET_KEY= \
  netlify dev --offline --port 3717 --target-port 3719 --command "npx next dev -p 3719"

# 5. Portal against the same emulators, on :8899
cd kriana-tutoring-platform
env VITE_USE_FIREBASE_EMULATORS=true VITE_FIREBASE_PROJECT_ID=demo-kriana-security \
  FIREBASE_PROJECT_ID=demo-kriana-security FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
  FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 SMTP_USER= SMTP_PASS= \
  npx netlify dev --offline --target-port 5183 --port 8899 \
  --functions apps/app/netlify/functions \
  --command "npm --prefix apps/app run dev -- --port 5183 --strictPort"
```

Then open `http://localhost:3717/demo` and
`http://localhost:8899/tutor/booking/waitlist`.

Gotchas:

- Run the website's `netlify dev` from `website/`, not the repo root.
  From the root, `npx next` resolves a different Next.js version and fails.
- The portal client hard-codes emulator ports 8080/9099
  (`src/firebase/config.js`), so the website must use the same emulator.
- `ENROLLMENT_RATE_LIMIT_SALT` (≥ 32 chars) is required by both demo
  endpoints; without it they return 500.
- Don't run `next build` while another `next dev` is using the same
  `website/.next` folder.
