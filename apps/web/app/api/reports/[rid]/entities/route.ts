import { NextResponse } from 'next/server';
import { getReportEntities, getPublishedEntities, createEntity, linkReportToEntity } from '@research-os/db/entity';
import type { EntityStatus } from '@research-os/db/entity';

export async function GET(
  request: Request,
  { params }: { params: { rid: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === '1';
    const status = searchParams.get('status') as EntityStatus | null;
    
    // Validate status parameter if provided
    if (status && !['pending', 'approved', 'published'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status parameter' },
        { status: 400 }
      );
    }

    let entities;
    if (isPublic) {
      entities = await getPublishedEntities(params.rid);
    } else {
      entities = await getReportEntities(params.rid, status || undefined);
      // Transform entities for dropdown usage (backward compatibility)
      const transformedEntities = entities.map(entity => ({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        primaryUrl: entity.primaryUrl,
        status: entity.status || 'pending'
      }));
      return NextResponse.json(transformedEntities);
    }
    
    return NextResponse.json(entities);
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
    const { name, type, primaryUrl, confidence, avatarUrl, description } = body;
    
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }
    
    const entityData = {
      name,
      type,
      primaryUrl: primaryUrl || null,
      confidence: confidence || 0.9,
      status: 'pending' as const,
      avatarUrl: avatarUrl || null,
      description: description || null
    };
    
    const createdEntity = await createEntity(params.rid, entityData);
    
    return NextResponse.json(createdEntity, { status: 201 });
  } catch (error) {
    console.error('Error creating entity:', error);
    return NextResponse.json(
      { error: 'Failed to create entity' },
      { status: 500 }
    );
  }
}