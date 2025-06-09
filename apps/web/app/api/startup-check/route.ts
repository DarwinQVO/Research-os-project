import { NextResponse } from 'next/server';

// This runs when the API route is first loaded
console.log('=== Startup Check ===');
console.log('Process CWD:', process.cwd());
console.log('NEO4J_URI from process.env:', process.env.NEO4J_URI || 'NOT SET');
console.log('NEO4J_USERNAME from process.env:', process.env.NEO4J_USERNAME || 'NOT SET');
console.log('NEO4J_PASSWORD from process.env:', process.env.NEO4J_PASSWORD ? '***SET***' : 'NOT SET');
console.log('===================');

export async function GET() {
  return NextResponse.json({
    cwd: process.cwd(),
    env: {
      NEO4J_URI: process.env.NEO4J_URI || 'NOT SET',
      NEO4J_USERNAME: process.env.NEO4J_USERNAME || 'NOT SET',
      NEO4J_PASSWORD: process.env.NEO4J_PASSWORD ? '***SET***' : 'NOT SET'
    }
  });
}