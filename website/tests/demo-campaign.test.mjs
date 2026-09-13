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

test('resolveDemoCampaignOffering returns full (with offering details) when public booking is paused while seats remain', async () => {
  process.env.DEMO_CAMPAIGN_PROGRAM_ID = TEST_PROGRAM_ID
  process.env.DEMO_CAMPAIGN_OFFERING_ID = TEST_OFFERING_ID
  const db = fakeDb({
    [`programs/${TEST_PROGRAM_ID}`]: demoProgram(),
    [`programOfferings/${TEST_OFFERING_ID}`]: demoOffering({ capacity: 20, confirmedCount: 13, publicRegistrationPaused: true }),
  })
  const result = await resolveDemoCampaignOffering(db)
  assert.equal(result.status, 'full')
  assert.equal(result.waitlistOpen, false)
  assert.equal(result.offeringId, TEST_OFFERING_ID)
  assert.equal(result.offering.eventTitle, 'Young Engineers Demo Class — Kanata')
  delete process.env.DEMO_CAMPAIGN_PROGRAM_ID
  delete process.env.DEMO_CAMPAIGN_OFFERING_ID
})

test('resolveDemoCampaignOffering reports waitlistOpen only when the offering enables its waitlist', async () => {
  process.env.DEMO_CAMPAIGN_PROGRAM_ID = TEST_PROGRAM_ID
  process.env.DEMO_CAMPAIGN_OFFERING_ID = TEST_OFFERING_ID
  const db = fakeDb({
    [`programs/${TEST_PROGRAM_ID}`]: demoProgram(),
    [`programOfferings/${TEST_OFFERING_ID}`]: demoOffering({ publicRegistrationPaused: true, waitlistEnabled: true }),
  })
  const result = await resolveDemoCampaignOffering(db)
  assert.equal(result.status, 'full')
  assert.equal(result.waitlistOpen, true)
  delete process.env.DEMO_CAMPAIGN_PROGRAM_ID
  delete process.env.DEMO_CAMPAIGN_OFFERING_ID
})

test('resolveDemoCampaignOffering stays open when publicRegistrationPaused is absent or false', async () => {
  process.env.DEMO_CAMPAIGN_PROGRAM_ID = TEST_PROGRAM_ID
  process.env.DEMO_CAMPAIGN_OFFERING_ID = TEST_OFFERING_ID
  for (const overrides of [{}, { publicRegistrationPaused: false }, { publicRegistrationPaused: 'true' }]) {
    const db = fakeDb({
      [`programs/${TEST_PROGRAM_ID}`]: demoProgram(),
      [`programOfferings/${TEST_OFFERING_ID}`]: demoOffering(overrides),
    })
    const result = await resolveDemoCampaignOffering(db)
    assert.equal(result.status, 'open', JSON.stringify(overrides))
  }
  delete process.env.DEMO_CAMPAIGN_PROGRAM_ID
  delete process.env.DEMO_CAMPAIGN_OFFERING_ID
})

test('resolveDemoCampaignOffering returns unavailable (not full) for an unpublished full offering', async () => {
  process.env.DEMO_CAMPAIGN_PROGRAM_ID = TEST_PROGRAM_ID
  process.env.DEMO_CAMPAIGN_OFFERING_ID = TEST_OFFERING_ID
  const db = fakeDb({
    [`programs/${TEST_PROGRAM_ID}`]: demoProgram(),
    [`programOfferings/${TEST_OFFERING_ID}`]: demoOffering({ isPublished: false, publicRegistrationPaused: true, waitlistEnabled: true }),
  })
  const result = await resolveDemoCampaignOffering(db)
  assert.equal(result.status, 'unavailable')
  delete process.env.DEMO_CAMPAIGN_PROGRAM_ID
  delete process.env.DEMO_CAMPAIGN_OFFERING_ID
})

// ─── Lifecycle page state (DEMO_PAGE_STATES / DEMO_PAGE_STATE) ────────────

