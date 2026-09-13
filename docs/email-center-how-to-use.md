# How to use the Email Center

A plain guide to sending a Kriana Learning Updates newsletter.
For what's built and what's deferred, see `email-center-status.md`.

---

## The short version

1. Parents subscribe through the form in the website footer.
2. You write the email (in ChatGPT, or straight into the form).
3. You preview it, send a test to yourself, then send it to the list.

Only parents who ticked the consent box and haven't unsubscribed ever
receive a campaign. That's enforced by the system, not by you remembering.

---

## 1. Getting subscribers

The signup form is in the footer of every page on krianatutoring.com. It asks
for a parent's name, email, whether they're interested in tutoring, robotics
or both, and it has a consent tickbox they must tick.

When someone signs up they immediately get a **Welcome to Kriana Learning
Updates** email, and they appear in your contacts list.

**Your list starts empty.** Existing demo and waitlist families are NOT on it —
they agreed to be contacted about a specific event, which isn't permission to
send marketing. The list grows only from people who use this form.

---

## 2. Finding your contacts

Sign in to the portal → **Marketing** in the left sidebar.

The dashboard shows: total contacts, marketing subscribers (the ones you can
actually email), tutoring leads, robotics leads, and unsubscribed.

Click **Contacts** for the full list. You can search by name or email, and
filter by interest or marketing status. Each row shows where the contact came
from, when they were added, and when they were last emailed.

**Marketing status means:**
- **Subscribed** — will receive campaigns
- **Unsubscribed** — asked to stop; never receives campaigns again
- **No consent** — never ticked the box; never receives campaigns

---

## 3. Writing the email

Portal → **Marketing** → **Create AI Campaign**.

### Step 1 — Campaign details

- **Campaign name** — for you, not the parents. e.g. "September Learning Update"
- **Objective** — Newsletter, Tutoring Promotion, Robotics Promotion, etc.

### Step 2 — Audience

Pick one:
- **All Marketing Subscribers**
- **Academic Tutoring Leads**
- **Robotics Leads**

It shows how many people will actually receive it, and how many are excluded
and why. Watch this number — it's the real count.

### Step 3 — Write the email

Two ways:

**Write it myself** (what we use today) — opens empty fields to fill in.

**Draft it with AI** — needs OpenAI billing credit, currently not set up. See
`email-center-status.md` if you ever want to turn it on.

#### Writing it in ChatGPT, then pasting in

This is the intended workflow. Open ChatGPT and ask for the copy, then paste
each piece into the matching field. A prompt that works well:

> Write a September newsletter email for Kriana Tutoring, a small tutoring
> centre in Kanata, Ontario that also runs Young Engineers robotics.
> The readers are parents of school-age children.
>
> Give me:
> - a subject line, under 60 characters
> - one sentence of preview text
> - a headline
> - 3 short sections, each with a heading and 2-3 sentences
> - a call-to-action button label
>
> Cover: our tutoring programs, Young Engineers robotics, our new photo
> gallery, and the free academic assessment.
> Warm, practical, parent-to-parent. Short paragraphs. Canadian spelling.
> Don't promise specific prices, dates or results.

Then in the portal:
- **Subject** — what parents see in their inbox list
- **Preview text** — the grey line after the subject
- **Headline** — the big line at the top of the email
- **Sections** — a heading and body each; **+ Add section** for more
- **Button text** and **Button links to** — pick a real page on the site

Paragraph breaks in a section body are preserved. Don't paste HTML — plain
text only.

### Step 4 — Preview

Check it in **Desktop** and **Mobile**. You'll see the sender, subject,
preview text, the email itself, the button, and the unsubscribe footer.

### Step 5 — Send a test to yourself

**Send test to myself** emails it to your own staff account address. It arrives
marked as a test, and it does **not** count as sending to your audience.

Always do this. Read it on your phone. It's the last easy place to catch a typo.

### Step 6 — Send

**Send now…** opens a confirmation screen showing the campaign name, audience,
exact recipient count, who's excluded and why, and the subject line.

Check the number. Then **Confirm & send**.

Sending happens in the background — you'll return to the campaigns list and it
will move from *sending* to *sent* as it works through the list.

---

## 4. After sending

**Marketing → Campaigns** lists every campaign with its audience, date,
recipient count, how many sent, and how many failed.

**You won't see opens or clicks.** Sending goes through your Google Workspace
mailbox, which doesn't report that back. You see what we can actually observe:
sent and failed. Anything more needs a dedicated email provider.

**A sent campaign can't be edited or sent again.** That's deliberate — it's the
easiest way to accidentally email everyone twice. To send something similar,
create a new campaign.

---

## 5. When someone unsubscribes

Every campaign has an unsubscribe link. One click, one confirmation, and they
stop receiving marketing immediately — including a campaign already in the
middle of being sent.

**They keep getting their important emails.** Registration confirmations,
invoices, and booking emails are a separate system and are unaffected. A parent
who unsubscribes from the newsletter still gets their invoice.

---

## Rules worth knowing

**The 200-recipient limit.** Campaigns are sent through your Workspace mailbox —
the same one that sends invoices. That's fine for a small list. Once you have
more than 200 subscribers the system will refuse to send, and a proper email
provider needs setting up first. This is a guardrail, not a bug.

**One email per audience, not per parent.** Everyone in the selected audience
gets the same email.

**You cannot email someone who didn't consent.** There's no override. If a
parent asks to be added, send them the signup form link so they tick the box
themselves — that's what makes the consent record real.

---

## If something goes wrong

| What you see | What it means |
|---|---|
| "No eligible recipients for this audience" | Nobody in that segment has consented yet |
| "This campaign is already sending/sent" | It's already gone; create a new one |
| "…above the 200 limit" | Your list outgrew Workspace sending — time for an email provider |
| "Email sending is not configured" | SMTP settings missing on the server |
| A few recipients show as failed | Bad or bouncing addresses; the rest still sent |

For anything else, the campaign's row shows the error, and the server logs in
Netlify have the detail.
