/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static optimization for faster builds and better performance
  reactStrictMode: true,
  
  // Improve static asset handling
  poweredByHeader: false,
  
  // Configure image optimization
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/**',
      },
    ],
  },
  
  // Optimize output for better performance
  // swcMinify: true,
  
  // Configure webpack for better asset handling
  webpack: (config, { isServer }) => {
    // Optimize asset loading
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      type: 'asset/resource',
    });
    
    return config;
  },
  
  // Improve static asset caching
  headers: async () => {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Ensure proper error handling
  onDemandEntries: {
    // Keep the build page in memory for longer
    maxInactiveAge: 60 * 60 * 1000,
    // Number of pages to keep in memory
    pagesBufferLength: 5,
  },
};

module.exports = nextConfig;