function withCampaignEnv(overrides, run) {
  process.env.DEMO_CAMPAIGN_PROGRAM_ID = TEST_PROGRAM_ID
  process.env.DEMO_CAMPAIGN_OFFERING_ID = TEST_OFFERING_ID
  if (overrides.pageState === undefined) delete process.env.DEMO_PAGE_STATE
  else process.env.DEMO_PAGE_STATE = overrides.pageState
  return run(fakeDb({
    [`programs/${TEST_PROGRAM_ID}`]: demoProgram(),
    [`programOfferings/${TEST_OFFERING_ID}`]: demoOffering(overrides.offering ?? {}),
  })).finally(() => {
    delete process.env.DEMO_CAMPAIGN_PROGRAM_ID
    delete process.env.DEMO_CAMPAIGN_OFFERING_ID
    delete process.env.DEMO_PAGE_STATE
  })
}

test('pageState is derived from the offering when DEMO_PAGE_STATE is unset', async () => {
  const cases = [
    [{}, 'registration_open'],
    [{ confirmedCount: 10 }, 'sold_out'],
    [{ publicRegistrationPaused: true }, 'sold_out'],
    [{ enrollmentOpenAt: PAST, enrollmentCloseAt: PAST }, 'completed'],
  ]
  for (const [offering, expected] of cases) {
    await withCampaignEnv({ offering }, async db => {
      const result = await resolveDemoCampaignOffering(db)
      assert.equal(result.pageState, expected, JSON.stringify(offering))
    })
  }
})

test('an unconfigured or unavailable campaign still renders the evergreen waitlist page', async () => {
  delete process.env.DEMO_CAMPAIGN_PROGRAM_ID
  delete process.env.DEMO_CAMPAIGN_OFFERING_ID
  assert.equal((await resolveDemoCampaignOffering()).pageState, 'waitlist')

  await withCampaignEnv({ offering: { isPublished: false } }, async db => {
    const result = await resolveDemoCampaignOffering(db)
    assert.equal(result.status, 'unavailable')
    assert.equal(result.pageState, 'waitlist')
  })
})

test('DEMO_PAGE_STATE pins the page state, and an unknown value is ignored', async () => {
  await withCampaignEnv({ pageState: 'completed' }, async db => {
    const result = await resolveDemoCampaignOffering(db)
    assert.equal(result.status, 'open')
    assert.equal(result.pageState, 'completed')
  })
  await withCampaignEnv({ pageState: 'SOLD_OUT' }, async db => {
    assert.equal((await resolveDemoCampaignOffering(db)).pageState, 'sold_out')
  })
  await withCampaignEnv({ pageState: 'auto' }, async db => {
    assert.equal((await resolveDemoCampaignOffering(db)).pageState, 'registration_open')
  })
  await withCampaignEnv({ pageState: 'nonsense' }, async db => {
    assert.equal((await resolveDemoCampaignOffering(db)).pageState, 'registration_open')
  })
})

// Presentation must never unlock a $10 CTA the booking endpoint would reject.
test('DEMO_PAGE_STATE cannot claim registration is open for an unbookable offering', async () => {
  await withCampaignEnv({ pageState: 'registration_open', offering: { enrollmentOpenAt: PAST, enrollmentCloseAt: PAST } }, async db => {
    const result = await resolveDemoCampaignOffering(db)
    assert.equal(result.pageState, 'completed')
  })
  await withCampaignEnv({ pageState: 'registration_open', offering: { confirmedCount: 10 } }, async db => {
    assert.equal((await resolveDemoCampaignOffering(db)).pageState, 'sold_out')
  })
})

test('waitlistOpen mirrors the offering switch on closed demos too', async () => {
  const closed = { enrollmentOpenAt: PAST, enrollmentCloseAt: PAST }
  await withCampaignEnv({ offering: { ...closed, waitlistEnabled: true } }, async db => {
    const result = await resolveDemoCampaignOffering(db)
    assert.equal(result.status, 'closed')
    assert.equal(result.waitlistOpen, true)
  })
  await withCampaignEnv({ offering: closed }, async db => {
    assert.equal((await resolveDemoCampaignOffering(db)).waitlistOpen, false)
  })
})
