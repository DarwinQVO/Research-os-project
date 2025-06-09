import { NextResponse } from 'next/server';
import { getDriver, resetDriver } from '@research-os/db';
import { env } from '../../../lib/env';

export async function GET() {
  try {
    // Log environment variables for debugging
    console.log('Environment variables check:');
    console.log('NEO4J_URI:', env.NEO4J_URI || 'NOT SET');
    console.log('NEO4J_USERNAME:', env.NEO4J_USERNAME || 'NOT SET');
    console.log('NEO4J_PASSWORD:', env.NEO4J_PASSWORD ? '***' : 'NOT SET');
    
    // Reset driver to ensure fresh connection with current env vars
    resetDriver();
    
    // Pasamos las variables de entorno explícitamente
    const driver = getDriver({
      uri: env.NEO4J_URI,
      username: env.NEO4J_USERNAME,
      password: env.NEO4J_PASSWORD
    });
    const session = driver.session();
    
    try {
      // Consulta más simple para verificar la conexión
      const result = await session.run('RETURN 1 as test');
      
      // Si llegamos aquí, la conexión funcionó
      return NextResponse.json({
        status: 'connected',
        message: 'Successfully connected to Neo4j',
        timestamp: new Date().toISOString(),
        test: result.records[0].get('test').toNumber(),
        connection: {
          uri: env.NEO4J_URI || 'not set',
          username: env.NEO4J_USERNAME || 'not set'
        }
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Neo4j connection error:', error);
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        uri: env.NEO4J_URI || 'NOT SET',
        username: env.NEO4J_USERNAME || 'NOT SET',
        passwordSet: !!env.NEO4J_PASSWORD,
        timestamp: new Date().toISOString(),
        errorStack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
} 
