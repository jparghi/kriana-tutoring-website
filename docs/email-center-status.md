# Email Center — status, limits, and what's parked

Last updated: 2026-09-13. Plain-language companion to
`ai-email-campaign-center-spec.md` (which holds the audit and full design).

---

## Where things stand

| Piece | State |
|---|---|
| Newsletter signup form (website footer) | **Working** |
| Contact + consent storage (`marketingContacts`) | **Working** |
| Welcome email on signup | **Working** |
| Unsubscribe page + link | **Working** |
| Admin Email Center (dashboard, contacts, campaigns) | **Working** |
| Campaign sending (queue, batching, consent gate) | **Built, untested against a real send** |
| Writing campaigns by hand (paste from ChatGPT) | **Working — the intended path** |
| In-app AI writing | **Built, PARKED — see below** |

Parents can subscribe today, land in the contact list with an auditable consent
record, receive a welcome email, and unsubscribe. Staff can see all of it in
the portal.

---

## How campaigns get written (decided 2026-09-13)

**Write the copy in the ChatGPT chat app, paste it into the Email Center.**

The subscription you already pay for covers the writing; the API key would be a
second, separate bill for the same thing. So the campaign editor has a "Write
it myself" path — start an empty draft, fill in subject, headline, sections and
button, add sections as needed. Paste from ChatGPT, a document, or type it.

Everything after that is unchanged: preview, test send to yourself, the consent
gate, and batched delivery all work the same regardless of who wrote the words.

The in-app AI button remains, unused, for if that changes.

---

## What is parked, and why

### In-app AI campaign writing

The code is written, wired and unit-tested. It is parked on one thing: the
OpenAI account has **no credit**. The API key itself is valid and the account
can reach 108 models including the GPT-5 family — the exact failure is:

```
status : 429
code   : credit_balance_exhausted
message: You have no credits remaining.
```

**To unpark it:** add credit at
platform.openai.com/settings/organization/billing (US$5 is months of use at a
few cents per campaign), then run one generation to confirm. Nothing else has
to change.

**It is not on the critical path.** Campaigns are written by hand and pasted in
(above), so nothing is blocked by this. Unpark it only if in-app drafting turns
out to be worth a second bill.

**One open decision when it resumes:** `OPENAI_MODEL` currently defaults to
`gpt-4o`, chosen before the account's model list was visible. The account has
`gpt-5.5` and newer, which are better suited and still trivially cheap here.
Switch the default after one confirmed successful call — not before.

### Gap this created — now closed

The editor originally opened its edit and preview steps only once content
existed, and only the AI could create content — so with the AI parked, no
campaign could be composed at all. Closed on 2026-09-13: a "Write it myself"
button starts an empty draft and "+ Add section" adds blocks. Send and test
send stay disabled until there is a subject, a headline and one section, so an
empty draft cannot be sent.

---

## What the OpenAI key does NOT cover

The key buys one thing: **the writing**. Everything else runs on something else.

- **Sending email** — Google Workspace SMTP (`info@krianatutoring.com`).
  Separate system, already working.
- **Delivery statistics** — opens, clicks, bounces, delivered. Gmail provides no
  webhooks, so campaign reports show only what we observe ourselves: sent and
  failed. Real metrics need an email service provider.
- **The 200-recipient cap** — a consequence of sending through Workspace with no
  bounce feedback and shared reputation with the invoice mailbox. No amount of
  OpenAI credit changes it.
- **Contacts and consent** — Firestore. The AI never sees the subscriber list;
  it writes one email per segment, never per person.

### Limits on the AI itself, by design

- It cannot emit HTML or arbitrary links. It returns structured fields
  (subject, headline, sections, button) and our code renders the email. The
  button can only point at a page on an allowlist. This is what stops a bad
  instruction from putting something dangerous in a parent's inbox.
- It knows only the brand description written into the prompt. It cannot read
  the website, the calendar, or enrolment numbers. Anything time-specific —
  September's schedule, a price, a date — must be supplied in the instructions
  box or it will not appear.

---

## Deferred from V1 (decided, not forgotten)

| Deferred | Why | Revisit when |
|---|---|---|
| Email service provider | No volume yet | List > 200, or first bounce complaint |
| Open / click / bounce metrics | Impossible without an ESP | Ships with the ESP |
| Scheduling ("send later") | Send Now covers the need | On request |
| Images in campaigns | No media store; no picker built | On request |
| Drip sequences / automations | Out of V1 scope | On request |
| Per-recipient personalization | One generation per segment is cheaper and simpler | Large, well-segmented list |
| Importing existing leads | Nothing is importable — demo/waitlist consent was single-purpose event consent, not marketing consent | A genuinely consented list arrives |
| Home + Gallery signup placements | Footer is sitewide already | After the footer form proves out |

---

## Environment variables

| Variable | Website site | Portal site | Status |
|---|---|---|---|
| `MARKETING_UNSUBSCRIBE_SECRET` | yes | yes — **same value** | Set locally |
| `OPENAI_API_KEY` | — | yes | Set locally; **account has no credit** |
| `OPENAI_MODEL` | — | optional | Defaults to `gpt-4o`; revisit |
| `CAMPAIGN_WORKER_SECRET` | — | yes | Set locally |
| `MARKETING_SITE_URL` | — | yes | Set locally |

None are in Netlify yet — these are local `.env.local` values only, so the
live site does not have them.

**Security note:** the current OpenAI key was pasted into a chat transcript.
Before this goes live, delete that key at platform.openai.com and create a
replacement, pasting it straight into `apps/app/.env.local`.

---

## To go live

1. Rotate the OpenAI key (it was pasted into a chat transcript). Adding OpenAI
   credit is optional — campaigns are written by hand.
2. Add the variables to the two Netlify sites (`OPENAI_API_KEY` only matters if
   in-app AI is unparked).
3. Deploy the website repo and the portal repo.
4. Deploy Firestore rules from the platform repo:
   `firebase deploy --only firestore:rules`
5. Send a test campaign to yourself before any real audience.
