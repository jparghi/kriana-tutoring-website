// Welcome email for "Kriana Learning Updates" newsletter signups.
//
// Sent over the SAME nodemailer/SMTP transport as this repo's transactional
// email (demo-email.js, submit-enrollment-request.js). Minimum V1 has no
// separate marketing provider — see docs/ai-email-campaign-center-spec.md
// Part 0. When an ESP is introduced, this is one of the two call sites that
// moves to it (the other is the campaign sender); the transactional emails
// stay here unchanged.
//
// Unlike the transactional emails, this one does NOT append
// emailSignatureHtml() — a marketing email signed as a personal 1:1 note from
// Jignasa reads wrong and hurts deliverability. It carries the marketing
// footer with an unsubscribe link instead, which CASL requires on every
// commercial message.
import nodemailer from 'nodemailer'

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://krianatutoring.com').replace(/\/$/, '')

export function unsubscribeUrl(token) {
  return `${SITE_URL}/unsubscribe/${encodeURIComponent(token)}`
}

// Links are built from real sections of the site (see lib/site-links.ts for
// the canonical list) rather than invented paths.
const INTEREST_LINKS = {
  tutoring: [
    ['Academic tutoring programs', '/tutoring'],
    ['Free worksheets', '/worksheets'],
    ['Practice tests', '/practice-tests'],
  ],
  robotics: [
    ['Young Engineers robotics', '/robotics'],
    ['See our gallery', '/gallery'],
    ['Upcoming demo', '/demo'],
  ],
  both: [
    ['Academic tutoring programs', '/tutoring'],
    ['Young Engineers robotics', '/robotics'],
    ['Free worksheets', '/worksheets'],
    ['See our gallery', '/gallery'],
  ],
}

function welcomeHtml({ parentName, interest, unsubscribeToken }) {
  const links = (INTEREST_LINKS[interest] || INTEREST_LINKS.both)
    .map(([label, path]) =>
      `<li style="margin:0 0 6px"><a href="${SITE_URL}${path}" style="color:#0c6162;font-weight:600;text-decoration:none">${escapeHtml(label)}</a></li>`)
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:600px;margin:32px auto;padding:0 16px">
    <div style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden">
      <div style="background:#f0fdfa;border-bottom:1px solid #ccefee;padding:24px 32px">
        <p style="margin:0;font-size:20px;font-weight:800;color:#0c6162">Kriana Tutoring</p>
        <p style="margin:4px 0 0;font-size:13px;color:#475569">Personalized Tutoring &bull; Robotics &bull; STEM</p>
      </div>
      <div style="padding:28px 32px;color:#334155;font-size:14px;line-height:1.6">
        <h1 style="margin:0 0 16px;font-size:22px;color:#1e293b">Welcome to Kriana Learning Updates</h1>
        <p style="margin:0 0 16px">Hi ${escapeHtml(parentName)},</p>
        <p style="margin:0 0 16px">
          Thanks for joining! You're now on the list for the resources and updates
          Kanata families tell us they find most useful.
        </p>
        <p style="margin:0 0 8px;font-weight:700;color:#1e293b">Here's what you can expect from us:</p>
        <ul style="margin:0 0 20px;padding-left:20px">
          <li style="margin:0 0 6px">Practical learning tips you can use at home</li>
          <li style="margin:0 0 6px">Free worksheets and practice material</li>
          <li style="margin:0 0 6px">Tutoring program updates</li>
          <li style="margin:0 0 6px">Robotics &amp; STEM activities</li>
          <li style="margin:0 0 6px">Upcoming demos and events</li>
          <li style="margin:0 0 6px">Occasional special announcements and offers</li>
        </ul>
        <p style="margin:0 0 8px;font-weight:700;color:#1e293b">A good place to start:</p>
        <ul style="margin:0 0 24px;padding-left:20px">${links}</ul>
        <p style="margin:0 0 24px">
          Have a question about your child's learning? Just reply to this email &mdash;
          it comes straight to us.
        </p>
        <a href="${SITE_URL}/contact"
           style="display:inline-block;background:#0c6162;color:#fff;font-weight:700;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:999px">
          Book a free assessment
        </a>
      </div>
      <div style="background:#f1f5f9;padding:20px 32px;text-align:center;color:#94a3b8;font-size:12px;line-height:1.6">
        <p style="margin:0;font-weight:700;color:#64748b">Kriana Tutoring</p>
        <p style="margin:2px 0 0">Kanata, Ontario &bull; <a href="${SITE_URL}" style="color:#64748b">KrianaTutoring.com</a></p>
        <p style="margin:10px 0 0">
          You are receiving this email because you requested updates from Kriana Tutoring.
        </p>
        <p style="margin:6px 0 0">
          <a href="${unsubscribeUrl(unsubscribeToken)}" style="color:#64748b;text-decoration:underline">Unsubscribe</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}

/**
 * Sends the welcome email. Skips silently if SMTP isn't configured and never
 * throws on send failure — the contact and its consent record are already
 * saved, and a bounced welcome must not fail the signup. Same contract as
 * sendDemoAcknowledgement in _lib/demo-email.js.
 */
export async function sendNewsletterWelcomeEmail({ parentName, email, interest, unsubscribeToken }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Newsletter signup saved; SMTP credentials are not configured, so the welcome email was skipped.')
    return
  }

  const html = welcomeHtml({ parentName, interest, unsubscribeToken })

  try {
    await createTransport().sendMail({
      from: `"Kriana Tutoring" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to Kriana Learning Updates',
      html,
      // Lets well-behaved clients offer one-click unsubscribe without the
      // parent having to find the footer link.
      list: { unsubscribe: { url: unsubscribeUrl(unsubscribeToken), comment: 'Unsubscribe' } },
    })
  } catch (error) {
    console.error('Newsletter welcome email failed to send:', error)
  }
}
