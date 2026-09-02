import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// ─── Fonts ────────────────────────────────────────────────────────────────────

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "CryptoViz — Live Crypto Market Dashboard",
    template: "%s | CryptoViz",
  },
  description:
    "Real-time cryptocurrency prices, market caps, and portfolio tracking. Built with Next.js, TypeScript, and the CoinGecko API.",
  keywords: [
    "crypto",
    "cryptocurrency",
    "bitcoin",
    "ethereum",
    "market dashboard",
    "portfolio tracker",
    "live prices",
  ],
  authors: [{ name: "CryptoViz" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "CryptoViz — Live Crypto Market Dashboard",
    description:
      "Real-time cryptocurrency prices, market caps, and portfolio tracking.",
    siteName: "CryptoViz",
  },
  twitter: {
    card: "summary_large_image",
    title: "CryptoViz — Live Crypto Market Dashboard",
    description:
      "Real-time cryptocurrency prices, market caps, and portfolio tracking.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F172A",
};

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        {/* Skip-to-content for keyboard / screen reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50
                     focus:px-4 focus:py-2 focus:rounded-lg focus:text-white focus:text-sm focus:font-medium"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          Skip to main content
        </a>

        <div id="main-content" className="flex flex-col min-h-dvh">
          {children}
        </div>

        {/* Portal target for modals and toasts */}
        <div id="portal-root" aria-live="polite" />
      </body>
    </html>
  );
}
