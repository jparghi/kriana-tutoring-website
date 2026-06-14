import nodemailer from 'nodemailer'

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

function fsVal(v) {
  if (v == null) return null
  if ('stringValue' in v) return v.stringValue
  if ('integerValue' in v) return parseInt(v.integerValue)
  if ('doubleValue' in v) return v.doubleValue
  if ('booleanValue' in v) return v.booleanValue
  if ('timestampValue' in v) return v.timestampValue
  if ('mapValue' in v) {
    const o = {}
    for (const [k, val] of Object.entries(v.mapValue.fields ?? {})) o[k] = fsVal(val)
    return o
  }
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(fsVal)
  return null
}

function docToObj(doc) {
  if (!doc || !doc.fields) return null
  const obj = { id: doc.name.split('/').pop() }
  for (const [k, v] of Object.entries(doc.fields)) obj[k] = fsVal(v)
  return obj
}

async function getDoc(collection, id) {
  const res = await fetch(`${FS_BASE}/${collection}/${id}`)
  if (!res.ok) return null
  return docToObj(await res.json())
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

function formatDate(ts) {
  if (!ts) return 'TBD'
  const d = new Date(ts)
  return d.toLocaleDateString('en-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'America/Toronto',
  })
}

function formatAmount(cents) {
  if (!cents) return 'Free'
  return `$${(cents / 100).toFixed(2)} CAD`
}

