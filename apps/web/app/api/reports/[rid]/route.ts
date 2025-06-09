import { NextResponse } from 'next/server';
import { getDriver } from '@research-os/db';
import { deleteReport } from '@research-os/db/report';

export async function GET(
  request: Request,
  { params }: { params: { rid: string } }
) {
  try {
    const driver = getDriver();
    const session = driver.session();
    
    try {
      const result = await session.run(
        `MATCH (c:Client)<-[:BELONGS_TO]-(r:Report {id: $rid})
         RETURN r {.*} as report, c {.*} as client`,
        { rid: params.rid }
      );
      
      if (result.records.length === 0) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }
      
      const record = result.records[0];
      const report = record.get('report');
      const client = record.get('client');
      
      return NextResponse.json({
        id: report.id,
        title: report.title,
        content: report.content || "Report content here...",
        clientId: client.id,
        clientName: client.name,
        createdAt: report.createdAt
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { rid: string } }
) {
  try {
    const deleted = await deleteReport(params.rid);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}