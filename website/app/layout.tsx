import type { Metadata } from "next";
import { Jost, Open_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { NavigationBar } from "../components/navigation-bar";
import { ScrollToTopButton } from "../components/scroll-to-top-button";
import { localBusinessSchema, toJsonLd } from "../lib/seo";
import "./globals.css";

const jost = Jost({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-heading" });
const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });

export const metadata: Metadata = {
  title: {
    default: "Kriana Tutoring Center",
    template: "%s · Kriana Tutoring"
  },
  description: "A modern, AI-ready tutoring experience inspired by The7 Online Courses demo.",
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
    title: "Kriana Tutoring Center",
    description: "A modern, AI-ready tutoring experience inspired by The7 Online Courses demo.",
    url: "https://www.krianatutoring.com",
    images: [
      {
        url: "/images/kriana-logo-icon-large.png",
        width: 1024,
        height: 1024,
        alt: "Kriana Tutoring logo"
      }
    ]
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
        <NavigationBar />
        {children}
        <ScrollToTopButton />
      </body>
    </html>
  );
}
