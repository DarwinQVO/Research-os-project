import { NextResponse } from 'next/server';
import { getReportEntities, createEntity, linkReportToEntity } from '@research-os/db/entity';

export async function GET(
  request: Request,
  { params }: { params: { rid: string } }
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
  request: Request,
  { params }: { params: { rid: string } }
) {
  try {
    const body = await request.json();
    const { name, type, primaryUrl, confidence } = body;
    
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }
    
    // For reports without clientId, we need to create entity differently
    const entityData = {
      id: `entity_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name,
      type,
      primaryUrl: primaryUrl || null,
      confidence: confidence || 0.9
    };
    
    const createdEntity = await createEntity(entityData);
    
    // Link the entity to the report
    await linkReportToEntity(params.rid, createdEntity.id);
    
    return NextResponse.json(createdEntity, { status: 201 });
  } catch (error) {
    console.error('Error creating entity:', error);
    return NextResponse.json(
      { error: 'Failed to create entity' },
      { status: 500 }
    );
  }
}