import { NextRequest, NextResponse } from 'next/server';
import { getReportEntities, createEntityQuick } from '@research-os/db/entity';

export async function GET(
  request: Request,
  { params }: { params: { id: string; rid: string } }
) {
  try {
    const entities = await getReportEntities(params.rid);
    
    // Transform entities for dropdown usage
    const transformedEntities = entities.map(entity => ({
      id: entity.id,
      name: entity.name,
      type: entity.type,
      primaryUrl: entity.primaryUrl
    }));
    
    return NextResponse.json(transformedEntities);
  } catch (error) {
    console.error('Error fetching entities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entities' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; rid: string } }
) {
  try {
    const { id: clientId, rid: reportId } = params;
    const body = await request.json();
    
    const { name, type, primaryUrl, confidence } = body;
    
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }
    
    const entity = await createEntityQuick(clientId, reportId, {
      name,
      type,
      primaryUrl,
      confidence
    });
    
    return NextResponse.json(entity, { status: 201 });
  } catch (error) {
    console.error('Error creating entity:', error);
    return NextResponse.json(
      { error: 'Failed to create entity' },
      { status: 500 }
    );
  }
}