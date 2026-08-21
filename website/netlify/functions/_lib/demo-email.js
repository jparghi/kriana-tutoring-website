// Confirmation email for the $10 Young Engineers Demo Registration flow.
// Same nodemailer/createTransport/emailSignatureHtml pattern and
// Promise.allSettled non-blocking-failure handling as submit-enrollment-
// request.js's sendAcknowledgements — copied rather than imported since that
// function's shape (session/package-oriented) doesn't fit the demo's
// 5-field, single-price product.
import nodemailer from 'nodemailer'
import { emailSignatureHtml } from './email-signature.js'

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

function formatAmount(cents, currency) {
  return `$${(Number(cents ?? 0) / 100).toFixed(2)} ${currency || 'CAD'}`
}

// Fixed-event date/time formatting for a single-occurrence demo campaign
// offering, e.g. the /demo funnel. Duplicated (not imported) from
// lib/booking.ts's formatEventDateTime, matching this file's own stated
// pattern of copying rather than importing across the submission-flow
// boundary. Returns '' if the offering doesn't carry fixed event fields.
function formatEventDateTime(offering) {
  const rawStart = offering?.eventStartAt
  if (!rawStart) return ''
  const start = rawStart?.toDate ? rawStart.toDate() : new Date(rawStart)
  const timeZone = offering?.timezone || 'America/Toronto'
  const rawEnd = offering?.eventEndAt
  const end = rawEnd ? (rawEnd?.toDate ? rawEnd.toDate() : new Date(rawEnd)) : null
  const dateLabel = start.toLocaleDateString('en-CA', { timeZone, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const startTime = start.toLocaleTimeString('en-CA', { timeZone, hour: 'numeric', minute: '2-digit' })
  const endTime = end ? end.toLocaleTimeString('en-CA', { timeZone, hour: 'numeric', minute: '2-digit' }) : ''
  return endTime ? `${dateLabel}, ${startTime}–${endTime}` : `${dateLabel}, ${startTime}`
}

// Same source of truth and same message-format derivation as
// app/booking/demo-etransfer/page.tsx — keep both in sync if either changes.
// NEXT_PUBLIC_ETRANSFER_EMAIL is a normal env var at runtime here (the
// NEXT_PUBLIC_ prefix only affects client-bundle inlining, not server
// readability), so this reads the identical value the page shows.
const ETRANSFER_EMAIL = process.env.NEXT_PUBLIC_ETRANSFER_EMAIL || 'info@krianatutoring.com'
const ETRANSFER_HOLD_HOURS = 48

function etransferMessage(programTitle, reference) {
  return `${programTitle || 'Kriana Demo'}${reference ? ` - ${reference}` : ''}`
}

/**
 * Sends the parent + admin demo-registration acknowledgement emails. Skips
 * silently (console.warn) if SMTP env vars aren't configured, and never
 * throws on send failure — mirrors submit-enrollment-request.js's
 * sendAcknowledgements exactly, so a failed email never fails the request
 * that already wrote the registration record.
 */
export async function sendDemoAcknowledgement({ registration, program, offering, reference }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Demo registration saved; SMTP credentials are not configured, so email was skipped.')
    return
  }

  const programTitle = escapeHtml(program?.title || 'Kriana program')
  const parentName = escapeHtml(registration.parentName)
  const childName = escapeHtml(registration.childName)
  const safeReference = escapeHtml(reference)
  const priceLabel = formatAmount(1000, 'CAD')
  const eventTitle = escapeHtml(offering?.eventTitle || '')
  const eventWhen = escapeHtml(formatEventDateTime(offering))
  const eventLocation = escapeHtml(offering?.location || '')
  const fromAddress = `"Kriana Tutoring" <${process.env.SMTP_USER}>`
  const adminEmail = process.env.ADMIN_EMAIL || 'info@krianatutoring.com'
  const etransferEmail = escapeHtml(ETRANSFER_EMAIL)
  // Uses the event title (not the internal program name) as the identifiable
  // part of the e-transfer note — parents registered for "Young Engineers
  // Demo Class — Kanata", not for a specific product like "Smartivo", and
  // the note only needs to be unique/identifiable, not tied to the backend
  // program record.
  const etransferMessageText = escapeHtml(etransferMessage(offering?.eventTitle || program?.title, reference))

  const parentHtml = `
    <div style="max-width:600px;margin:24px auto;font-family:Arial,sans-serif;color:#1e293b">
      <div style="background:#0c6162;color:white;padding:28px;border-radius:16px 16px 0 0">
        <p style="margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase">Kriana Tutoring</p>
        <h1 style="margin:0;font-size:24px">$10 Demo Class Registration Received</h1>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:0;padding:28px;border-radius:0 0 16px 16px">
        <p>Hi ${parentName},</p>
        <p>We received your $10 demo class registration for <strong>${childName}</strong> for <strong>${eventTitle || 'your $10 demo class'}</strong>.</p>
        <div style="background:#f8fafc;padding:16px;border-radius:10px;margin:18px 0">
          ${eventTitle ? `<p style="margin:0 0 8px"><strong>Event:</strong> ${eventTitle}</p>` : ''}
          ${eventWhen ? `<p style="margin:0 0 8px"><strong>When:</strong> ${eventWhen}</p>` : ''}
          ${eventLocation ? `<p style="margin:0 0 8px"><strong>Location:</strong> ${eventLocation}</p>` : ''}
          <p style="margin:0 0 8px"><strong>Charge:</strong> ${priceLabel}</p>
          <p style="margin:0"><strong>Reference:</strong> ${safeReference}</p>
        </div>
        <p style="font-weight:700">Try for $10 — Demo is FREE when you enroll.</p>
        <p>The $10 is credited toward regular enrollment after your child attends.</p>
        <div style="background:#e6f4f4;border:1px solid rgba(12,97,98,0.2);padding:16px;border-radius:10px;margin:18px 0">
          <p style="margin:0 0 10px;font-weight:700;color:#0c6162">Send Your $10 E-Transfer</p>
          <p style="margin:0 0 8px">Your child&apos;s demo spot is temporarily reserved. Please send an Interac e-Transfer within <strong>${ETRANSFER_HOLD_HOURS} hours</strong> to confirm it:</p>
          <p style="margin:0 0 4px"><strong>Send to:</strong> ${etransferEmail}</p>
          <p style="margin:0 0 4px"><strong>Amount:</strong> ${priceLabel}</p>
          <p style="margin:0"><strong>Message / Note:</strong> ${etransferMessageText}</p>
        </div>
        <p>No further action is needed after sending — our team will verify your e-transfer and confirm your seat by email. Your child&apos;s spot is temporarily held until then.</p>
        <p>Questions? Reply to this email or call <a href="tel:+16134006921">(613) 400-6921</a>.</p>
        ${emailSignatureHtml()}
      </div>
    </div>`

  const adminHtml = `
    <h2>New $10 demo class registration</h2>
    <p><strong>Reference:</strong> ${safeReference}</p>
    ${eventTitle ? `<p><strong>Event:</strong> ${eventTitle}</p>` : ''}
    ${eventWhen ? `<p><strong>When:</strong> ${eventWhen}</p>` : ''}
    <p><strong>Program:</strong> ${programTitle}</p>
    <p><strong>Charge:</strong> ${priceLabel}</p>
    <p><strong>Child:</strong> ${childName} (age ${escapeHtml(registration.childAge)})</p>
    <p><strong>Parent:</strong> ${parentName} · ${escapeHtml(registration.parentEmail)} · ${escapeHtml(registration.parentPhone)}</p>
    <p><strong>Expected e-transfer message/note:</strong> ${etransferMessageText}</p>
    <p>Review the private demo registration record in the program management portal for all additional details, and confirm the e-transfer there once it arrives.</p>`

  const transport = createTransport()
  const results = await Promise.allSettled([
    transport.sendMail({ from: fromAddress, to: registration.parentEmail, subject: `$10 Demo Class Registration Received — ${offering?.eventTitle || program?.title || 'Kriana program'}`, html: parentHtml }),
    transport.sendMail({ from: fromAddress, to: adminEmail, subject: `New $10 demo registration — ${offering?.eventTitle || program?.title || 'Program'} — ${registration.childName}`, html: adminHtml }),
  ])
  for (const result of results) {
    if (result.status === 'rejected') console.error('Demo registration acknowledgement email failed:', result.reason)
  }
}
