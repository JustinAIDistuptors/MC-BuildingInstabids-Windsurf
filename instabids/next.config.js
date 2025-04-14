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
  
  // Development server configuration
  devIndicators: {
    position: 'bottom-right',
  },
  
  // Disable aggressive caching in development
  onDemandEntries: {
    // Keep pages in memory for only 10 seconds in development
    maxInactiveAge: 10 * 1000,
    // Poll for changes every 1 second
    pagesBufferLength: 1,
  },
};

module.exports = nextConfig;
