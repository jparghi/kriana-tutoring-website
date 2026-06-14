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

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const { email } = JSON.parse(event.body ?? '{}')
  if (!email || !email.includes('@')) return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email' }) }

  if (!PROJECT_ID) return { statusCode: 500, body: JSON.stringify({ error: 'FIREBASE_PROJECT_ID not set' }) }

  const regs = await runQuery({
    from: [{ collectionId: 'registrations' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'parentEmail' },
        op: 'EQUAL',
        value: { stringValue: email.toLowerCase().trim() },
      },
    },
  })

  // Sort by createdAt descending in JS (avoids composite index requirement)
  regs.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return tb - ta
  })

  if (regs.length === 0) {
    return { statusCode: 200, body: JSON.stringify({ registrations: [], programs: {}, sessions: {} }) }
  }

  const programIds = [...new Set(regs.map(r => r.programId).filter(Boolean))]
  const sessionIds = [...new Set(regs.map(r => r.sessionId).filter(Boolean))]

  const [progDocs, sessDocs] = await Promise.all([
    Promise.all(programIds.map(id => getDoc('programs', id))),
    Promise.all(sessionIds.map(id => getDoc('sessions', id))),
  ])

  const programs = Object.fromEntries(progDocs.filter(Boolean).map(d => [d.id, d]))
  const sessions = Object.fromEntries(sessDocs.filter(Boolean).map(d => [d.id, d]))

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrations: regs, programs, sessions }),
  }
}
