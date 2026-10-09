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
import AutoLocationDetector from '@/components/location/AutoLocationDetector';
import SmoothScroll from '@/components/common/SmoothScroll';
import AmbientBackground from '@/components/common/AmbientBackground';
import { ThemeProvider } from '@/components/common/ThemeContext';
import SplashScreen from '@/components/common/SplashScreen';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0F172A',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://vibe-seven-pied.vercel.app'),
  title: 'Vibe by Swaniki — Whitelabel Event Network',
  description: 'Design, distribute, and collect RSVPs for boutique cultural gatherings, tech summits, and live mixers across India with AI verification.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vibe',
  },
  other: {
    'mobile-web-app-capable': 'yes',
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${inter.variable} ${outfit.variable} ${jakarta.variable} ${playfair.variable} ${fraunces.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('vibe-theme');
                if (storedTheme === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.style.colorScheme = 'light';
                } else {
                  document.documentElement.classList.remove('light');
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.style.colorScheme = 'dark';
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#050505] text-[#F3F4F6] antialiased pb-16 md:pb-0 selection:bg-[#FF5500] selection:text-white relative">
        <ThemeProvider>
          <SplashScreen />
          <AmbientBackground />
          <SmoothScroll>
            <div className="relative z-10">
              {children}
            </div>
          </SmoothScroll>
          <PWARegister />
          <AutoLocationDetector />
        </ThemeProvider>
      </body>
    </html>
  );
}
