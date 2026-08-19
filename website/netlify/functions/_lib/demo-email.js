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

/**
 * Sends the parent + admin demo-registration acknowledgement emails. Skips
 * silently (console.warn) if SMTP env vars aren't configured, and never
 * throws on send failure — mirrors submit-enrollment-request.js's
 * sendAcknowledgements exactly, so a failed email never fails the request
 * that already wrote the registration record.
 */
export async function sendDemoAcknowledgement({ registration, program, offering, reference, paymentUrl }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Demo registration saved; SMTP credentials are not configured, so email was skipped.')
    return
  }

  const programTitle = escapeHtml(program?.title || 'Kriana program')
  const parentName = escapeHtml(registration.parentName)
  const childName = escapeHtml(registration.childName)
  const safeReference = escapeHtml(reference)
  const priceLabel = formatAmount(1000, 'CAD')
  const fromAddress = `"Kriana Tutoring" <${process.env.SMTP_USER}>`
  const adminEmail = process.env.ADMIN_EMAIL || 'info@krianatutoring.com'

  const parentHtml = `
    <div style="max-width:600px;margin:24px auto;font-family:Arial,sans-serif;color:#1e293b">
      <div style="background:#0c6162;color:white;padding:28px;border-radius:16px 16px 0 0">
        <p style="margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase">Kriana Tutoring</p>
        <h1 style="margin:0;font-size:24px">$10 Demo Class Registration Received</h1>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:0;padding:28px;border-radius:0 0 16px 16px">
        <p>Hi ${parentName},</p>
        <p>We received your $10 demo class registration for <strong>${childName}</strong> to try <strong>${programTitle}</strong>.</p>
        <div style="background:#f8fafc;padding:16px;border-radius:10px;margin:18px 0">
          <p style="margin:0 0 8px"><strong>Program:</strong> ${programTitle}</p>
          <p style="margin:0 0 8px"><strong>Charge:</strong> ${priceLabel}</p>
          <p style="margin:0"><strong>Reference:</strong> ${safeReference}</p>
        </div>
        <p style="font-weight:700">Try for $10 — Demo is FREE when you enroll.</p>
        <p>The $10 is credited toward regular enrollment after your child attends.</p>
        ${paymentUrl ? `<p><a href="${paymentUrl}" style="color:#0c6162;font-weight:700">Complete your $10 payment →</a></p>` : ''}
        <p>Questions? Reply to this email or call <a href="tel:+16134006921">(613) 400-6921</a>.</p>
        ${emailSignatureHtml()}
      </div>
    </div>`

  const adminHtml = `
    <h2>New $10 demo class registration</h2>
    <p><strong>Reference:</strong> ${safeReference}</p>
    <p><strong>Program:</strong> ${programTitle}</p>
    <p><strong>Charge:</strong> ${priceLabel}</p>
    <p><strong>Child:</strong> ${childName} (age ${escapeHtml(registration.childAge)})</p>
    <p><strong>Parent:</strong> ${parentName} · ${escapeHtml(registration.parentEmail)} · ${escapeHtml(registration.parentPhone)}</p>
    <p>Review the private demo registration record in the program management portal for all additional details.</p>`

  const transport = createTransport()
  const results = await Promise.allSettled([
    transport.sendMail({ from: fromAddress, to: registration.parentEmail, subject: `$10 demo class registration received — ${program?.title || 'Kriana program'}`, html: parentHtml }),
    transport.sendMail({ from: fromAddress, to: adminEmail, subject: `New $10 demo registration — ${program?.title || 'Program'} — ${registration.childName}`, html: adminHtml }),
  ])
  for (const result of results) {
    if (result.status === 'rejected') console.error('Demo registration acknowledgement email failed:', result.reason)
  }
}
