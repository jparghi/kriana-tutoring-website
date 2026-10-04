// Emails sent when a parent accepts the Builder/Engineer learning-path
// agreement (registration-agreement.js): the parent's own copy of what they
// agreed to, and a separate notice to staff (ADMIN_EMAIL). Same
// nodemailer/createTransport/emailSignatureHtml pattern as demo-email.js.
import nodemailer from 'nodemailer'
import { emailSignatureHtml } from './email-signature.js'
import {
  AGREEMENT_COMMITMENT_STATEMENT,
  AGREEMENT_TERMS_STATEMENT,
  ROBOTICS_TERMS_URL,
} from '../../../lib/robotics-agreement.js'

const SITE_URL = 'https://krianatutoring.com'
const PORTAL_REGISTRATIONS_URL = `${process.env.PORTAL_URL || 'https://portal.krianatutoring.com'}/tutor/booking/registrations`

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]))
}

function money(cents) {
  return `$${(cents / 100).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function firstName(name) {
  return String(name ?? '').trim().split(/\s+/)[0] || ''
}

export function formatAcceptedAt(date) {
  return date.toLocaleString('en-CA', {
    timeZone: 'America/Toronto', dateStyle: 'long', timeStyle: 'short',
  })
}

const label = 'padding:5px 0;color:#4a7c7d;font-size:13px;width:130px;vertical-align:top'
const value = 'padding:5px 0;font-weight:700;color:#0f172a;font-size:13px'
const row = (name, content) => `<tr><td style="${label}">${name}</td><td style="${value}">${content}</td></tr>`

function detailsTable({ registration, view, acceptedAtLabel }) {
  return `
    <table style="width:100%;border-collapse:collapse">
      ${row('Program', escapeHtml(view.programTitle))}
      ${row('Child', escapeHtml(registration.childName))}
      ${row('Learning Path', `${escapeHtml(view.packageName)} — ${view.classCount} classes`)}
      ${row('Reference', escapeHtml(view.registrationNumber))}
      ${row('Accepted by', escapeHtml(view.acceptedBy))}
      ${row('Accepted on', escapeHtml(acceptedAtLabel))}
      ${row('Terms version', escapeHtml(registration.termsVersion || ''))}
    </table>`
}

function statementsHtml() {
  const item = text => `<tr><td style="padding:4px 10px 4px 0;color:#0c6162;font-weight:900;vertical-align:top">✓</td><td style="padding:4px 0;color:#334155;font-size:13px;line-height:1.5">${escapeHtml(text)}</td></tr>`
  return `<table style="border-collapse:collapse">${item(AGREEMENT_COMMITMENT_STATEMENT)}${item(AGREEMENT_TERMS_STATEMENT)}</table>`
}

function etransferHtml(view) {
  const e = view.etransfer
  if (view.paymentRecorded || !e) return ''
  return `
    <div style="background:#e6f4f4;border-left:4px solid #0c6162;border-radius:12px;padding:16px 18px;margin:20px 0 0">
      <p style="margin:0 0 8px;font-weight:800;color:#0f172a;font-size:14px">Next: pay by Interac e-Transfer</p>
      <table style="width:100%;border-collapse:collapse">
        ${row('Send to', escapeHtml(e.sendTo))}
        ${row(e.planPaymentCents ? 'Pay in full' : 'Amount', `${money(e.payInFullCents)} <span style="font-weight:400;color:#64748b">incl. HST</span>`)}
        ${e.planPaymentCents ? row('Payment plan', `${money(e.planPaymentCents)} <span style="font-weight:400;color:#64748b">incl. HST — first of ${view.installments} payments</span>`) : ''}
        ${row('Message / Note', escapeHtml(e.message))}
      </table>
      <p style="margin:10px 0 0;color:#64748b;font-size:12px">Your registration is confirmed once your first payment is received.</p>
    </div>`
}

export function parentAgreementEmail({ registration, view, acceptedAtLabel }) {
  const child = escapeHtml(firstName(registration.childName))
  return {
    subject: `Agreement Received — ${firstName(registration.childName)}'s ${view.programTitle} ${view.packageName} Learning Path`,
    html: `
    <div style="max-width:600px;margin:24px auto;font-family:Arial,sans-serif;color:#1e293b">
      <div style="background:#0c6162;color:white;padding:26px 28px;border-radius:16px 16px 0 0">
        <p style="margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase">Kriana Tutoring × Young Engineers</p>
        <h1 style="margin:0;font-size:24px">Agreement Received</h1>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:0;padding:26px 28px;border-radius:0 0 16px 16px">
        <p style="margin:0 0 12px;font-size:14px">Hi ${escapeHtml(firstName(registration.parentName))},</p>
        <p style="margin:0 0 18px;font-size:14px;color:#475569">Thank you — we've recorded your learning-path agreement for ${child}. This email is your copy.</p>
        <div style="background:#e6f4f4;border-radius:12px;padding:18px 20px">${detailsTable({ registration, view, acceptedAtLabel })}</div>
        <p style="margin:20px 0 6px;font-weight:800;font-size:14px;color:#0f172a">What you agreed to</p>
        ${statementsHtml()}
        <p style="margin:10px 0 0;font-size:12px"><a href="${SITE_URL}${ROBOTICS_TERMS_URL}" style="color:#0c6162;font-weight:700">View Robotics Program &amp; Payment Terms</a></p>
        ${etransferHtml(view)}
        <p style="margin:20px 0 0;font-size:14px;color:#475569">Questions? Reply to this email or call <a href="tel:+16134006921" style="color:#0c6162">(613) 400-6921</a>.</p>
        ${emailSignatureHtml()}
      </div>
    </div>`,
  }
}

