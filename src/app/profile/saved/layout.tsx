import type { Metadata } from 'next';

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://vibe.swaniki.com').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Liked & Saved Events · Vibe',
  description: 'View your saved events, bookmarked concerts, and upcoming gatherings on Vibe.',
  alternates: {
    canonical: `${baseUrl}/profile/saved`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SavedEventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
