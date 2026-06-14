const nodemailer = require('nodemailer')

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

async function runQuery(structuredQuery) {
  const res = await fetch(`${FS_BASE}:runQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery }),
  })
  const results = await res.json()
  return results.filter(r => r.document).map(r => docToObj(r.document))
}

async function getDoc(collection, id) {
  const res = await fetch(`${FS_BASE}/${collection}/${id}`)
  if (!res.ok) return null
  return docToObj(await res.json())
}

async function patchDoc(collection, id, fields) {
  const mask = Object.keys(fields).map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&')
  const body = {
    fields: Object.fromEntries(
      Object.entries(fields).map(([k, v]) => {
        if (v === null) return [k, { nullValue: null }]
        if (typeof v === 'string') return [k, { stringValue: v }]
        if (typeof v === 'number') return [k, Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }]
        if (typeof v === 'boolean') return [k, { booleanValue: v }]
        return [k, { stringValue: String(v) }]
      })
    ),
  }
  const res = await fetch(`${FS_BASE}/${collection}/${id}?${mask}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.ok
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const { sessionId } = JSON.parse(event.body ?? '{}')
  if (!sessionId) return { statusCode: 400, body: 'Missing sessionId' }

  if (!PROJECT_ID) return { statusCode: 500, body: 'FIREBASE_PROJECT_ID not set' }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('SMTP not configured — skipping waitlist notification')
    return { statusCode: 200, body: 'skipped' }
  }

  // Find next waiting entry (query, then sort by position in JS)
  const entries = await runQuery({
    from: [{ collectionId: 'waitlist' }],
    where: {
      compositeFilter: {
        op: 'AND',
        filters: [
          { fieldFilter: { field: { fieldPath: 'sessionId' }, op: 'EQUAL', value: { stringValue: sessionId } } },
          { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'Waiting' } } },
        ],
      },
    },
  })

  if (entries.length === 0) return { statusCode: 200, body: 'no-waitlist' }

  entries.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  const w = entries[0]

  const [sess, prog] = await Promise.all([
    getDoc('sessions', sessionId),
    w.programId ? getDoc('programs', w.programId) : null,
  ])

  const formatDate = (ts) => {
    if (!ts) return ''
    return new Date(ts).toLocaleString('en-CA', { timeZone: 'America/Toronto', dateStyle: 'medium', timeStyle: 'short' })
  }

  const registerUrl = `${process.env.URL ?? 'https://portal.krianatutoring.com'}/programs/${w.programId}/register?sessionId=${sessionId}`

  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  await transporter.sendMail({
    from: `Kriana Tutoring <${process.env.SMTP_USER}>`,
    to: w.parentEmail,
    subject: `A spot opened up! — ${prog?.title ?? 'Program'}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
        <div style="background:#0c6162;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">Great news, ${w.parentName}!</h1>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
          <p style="font-size:16px;margin-top:0">
            A spot has opened up in <strong>${prog?.title ?? 'the program'}</strong> for <strong>${w.childName}</strong>.
          </p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:13px;width:120px">Session</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600">${sess?.title ?? ''}</td></tr>
            <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Date</td><td style="padding:8px 0;font-size:13px;font-weight:600">${formatDate(sess?.startDateTime)}</td></tr>
          </table>
          <p style="font-size:14px;color:#64748b;margin-bottom:24px">
            This offer is available for <strong>24 hours</strong>. After that, the spot will be offered to the next person on the waitlist.
          </p>
          <a href="${registerUrl}" style="display:inline-block;background:#0c6162;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
            Claim Your Spot →
          </a>
          <p style="font-size:12px;color:#94a3b8;margin-top:24px">
            Questions? Reply to this email or contact us at info@krianatutoring.com
          </p>
        </div>
      </div>
    `,
  })

  await patchDoc('waitlist', w.id, {
    status: 'Offered',
    offeredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return { statusCode: 200, body: JSON.stringify({ notified: w.parentEmail }) }
}
