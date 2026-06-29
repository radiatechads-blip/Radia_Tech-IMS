import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteFrame from "@/components/SiteFrame";
import PopupModal from "@/components/PopupModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default:
      "Radiatech Electra – Leading Fire & Safety Solutions Provider in India",
    template: "%s | Radiatech Electra",
  },
  description:
    "Radiatech Electra delivers advanced Fire Protection, Fire Detection, Hydrant, Sprinkler, and Integrated Safety Solutions designed to protect lives, property, and critical infrastructure with quality, reliability, and professional execution.",
  keywords: [
    "Fire Protection",
    "Fire Detection",
    "Hydrant Systems",
    "Sprinkler Systems",
    "Integrated Safety Solutions",
    "Radiatech Electra",
    "Fire Safety India",
    "Industrial Fire Safety",
    "Critical Infrastructure Protection",
    "Quality Fire Safety Solutions",
    "Reliable Fire Safety Equipment",
  ],
  authors: [{ name: "Radiatech Electra Private Limited" }],
  creator: "Radiatech Electra",
  publisher: "Radiatech Electra Private Limited",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://radiatech.in",
  ),
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/favicon.png", type: "image/png" }],
    shortcut: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Radiatech Electra",
    title: "Radiatech Electra – Leading Fire & Safety Solutions Provider in India",
    description:
      "Radiatech Electra delivers advanced Fire Protection, Fire Detection, Hydrant, Sprinkler, and Integrated Safety Solutions designed to protect lives, property, and critical infrastructure with quality, reliability, and professional execution.",
    images: [
      {
        url: "/LOGO.png",
        width: 512,
        height: 512,
        alt: "Radiatech Electra Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Radiatech Electra – Leading Fire & Safety Solutions Provider in India",
    description:
      "Radiatech Electra delivers advanced Fire Protection, Fire Detection, Hydrant, Sprinkler, and Integrated Safety Solutions designed to protect lives, property, and critical infrastructure with quality, reliability, and professional execution.",
    images: ["/LOGO.png"],
  },
  robots: { index: true, follow: true },
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://radiatech.in";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["Organization", "LocalBusiness"],
  "@id": `${siteUrl}/#organization`,
  name: "Radiatech Electra Private Limited",
  url: siteUrl,
  logo: {
    "@type": "ImageObject",
    url: `${siteUrl}/LOGO.png`,
    width: 512,
    height: 512,
  },
  image: `${siteUrl}/LOGO.png`,
  description:
    "Radiatech Electra delivers advanced Fire Protection, Fire Detection, Hydrant, Sprinkler, and Integrated Safety Solutions designed to protect lives, property, and critical infrastructure with quality, reliability, and professional execution.",
  foundingDate: "2026",
  telephone: "+91-8178850959",
  email: "radiatechelectra@gmail.com",
  priceRange: "$$",
  openingHours: "Mo-Sa 09:00-19:00",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-8178850959",
    contactType: "sales",
    areaServed: "IN",
    availableLanguage: ["English", "Hindi"],
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "D block, D-93, D Block, Sector 10",
    addressLocality: "Noida",
    addressRegion: "Uttar Pradesh",
    postalCode: "201301",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 28.5706,
    longitude: 77.3219,
  },
  sameAs: [
    "https://www.facebook.com/Radiatechelectra/",
    "https://www.instagram.com/radia.tech?igsh=MTIwNzNkMG9tYmpvbg==",
    "https://www.indiamart.com/radiatechelectra/",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  void children;
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full bg-white text-[#111] antialiased">
        {/* <div style={{ fontFamily: "sans-serif", color: "#111", textAlign: "center" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Please contact to developer</p>
          <p style={{ fontSize: "1.5rem" }}>📞 7239066492</p>
        </div> */}
        <SiteFrame>
          {/* <PopupModal /> */}
          {children}
        </SiteFrame>
      </body>
    </html>
  );
}
