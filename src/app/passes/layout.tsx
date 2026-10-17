import type { Metadata } from 'next';

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://vibe.swaniki.com').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'My Passes & RSVP Tickets',
  description: 'Access your verified admission passes, dynamic entry QR codes, and event coordinates on Vibe.',
  alternates: {
    canonical: `${baseUrl}/passes`,
  },
  robots: {
    index: false, // User private tickets/passes shouldn't be indexed by public search bots
    follow: true,
  },
};

export default function PassesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
