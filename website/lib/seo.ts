export const siteUrl = "https://www.krianatutoring.com";

export function toJsonLd<T>(data: T) {
  return JSON.stringify(data);
}

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "TutoringService",
  "@id": `${siteUrl}/#organization`,
  name: "Kriana Tutoring",
  url: siteUrl,
  image: `${siteUrl}/images/kriana-logo-icon-large.png`,
  logo: `${siteUrl}/images/kriana-logo-icon-large.png`,
  telephone: "+1-613-400-6921",
  email: "info@krianatutoring.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "205 Metric Circle",
    addressLocality: "Stittsville",
    addressRegion: "ON",
    postalCode: "K2V 0C1",
    addressCountry: "CA"
  },
  areaServed: ["Ottawa", "Kanata", "Stittsville"],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "16:00",
      closes: "21:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Sunday",
      opens: "09:00",
      closes: "17:00"
    }
  ],
  sameAs: [
    "https://www.instagram.com/krianatutoring/",
    "https://www.facebook.com/profile.php?id=61559123522942"
  ],
  priceRange: "$$"
};
