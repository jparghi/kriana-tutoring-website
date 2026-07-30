import type { Metadata } from "next";
import { Jost, Open_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { NavigationBar } from "../components/navigation-bar";
import { ScrollToTopButton } from "../components/scroll-to-top-button";
import { localBusinessSchema, toJsonLd, websiteSchema } from "../lib/seo";
import "./globals.css";

const jost = Jost({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-heading" });
const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });

export const metadata: Metadata = {
  title: {
    default: "Kriana Tutoring | Ottawa's Personalized Tutoring for Kids",
    template: "%s · Kriana Tutoring"
  },
  description:
    "Personalized tutoring for kids JK–Grade 8 in Ottawa, Kanata & Stittsville. Math, reading, and science support — assessment-first and results-driven.",
  metadataBase: new URL("https://www.krianatutoring.com"),
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/images/kriana-favicon.ico", type: "image/x-icon" },
      { url: "/images/kriana-logo-icon-large.png", type: "image/png", sizes: "1024x1024" }
    ],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
    apple: [{ url: "/images/kriana-logo-icon-large.png", sizes: "180x180" }]
  },
  openGraph: {
    title: "Kriana Tutoring | Ottawa's Personalized Tutoring for Kids",
    description:
      "Personalized tutoring for kids JK–Grade 8 in Ottawa, Kanata & Stittsville. Assessment-first math, reading, and science support.",
    siteName: "Kriana Tutoring",
    type: "website",
    url: "https://www.krianatutoring.com",
    images: [
      {
        url: "/images/kriana-og-social.png",
        width: 1200,
        height: 630,
        alt: "Kriana Tutoring – Ottawa's personalized tutoring for kids JK–Grade 8"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Kriana Tutoring | Ottawa's Personalized Tutoring for Kids",
    description:
      "Personalized tutoring for kids JK–Grade 8 in Ottawa. Math, reading, and science support. Book a free consultation.",
    images: ["/images/kriana-og-social.png"]
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${jost.variable} ${openSans.variable}`}>
      <body className="min-h-screen bg-white text-slate-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(websiteSchema) }}
        />
        <NavigationBar />
        {children}
        <ScrollToTopButton />
      </body>
    </html>
  );
}
