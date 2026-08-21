import test from 'node:test'
import assert from 'node:assert/strict'

process.env.DEMO_ELIGIBILITY_KEY_SALT = 'test-demo-eligibility-salt-0123456789'

import { getDemoCampaignConfig, resolveDemoCampaignOffering } from '../lib/demo-campaign.server.js'
import { DEMO_ELIGIBLE_PROGRAM_IDS } from '../lib/demo-eligibility.js'

const TEST_PROGRAM_ID = DEMO_ELIGIBLE_PROGRAM_IDS[0]
const TEST_OFFERING_ID = 'demo-campaign-off-1'
const NOW = Date.now()
const FUTURE = new Date(NOW + 30 * 24 * 60 * 60 * 1000).toISOString()
const PAST = new Date(NOW - 30 * 24 * 60 * 60 * 1000).toISOString()

function demoProgram(overrides = {}) {
  return { title: 'Smartivo', isActive: true, publicCatalogVersion: 1, demoEligible: true, ageRange: '6-12', ...overrides }
}

function demoOffering(overrides = {}) {
  return {
    programId: TEST_PROGRAM_ID,
    offeringType: 'demo',
    publicCatalogVersion: 1,
    isPublished: true,
    status: 'Open',
    capacity: 10,
    confirmedCount: 0,
    heldCount: 0,
    enrollmentOpenAt: PAST,
    enrollmentCloseAt: FUTURE,
    eventTitle: 'Young Engineers Demo Class — Kanata',
    eventStartAt: '2026-09-12T10:30:00-04:00',
    eventEndAt: '2026-09-12T11:30:00-04:00',
    timezone: 'America/Toronto',
    location: 'Hazeldean Library, 50 Castlefrank Road, Ottawa, ON K2L 2N5',
    ...overrides,
  }
}

// resolveDemoCampaignOffering() accepts an injectable db — see
// lib/demo-campaign.server.js's comment on why (ESM namespaces are frozen,
// so getAdminDb can't be monkey-patched from outside like a CommonJS
// export). This is a minimal fake exposing only .collection(name).doc(id).get().
function fakeDb(docs) {
  return {
    collection(name) {
      return {
        doc(id) {
          return {
            async get() {
              const data = docs[`${name}/${id}`]
              return { exists: data != null, data: () => data }
            },
          }
        },
      }
    },
  }
}

test('getDemoCampaignConfig returns null when either env var is unset', () => {
  delete process.env.DEMO_CAMPAIGN_PROGRAM_ID
  delete process.env.DEMO_CAMPAIGN_OFFERING_ID
  assert.equal(getDemoCampaignConfig(), null)

  process.env.DEMO_CAMPAIGN_PROGRAM_ID = TEST_PROGRAM_ID
  assert.equal(getDemoCampaignConfig(), null)

  process.env.DEMO_CAMPAIGN_OFFERING_ID = TEST_OFFERING_ID
  assert.deepEqual(getDemoCampaignConfig(), { programId: TEST_PROGRAM_ID, offeringId: TEST_OFFERING_ID })

  delete process.env.DEMO_CAMPAIGN_PROGRAM_ID
  delete process.env.DEMO_CAMPAIGN_OFFERING_ID
})

test('resolveDemoCampaignOffering returns unconfigured when env vars are unset', async () => {
  delete process.env.DEMO_CAMPAIGN_PROGRAM_ID
  delete process.env.DEMO_CAMPAIGN_OFFERING_ID
  const result = await resolveDemoCampaignOffering()
  assert.equal(result.status, 'unconfigured')
})

test('resolveDemoCampaignOffering returns open for a valid, published, in-window offering', async () => {
  process.env.DEMO_CAMPAIGN_PROGRAM_ID = TEST_PROGRAM_ID
  process.env.DEMO_CAMPAIGN_OFFERING_ID = TEST_OFFERING_ID
  const db = fakeDb({
    [`programs/${TEST_PROGRAM_ID}`]: demoProgram(),
    [`programOfferings/${TEST_OFFERING_ID}`]: demoOffering(),
  })
  const result = await resolveDemoCampaignOffering(db)
  assert.equal(result.status, 'open')
  assert.equal(result.programId, TEST_PROGRAM_ID)
  assert.equal(result.offeringId, TEST_OFFERING_ID)
  assert.equal(result.offering.eventTitle, 'Young Engineers Demo Class — Kanata')
  delete process.env.DEMO_CAMPAIGN_PROGRAM_ID
  delete process.env.DEMO_CAMPAIGN_OFFERING_ID
})

test('resolveDemoCampaignOffering returns unavailable when the offering doc does not exist', async () => {
  process.env.DEMO_CAMPAIGN_PROGRAM_ID = TEST_PROGRAM_ID
  process.env.DEMO_CAMPAIGN_OFFERING_ID = TEST_OFFERING_ID
  const db = fakeDb({ [`programs/${TEST_PROGRAM_ID}`]: demoProgram() })
  const result = await resolveDemoCampaignOffering(db)
  assert.equal(result.status, 'unavailable')
  delete process.env.DEMO_CAMPAIGN_PROGRAM_ID
  delete process.env.DEMO_CAMPAIGN_OFFERING_ID
})

test('resolveDemoCampaignOffering returns unavailable when the offering is not published', async () => {
  process.env.DEMO_CAMPAIGN_PROGRAM_ID = TEST_PROGRAM_ID
  process.env.DEMO_CAMPAIGN_OFFERING_ID = TEST_OFFERING_ID
  const db = fakeDb({
    [`programs/${TEST_PROGRAM_ID}`]: demoProgram(),
    [`programOfferings/${TEST_OFFERING_ID}`]: demoOffering({ isPublished: false }),
  })
  const result = await resolveDemoCampaignOffering(db)
  assert.equal(result.status, 'unavailable')
  delete process.env.DEMO_CAMPAIGN_PROGRAM_ID
  delete process.env.DEMO_CAMPAIGN_OFFERING_ID
})

test('resolveDemoCampaignOffering returns full when capacity is exhausted', async () => {
  process.env.DEMO_CAMPAIGN_PROGRAM_ID = TEST_PROGRAM_ID
  process.env.DEMO_CAMPAIGN_OFFERING_ID = TEST_OFFERING_ID
  const db = fakeDb({
    [`programs/${TEST_PROGRAM_ID}`]: demoProgram(),
    [`programOfferings/${TEST_OFFERING_ID}`]: demoOffering({ confirmedCount: 10 }),
  })
  const result = await resolveDemoCampaignOffering(db)
  assert.equal(result.status, 'full')
  delete process.env.DEMO_CAMPAIGN_PROGRAM_ID
  delete process.env.DEMO_CAMPAIGN_OFFERING_ID
})

test('resolveDemoCampaignOffering returns closed when enrollmentCloseAt is in the past', async () => {
  process.env.DEMO_CAMPAIGN_PROGRAM_ID = TEST_PROGRAM_ID
  process.env.DEMO_CAMPAIGN_OFFERING_ID = TEST_OFFERING_ID
  const db = fakeDb({
    [`programs/${TEST_PROGRAM_ID}`]: demoProgram(),
    [`programOfferings/${TEST_OFFERING_ID}`]: demoOffering({ enrollmentOpenAt: PAST, enrollmentCloseAt: PAST }),
  })
  const result = await resolveDemoCampaignOffering(db)
  assert.equal(result.status, 'closed')
  delete process.env.DEMO_CAMPAIGN_PROGRAM_ID
  delete process.env.DEMO_CAMPAIGN_OFFERING_ID
})
