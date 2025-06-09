/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@research-os/db', '@research-os/ai'],
  experimental: {
    esmExternals: true,
  },
  // Ensure environment variables are available
  env: {
    // These will be available on both client and server
    // But we'll use server-only env vars for sensitive data
  },
};

// Log environment variables during build/dev for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('Next.js config - Environment check:');
  console.log('NEO4J_URI:', process.env.NEO4J_URI || 'NOT SET');
  console.log('NEO4J_USERNAME:', process.env.NEO4J_USERNAME || 'NOT SET');
  console.log('NEO4J_PASSWORD:', process.env.NEO4J_PASSWORD ? '***SET***' : 'NOT SET');
}

export default nextConfig;
