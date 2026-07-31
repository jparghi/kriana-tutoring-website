const PROJECT_ID = process.env.FIREBASE_PROJECT_ID
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`
const HOLD_HOURS = 24
const LEGACY_ENDPOINT_RETIRED = true

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

exports.handler = async function () {
  if (LEGACY_ENDPOINT_RETIRED) {
    return { statusCode: 200, body: JSON.stringify({ disabled: true, reason: 'Legacy e-transfer holds are retired.' }) }
  }
  if (process.env.BOOKING_FLOW_MODE !== 'legacy_payments') {
    console.log('Legacy e-transfer hold expiry is disabled in the current booking mode.')
    return { statusCode: 200, body: JSON.stringify({ disabled: true, expired: 0 }) }
  }

  if (!PROJECT_ID) {
    console.error('FIREBASE_PROJECT_ID not set')
    return { statusCode: 500, body: 'FIREBASE_PROJECT_ID not set' }
  }

  const cutoff = new Date(Date.now() - HOLD_HOURS * 60 * 60 * 1000).toISOString()

  const pending = await runQuery({
    from: [{ collectionId: 'registrations' }],
    where: {
      compositeFilter: {
        op: 'AND',
        filters: [
          {
            fieldFilter: {
              field: { fieldPath: 'paymentMethod' },
              op: 'EQUAL',
              value: { stringValue: 'etransfer' },
            },
          },
          {
            fieldFilter: {
              field: { fieldPath: 'registrationStatus' },
              op: 'EQUAL',
              value: { stringValue: 'Pending Payment' },
            },
          },
        ],
      },
    },
  })

  if (pending.length === 0) {
    console.log('No pending e-transfer holds to expire.')
    return { statusCode: 200, body: JSON.stringify({ expired: 0 }) }
  }

  const now = new Date().toISOString()
  let expired = 0

  await Promise.all(
    pending.map(async (reg) => {
      if (!reg.createdAt || new Date(reg.createdAt).toISOString() > cutoff) return
      await patchDoc('registrations', reg.id, {
        registrationStatus: 'Expired',
        updatedAt: now,
      })
      expired++
    })
  )

  console.log(`Expired ${expired} e-transfer holds.`)
  return { statusCode: 200, body: JSON.stringify({ expired }) }
}
