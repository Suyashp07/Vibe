import type { Metadata } from 'next';

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://vibe.swaniki.com').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Vibe Instant — Spontaneous Meetups & Live Event Reels',
  description:
    'Experience real-time flash meetups, full-screen event reels, box cricket games, acoustic jams, and spontaneous gatherings in your city on Vibe Instant.',
  keywords: [
    'vibe instant',
    'instant meetups',
    'flash events',
    'box cricket tonight',
    'casual gatherings',
    'spontaneous meetups',
    'event reels',
    'pune meetups',
    'mumbai meetups',
  ],
  alternates: {
    canonical: `${baseUrl}/vibes`,
  },
  openGraph: {
    title: 'Vibe Instant — Spontaneous Meetups & Event Reels',
    description:
      'Swipe full-screen live reels and join spontaneous meetups across India with 1-click RSVP passes.',
    url: `${baseUrl}/vibes`,
    siteName: 'Vibe by Swaniki',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vibe Instant — Live Flash Meetups & Event Reels',
    description: 'Join spontaneous flash gatherings and browse live reels in your city.',
  },
};

export default function VibesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
