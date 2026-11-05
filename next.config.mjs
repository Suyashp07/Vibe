/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
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
        source: '/discover',
        destination: '/',
        permanent: true,
      },
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
    ];
  },
  async rewrites() {
    const adminSecret = (process.env.NEXT_PUBLIC_ADMIN_ROUTE_PREFIX || 'control-99f').replace(/^\//, '').trim();
    return [
      {
        source: `/${adminSecret}`,
        destination: '/admin',
      },
      {
        source: `/${adminSecret}/:path*`,
        destination: '/admin/:path*',
      },
    ];
  },
};

export default nextConfig;
