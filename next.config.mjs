/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@supabase/supabase-js', '@supabase/ssr', '@supabase/auth-js'],
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'jqnwlafvsfnqwdkmquwt.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'jrnwlafvsfnqwdkmquwt.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
  },
  async redirects() {
    return [
      {
        source: '/guest',
        destination: '/passes',
        permanent: true,
      },
      {
        source: '/vibe',
        destination: '/vibes',
        permanent: true,
      },
      {
        source: '/admin/scanner',
        destination: '/organizer/check-in',
        permanent: true,
      },
      {
        source: '/admin/events',
        destination: '/admin',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/discover',
        destination: '/',
      },
    ];
  },
};

export default nextConfig;
