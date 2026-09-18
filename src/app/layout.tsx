import type { Metadata, Viewport } from 'next';
import { Inter, Outfit, Plus_Jakarta_Sans, Playfair_Display, Fraunces } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['400', '600', '700', '800', '900'],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['600', '700', '800'],
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

import PWARegister from '@/components/pwa/PWARegister';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#E8621A',
};

export const metadata: Metadata = {
  title: 'Vibe by Swaniki — Whitelabel Events & Experiences',
  description: 'India-first, lightweight, premium event platform with AI copy generation, 5 editorial templates, and instant branded social share banners.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vibe',
  },
  applicationName: 'Vibe by Swaniki',
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
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${jakarta.variable} ${playfair.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-surface-2 text-ink antialiased pb-16 md:pb-0">
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
