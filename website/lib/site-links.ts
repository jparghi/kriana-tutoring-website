import { PROGRAM_CATEGORIES } from "./booking";

// Centralized booking + partner destinations so marketing surfaces (nav, hero,
// program cards, robotics landing page) never hardcode a URL independently.

export const BOOKING_PATH = "/booking";
export const ROBOTICS_PATH = "/robotics";
export const BIRTHDAY_PARTY_PATH = "/birthday";

export const ROBOTICS_CATEGORY: (typeof PROGRAM_CATEGORIES)[number] = "Robotics";

export function bookingUrlForCategory(category: (typeof PROGRAM_CATEGORIES)[number]) {
  return `${BOOKING_PATH}?category=${encodeURIComponent(category)}`;
}

export const ROBOTICS_BOOKING_URL = bookingUrlForCategory(ROBOTICS_CATEGORY);
export const SUMMER_CAMP_BOOKING_URL = bookingUrlForCategory("Summer Camp");
export const PA_DAY_BOOKING_URL = bookingUrlForCategory("PA Day Workshop");
export const BIRTHDAY_PARTY_BOOKING_URL = bookingUrlForCategory("Birthday Party");
export const SCHOOL_PROGRAM_BOOKING_URL = bookingUrlForCategory("After School");

// Official Young Engineers site — secondary/credibility link only.
// Must never be used as the primary robotics discovery or registration CTA.
export const YOUNG_ENGINEERS_URL = "https://kanata.youngengineers.org/";
