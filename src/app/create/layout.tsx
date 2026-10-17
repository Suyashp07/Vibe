import type { Metadata } from 'next';

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://vibe.swaniki.com').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Host an Event · Create with AI or Manual Studio',
  description:
    'Design, distribute, and publish editorial event landing pages in seconds. AI poster ingestion, instant RSVP ticketing, and multi-channel distribution across India.',
  keywords: [
    'create event',
    'host event',
    'event management india',
    'ai event generator',
    'publish event page',
    'sell tickets',
    'rsvp management',
  ],
  alternates: {
    canonical: `${baseUrl}/create`,
  },
  openGraph: {
    title: 'Host an Event · Vibe by Swaniki Studio',
    description:
      'Design, distribute, and publish editorial event landing pages in seconds with AI verification and instant passes.',
    url: `${baseUrl}/create`,
  },
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
