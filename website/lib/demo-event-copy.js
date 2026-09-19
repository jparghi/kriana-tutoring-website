// Customer-facing wording for an event, chosen by its eventType so the same
// /demo hub, register form and emails can serve demos and workshops without
// hardcoding either word. Plain .js, no imports — shared by the server-rendered
// page, the client register page and the Netlify email functions.
//
// eventType is a plain string on the event/offering: 'DEMO' (default when
// absent) or any *_WORKSHOP value ('PD_DAY_WORKSHOP', 'STEM_WORKSHOP',
// 'HOLIDAY_WORKSHOP', …). Every workshop type shares the same wording; a new
// wording family only needs a new branch here.

const WORKSHOP = {
  kind: 'workshop',
  noun: 'workshop',
  Noun: 'Workshop',
  short: 'Workshop',
  reserveShort: 'Reserve a Workshop Spot',
  registrationTitle: 'Workshop Registration',
  chooseTime: 'Choose Your Workshop Time',
  waitlistLabel: 'Workshop Waitlist',
  thisEvent: 'This workshop',
  spot: 'workshop spot',
  oneTimeCharge: 'one-time workshop fee',
  priceTag: price => `${price} Workshop`,
  reserveLabel: price => `Reserve a Workshop Spot — ${price}`,
  registerHeading: price => `Register for the ${price} Workshop`,
  creditHeadline: price => `Your ${price} workshop fee is credited when you enroll.`,
  faqTitle: 'workshop',
}

const DEMO = {
  kind: 'demo',
  noun: 'demo class',
  Noun: 'Demo Class',
  short: 'Demo',
  reserveShort: 'Reserve a Demo Spot',
  registrationTitle: 'Demo Class Registration',
  chooseTime: 'Choose a session',
  waitlistLabel: 'Demo Waitlist',
  thisEvent: 'This demo',
  spot: 'demo spot',
  oneTimeCharge: 'one-time demo charge',
  priceTag: price => `${price} Demo Class`,
  reserveLabel: price => `Reserve My Child’s Spot — ${price}`,
  registerHeading: price => `Register for the ${price} Demo Class`,
  creditHeadline: price => `Try for ${price} — Demo is FREE when you enroll.`,
  faqTitle: 'demo',
}

export function eventTerms(eventType) {
  return /WORKSHOP/i.test(String(eventType ?? '')) ? WORKSHOP : DEMO
}
