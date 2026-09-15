import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display, Fraunces } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '600', '700', '900'],
  style: ['normal', 'italic'],
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['400', '600', '700', '900'],
  style: ['normal', 'italic'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0A0A',
};

export const metadata: Metadata = {
  title: 'Vibe by Swaniki — Whitelabel Events & Experiences',
  description: 'India-first, lightweight, premium event platform with AI copy generation, 5 editorial templates, and instant branded social share banners.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vibe',
  },
  openGraph: {
    title: 'Vibe by Swaniki — Create events that feel alive',
    description: 'Whitelabel event pages with editorial warmth, live RSVP tracking, and AI-powered storytelling.',
    siteName: 'Vibe by Swaniki',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-surface-2 text-ink antialiased pb-16 md:pb-0">
        {children}
      </body>
    </html>
  );
}