function pendingHtml({ reg, prog, sess }) {
  const etransferEmail = process.env.VITE_ETRANSFER_EMAIL || 'info@krianatutoring.com'
  const message = `Kriana ${prog?.title ?? 'Registration'} - ${reg.childName}`
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:600px;margin:32px auto;padding:0 16px">
    <div style="background:#fff;border-radius:20px;border:1px solid #e2e8f0;overflow:hidden">
      <div style="background:linear-gradient(135deg,#0c6162,#0d9e9f);padding:32px 32px 24px">
        <p style="margin:0 0 8px;color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:0.15em;text-transform:uppercase;font-weight:700">Kriana Tutoring</p>
        <h1 style="margin:0;color:#fff;font-size:24px;font-weight:900">Booking Received!</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Your spot is held for 24 hours while we await your e-transfer.</p>
      </div>
      <div style="padding:28px 32px">
        <p style="margin:0 0 20px;color:#475569;font-size:14px">Hi ${reg.parentName},<br><br>
        Thank you for registering <strong>${reg.childName}</strong> for <strong>${prog?.title ?? 'our program'}</strong>.
        Your spot is temporarily reserved — please send the e-transfer within <strong>24 hours</strong> to confirm.</p>
        <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 12px;font-weight:700;color:#92400e;font-size:13px;text-transform:uppercase;letter-spacing:0.1em">E-Transfer Instructions</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:4px 0;color:#78350f;font-size:12px;width:90px">Send To</td><td style="padding:4px 0;font-weight:700;color:#1e293b;font-family:monospace;font-size:13px">${etransferEmail}</td></tr>
            <tr><td style="padding:4px 0;color:#78350f;font-size:12px">Amount</td><td style="padding:4px 0;font-weight:700;color:#1e293b;font-size:14px">${formatAmount(reg.amountDue)}</td></tr>
            <tr><td style="padding:4px 0;color:#78350f;font-size:12px">Message</td><td style="padding:4px 0;font-weight:700;color:#1e293b;font-family:monospace;font-size:12px">${message}</td></tr>
          </table>
        </div>
        <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 12px;font-weight:700;color:#0f172a;font-size:13px;text-transform:uppercase;letter-spacing:0.1em">Booking Summary</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:5px 0;color:#64748b;font-size:13px;width:110px">Program</td><td style="padding:5px 0;font-weight:600;color:#1e293b;font-size:13px">${prog?.title ?? '—'}</td></tr>
            <tr><td style="padding:5px 0;color:#64748b;font-size:13px">Session</td><td style="padding:5px 0;font-weight:600;color:#1e293b;font-size:13px">${sess?.title ?? '—'}</td></tr>
            <tr><td style="padding:5px 0;color:#64748b;font-size:13px">Date</td><td style="padding:5px 0;font-weight:600;color:#1e293b;font-size:13px">${formatDate(sess?.startDateTime)}</td></tr>
            ${sess?.location ? `<tr><td style="padding:5px 0;color:#64748b;font-size:13px">Location</td><td style="padding:5px 0;font-weight:600;color:#1e293b;font-size:13px">${sess.location}</td></tr>` : ''}
            <tr><td style="padding:5px 0;color:#64748b;font-size:13px">Child</td><td style="padding:5px 0;font-weight:600;color:#1e293b;font-size:13px">${reg.childName}</td></tr>
            <tr><td style="padding:5px 0;color:#64748b;font-size:13px">Amount Due</td><td style="padding:5px 0;font-weight:700;color:#0c6162;font-size:14px">${formatAmount(reg.amountDue)}</td></tr>
          </table>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0">
          After sending the e-transfer, no further action is needed — we'll verify and send you a confirmation email once your spot is secured.<br><br>
          Questions? Reply to this email or contact us at <a href="mailto:info@krianatutoring.com" style="color:#0c6162;font-weight:600">info@krianatutoring.com</a> or call <a href="tel:+16134006921" style="color:#0c6162;font-weight:600">(613) 400-6921</a>.
        </p>
      </div>
      <div style="background:#f1f5f9;padding:16px 32px;text-align:center">
        <p style="margin:0;color:#94a3b8;font-size:12px">© ${new Date().getFullYear()} Kriana Tutoring · Ottawa, ON</p>
      </div>
    </div>
  </div>
</body>
</html>`
}

function confirmedHtml({ reg, prog, sess }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:600px;margin:32px auto;padding:0 16px">
    <div style="background:#fff;border-radius:20px;border:1px solid #e2e8f0;overflow:hidden">
      <div style="background:linear-gradient(135deg,#0c6162,#0d9e9f);padding:32px 32px 24px;text-align:center">
        <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <p style="margin:0 0 6px;color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:0.15em;text-transform:uppercase;font-weight:700">Kriana Tutoring</p>
        <h1 style="margin:0;color:#fff;font-size:26px;font-weight:900">Registration Confirmed!</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Your spot is secured. See you there!</p>
      </div>
      <div style="padding:28px 32px">
        <p style="margin:0 0 20px;color:#475569;font-size:14px">Hi ${reg.parentName},<br><br>
        Great news — <strong>${reg.childName}</strong>'s registration for <strong>${prog?.title ?? 'our program'}</strong> is confirmed. We look forward to seeing you!</p>
        <div style="background:#e6f4f4;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 12px;font-weight:700;color:#0c6162;font-size:13px;text-transform:uppercase;letter-spacing:0.1em">Confirmed Booking</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:5px 0;color:#4a7c7d;font-size:13px;width:110px">Program</td><td style="padding:5px 0;font-weight:700;color:#0f172a;font-size:13px">${prog?.title ?? '—'}</td></tr>
            <tr><td style="padding:5px 0;color:#4a7c7d;font-size:13px">Session</td><td style="padding:5px 0;font-weight:600;color:#0f172a;font-size:13px">${sess?.title ?? '—'}</td></tr>
            <tr><td style="padding:5px 0;color:#4a7c7d;font-size:13px">Date</td><td style="padding:5px 0;font-weight:600;color:#0f172a;font-size:13px">${formatDate(sess?.startDateTime)}</td></tr>
            ${sess?.location ? `<tr><td style="padding:5px 0;color:#4a7c7d;font-size:13px">Location</td><td style="padding:5px 0;font-weight:600;color:#0f172a;font-size:13px">${sess.location}</td></tr>` : ''}
            <tr><td style="padding:5px 0;color:#4a7c7d;font-size:13px">Child</td><td style="padding:5px 0;font-weight:600;color:#0f172a;font-size:13px">${reg.childName}</td></tr>
            <tr><td style="padding:5px 0;color:#4a7c7d;font-size:13px">Amount Paid</td><td style="padding:5px 0;font-weight:700;color:#0c6162;font-size:14px">${formatAmount(reg.amountPaid ?? reg.amountDue)}</td></tr>
          </table>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0">
          Questions? Contact us at <a href="mailto:info@krianatutoring.com" style="color:#0c6162;font-weight:600">info@krianatutoring.com</a> or call <a href="tel:+16134006921" style="color:#0c6162;font-weight:600">(613) 400-6921</a>.
        </p>
      </div>
      <div style="background:#f1f5f9;padding:16px 32px;text-align:center">
        <p style="margin:0;color:#94a3b8;font-size:12px">© ${new Date().getFullYear()} Kriana Tutoring · Ottawa, ON</p>
      </div>
    </div>
  </div>
</body>
</html>`
}