export function adminAgreementEmail({ registration, view, acceptedAtLabel }) {
  const activateNote = view.paymentRecorded
    ? '<strong>Payment is already recorded</strong> — open Payment on this registration and press Save Payment to make it Active.'
    : 'Payment is not recorded yet. The registration becomes Active once you record the e-Transfer.'
  return {
    subject: `Agreement accepted — ${registration.childName} · ${view.registrationNumber}`,
    html: `
    <div style="max-width:600px;font-family:Arial,sans-serif;color:#1e293b">
      <h2 style="margin:0 0 12px;font-size:18px">Learning-path agreement accepted</h2>
      <p style="margin:0 0 14px;font-size:14px">${escapeHtml(view.acceptedBy)} accepted the ${escapeHtml(view.packageName)} agreement for ${escapeHtml(registration.childName)} (parent email ${escapeHtml(registration.parentEmail)}).</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 18px">${detailsTable({ registration, view, acceptedAtLabel })}</div>
      <p style="margin:14px 0;font-size:14px">${activateNote}</p>
      <p style="margin:0"><a href="${PORTAL_REGISTRATIONS_URL}" style="display:inline-block;background:#0c6162;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:10px 18px;border-radius:10px">Open Registrations →</a></p>
    </div>`,
  }
}

/** Best-effort: the acceptance is already saved, so a mail failure is logged
 * and never undoes it. */
export async function sendAgreementEmails({ registration, view, acceptedAt = new Date() }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Agreement saved; SMTP credentials are not configured, so the agreement emails were skipped.')
    return { parentSent: false, adminSent: false }
  }
  const acceptedAtLabel = formatAcceptedAt(acceptedAt)
  const from = `"Kriana Tutoring" <${process.env.SMTP_USER}>`
  const adminTo = process.env.ADMIN_EMAIL || 'info@krianatutoring.com'
  const parent = parentAgreementEmail({ registration, view, acceptedAtLabel })
  const admin = adminAgreementEmail({ registration, view, acceptedAtLabel })
  const transport = createTransport()
  const [parentResult, adminResult] = await Promise.allSettled([
    registration.parentEmail
      ? transport.sendMail({ from, to: registration.parentEmail, subject: parent.subject, html: parent.html })
      : Promise.reject(new Error('Registration has no parent email')),
    transport.sendMail({ from, to: adminTo, subject: admin.subject, html: admin.html }),
  ])
  for (const result of [parentResult, adminResult]) {
    if (result.status === 'rejected') console.error('Agreement email failed:', result.reason)
  }
  return { parentSent: parentResult.status === 'fulfilled', adminSent: adminResult.status === 'fulfilled' }
}
