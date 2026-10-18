import type { Metadata } from 'next';

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://vibe.swaniki.com').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'My Profile & Community Identity · Vibe',
  description: 'Manage your verified profile, community credentials, booked passes, and hosted vibes on Vibe.',
  alternates: {
    canonical: `${baseUrl}/profile`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