function adminNotificationHtml({ reg, prog, sess, type }) {
  const subject = type === 'confirmed'
    ? `✅ New Booking Confirmed — ${reg.childName} → ${prog?.title}`
    : `📬 New Booking (E-Transfer Pending) — ${reg.childName} → ${prog?.title}`
  return {
    subject,
    html: `
<p><strong>Type:</strong> ${type === 'confirmed' ? 'Confirmed (Stripe)' : 'Pending e-transfer'}</p>
<p><strong>Child:</strong> ${reg.childName} (Age ${reg.childAge ?? '?'}${reg.childGrade ? `, ${reg.childGrade}` : ''})</p>
<p><strong>Parent:</strong> ${reg.parentName} · ${reg.parentEmail} · ${reg.parentPhone ?? ''}</p>
<p><strong>Program:</strong> ${prog?.title ?? reg.programId}</p>
<p><strong>Session:</strong> ${sess?.title ?? reg.sessionId} — ${formatDate(sess?.startDateTime)}</p>
${sess?.location ? `<p><strong>Location:</strong> ${sess.location}</p>` : ''}
<p><strong>Amount:</strong> ${formatAmount(reg.amountDue)}</p>
${reg.medicalNotes ? `<p><strong>Medical Notes:</strong> ${reg.medicalNotes}</p>` : ''}
<p><strong>Registration ID:</strong> ${reg.id ?? '—'}</p>
`,
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { registrationId, type = 'pending' } = body
  if (!registrationId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing registrationId' }) }
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP_USER / SMTP_PASS not set — skipping confirmation email')
    return { statusCode: 200, body: JSON.stringify({ skipped: true }) }
  }

  if (!PROJECT_ID) {
    return { statusCode: 500, body: JSON.stringify({ error: 'FIREBASE_PROJECT_ID not set' }) }
  }

  try {
    const reg = await getDoc('registrations', registrationId)
    if (!reg) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Registration not found' }) }
    }

    const [prog, sess] = await Promise.all([
      reg.programId ? getDoc('programs', reg.programId) : null,
      reg.sessionId ? getDoc('sessions', reg.sessionId) : null,
    ])

    const transport = createTransport()
    const fromAddress = `"Kriana Tutoring" <${process.env.SMTP_USER}>`
    const adminEmail = process.env.ADMIN_EMAIL || 'info@krianatutoring.com'

    const parentSubject = type === 'confirmed'
      ? `Registration Confirmed — ${prog?.title ?? 'Your Program'}`
      : `Booking Received — ${prog?.title ?? 'Your Program'} (E-Transfer Instructions)`

    await transport.sendMail({
      from: fromAddress,
      to: reg.parentEmail,
      subject: parentSubject,
      html: type === 'confirmed'
        ? confirmedHtml({ reg, prog, sess })
        : pendingHtml({ reg, prog, sess }),
    })

    const { subject: adminSubject, html: adminHtml } = adminNotificationHtml({ reg, prog, sess, type })
    await transport.sendMail({
      from: fromAddress,
      to: adminEmail,
      subject: adminSubject,
      html: adminHtml,
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sent: true }),
    }
  } catch (err) {
    console.error('send-booking-confirmation error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
