import { NextResponse } from 'next/server';
import { getDriver } from '@research-os/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const driver = getDriver();
    const session = driver.session();
    
    try {
      const result = await session.run(
        `MATCH (s:Source {id: $sourceId})<-[:CITES]-(q:Quote)-[:QUOTE_OF]->(e:Entity)
         WITH DISTINCT e
         RETURN e { .*, createdAt: toString(e.createdAt) } AS entity
         ORDER BY entity.name`,
        { sourceId: params.id }
      );
      
      const entities = result.records.map(record => record.get('entity'));
      return NextResponse.json(entities);
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error fetching entities from source:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}