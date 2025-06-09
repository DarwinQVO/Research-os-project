import { NextResponse } from 'next/server';
import { getDriver } from '@research-os/db';

export async function GET() {
  try {
    const driver = getDriver();
    const session = driver.session();
    
    try {
      // Check clients
      const clientsResult = await session.run('MATCH (c:Client) RETURN c {.*} LIMIT 5');
      const clients = clientsResult.records.map(r => r.get('c'));
      
      // Check reports
      const reportsResult = await session.run(
        'MATCH (c:Client)<-[:BELONGS_TO]-(r:Report) RETURN c.name as clientName, r {.*} as report LIMIT 5'
      );
      const reports = reportsResult.records.map(r => ({
        clientName: r.get('clientName'),
        report: r.get('report')
      }));
      
      return NextResponse.json({
        status: 'ok',
        clientsCount: clients.length,
        clients,
        reportsCount: reports.length,
        reports
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('DB test error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}