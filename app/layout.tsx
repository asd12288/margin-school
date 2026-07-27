import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { ConsentBanner } from "@/components/consent-banner";
import { ThemeProvider } from "@/components/theme-provider";
import { AnalyticsProvider } from "@/lib/analytics/posthog-provider";

/**
 * Two faces, two jobs.
 *
 * Inter runs everything — interface and lesson body alike. Headings separate
 * themselves by weight and tight tracking rather than by a second typeface,
 * which is what keeps the product looking current and the font payload at two
 * files. JetBrains Mono is for figures, symbols and code.
 *
 * Both are self-hosted at build time by `next/font`, so no request ever
 * reaches Google from a user's browser. That is what keeps them compatible
 * with the EU-processor rule in AGENTS.md.
 *
 * `latin-ext` matters: French needs the accented glyphs, and without the
 * subset they fall back to a system face mid-sentence.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Margin School",
  description: "Learn the financial markets, from the beginning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // next-themes writes the theme class on <html> before paint; without
      // this React warns that the server and client markup disagree.
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <AnalyticsProvider>{children}</AnalyticsProvider>
          <ConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
