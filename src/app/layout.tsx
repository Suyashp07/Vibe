import type { Metadata, Viewport } from 'next';
import { Inter, Outfit, Bricolage_Grotesque } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
  weight: ['400', '600', '700', '800'],
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['400', '600', '700'],
});


import PWARegister from '@/components/pwa/PWARegister';
import AutoLocationDetector from '@/components/location/AutoLocationDetector';
import SmoothScroll from '@/components/common/SmoothScroll';
import AmbientBackground from '@/components/common/AmbientBackground';
import { ThemeProvider } from '@/components/common/ThemeContext';
import SplashScreen from '@/components/common/SplashScreen';
import ScrollResetManager from '@/components/common/ScrollResetManager';
import PlatformTelemetry from '@/components/common/PlatformTelemetry';
import GlobalToast from '@/components/common/GlobalToast';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#081426' },
  ],
};

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://vibe.swaniki.com').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(appUrl.startsWith('http') ? appUrl : `https://${appUrl}`),
  title: {
    default: 'Vibe by Swaniki — Whitelabel Event Network & Discovery in India',
    template: '%s | Vibe by Swaniki',
  },
  description:
    'Discover, host, and book tickets for boutique cultural gatherings, live music gigs, sports tournaments, comedy nights, and tech mixers across Mumbai, Pune, Bengaluru, Delhi, Hyderabad, and all of India.',
  keywords: [
    'events in india',
    'events in pune',
    'events in mumbai',
    'events in bengaluru',
    'events in delhi',
    'events in hyderabad',
    'book event tickets',
    'vibe events',
    'vibe instant',
    'live concerts',
    'standup comedy',
    'box cricket tournament',
    'casual meetups',
    'rsvp events',
    'swaniki',
    'cultural gatherings',
    'weekend events',
  ],
  authors: [{ name: 'Swaniki', url: 'https://vibe.swaniki.com' }],
  creator: 'Swaniki',
  publisher: 'Swaniki',
  category: 'events',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vibe',
  },
  alternates: {
    canonical: appUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  applicationName: 'Vibe by Swaniki',
  openGraph: {
    title: 'Vibe by Swaniki — Whitelabel Event Experiences & Discovery in India',
    description:
      'Design, distribute, and collect RSVPs for boutique cultural gatherings, tech summits, live music, and sports meetups across India with instant verification.',
    url: appUrl,
    siteName: 'Vibe by Swaniki',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${appUrl}/api/og/home?title=${encodeURIComponent('Vibe by Swaniki — Live Events & Experiences')}`,
        width: 1200,
        height: 630,
        alt: 'Vibe by Swaniki — Event Experiences Across India',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vibe by Swaniki — Whitelabel Event Network',
    description:
      'Discover and host live music gigs, sports meetups, comedy nights, and tech mixers across India with instant RSVP passes.',
    images: [`${appUrl}/api/og/home?title=${encodeURIComponent('Vibe by Swaniki — Live Events & Experiences')}`],
    site: '@Swaniki',
    creator: '@Swaniki',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'geo.region': 'IN-MH',
    'geo.placename': 'India',
    'geo.position': '18.5204;73.8567',
    ICBM: '18.5204, 73.8567',
  },
  verification: {
    google: 'efYPXRqMmfejlgLLbg_N7wtuUEmZNCUViZ1AHlSN7Lk',
  },
};

const jsonLdWebsite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Vibe by Swaniki',
  alternateName: ['Vibe', 'Vibe Events', 'Swaniki Vibe'],
  url: 'https://vibe.swaniki.com',
  description:
    'Discover, host, and book tickets for boutique cultural gatherings, live music gigs, sports tournaments, comedy nights, and tech mixers across India.',
  inLanguage: 'en-IN',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://vibe.swaniki.com/?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

const jsonLdOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Vibe by Swaniki',
  url: 'https://vibe.swaniki.com',
  logo: 'https://vibe.swaniki.com/icons/icon-512.png',
  sameAs: ['https://swaniki.com'],
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
      className={`light ${inter.variable} ${bricolage.variable} ${outfit.variable}`}
    >
      <head>
        {/* Google Knowledge Graph & Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('vibe-theme');
                if (storedTheme === 'dark') {
                  document.documentElement.classList.remove('light');
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch (e) {}
            `,
          }}
        />
        {/* Synchronous early capture of beforeinstallprompt and immediate ServiceWorker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                window.__vibe_deferred_prompt = null;
                window.addEventListener('beforeinstallprompt', function(e) {
                  e.preventDefault();
                  window.__vibe_deferred_prompt = e;
                  try {
                    window.dispatchEvent(new CustomEvent('vibe:deferred_prompt_ready'));
                  } catch (_) {}
                });
                window.addEventListener('appinstalled', function() {
                  window.__vibe_deferred_prompt = null;
                  try {
                    window.dispatchEvent(new CustomEvent('vibe:app_installed'));
                  } catch (_) {}
                });
                if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#081426] text-[#F8FAFC] antialiased pb-16 md:pb-0 selection:bg-[#08B9F5] selection:text-white relative">
        <ThemeProvider>
          <ScrollResetManager />
          <SplashScreen />
          <AmbientBackground />
          <SmoothScroll>
            <div className="relative z-10">
              {children}
            </div>
          </SmoothScroll>
          <PWARegister />
          <AutoLocationDetector />
          <PlatformTelemetry />
          <GlobalToast />
        </ThemeProvider>
      </body>
    </html>
  );
}
