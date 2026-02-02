import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'otgxxrnddkdjwnqmsgsp.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Experimental features
  experimental: {
    // Enable React Compiler (if needed)
    // reactCompiler: true,
  },

  // Strict mode for better development experience
  reactStrictMode: true,

  // Powered by header
  poweredByHeader: false,

  // Compression
  compress: true,
};

export default withNextIntl(nextConfig);
