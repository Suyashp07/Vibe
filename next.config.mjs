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
};

export default nextConfig;
