import { NextResponse } from 'next/server';

export async function GET() {
  // Return environment variables (with password masked)
  return NextResponse.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEO4J_URI: process.env.NEO4J_URI || 'NOT SET',
      NEO4J_USERNAME: process.env.NEO4J_USERNAME || 'NOT SET',
      NEO4J_PASSWORD: process.env.NEO4J_PASSWORD ? '***SET***' : 'NOT SET',
      // Check if .env.local is being loaded
      envFileLoaded: !!(process.env.NEO4J_URI && process.env.NEO4J_USERNAME && process.env.NEO4J_PASSWORD)
    },
    runtime: {
      isServer: typeof window === 'undefined',
      cwd: process.cwd(),
      timestamp: new Date().toISOString()
    }
  });
}