import { NextResponse } from 'next/server';
import { entityChosenSchema } from '@/lib/zodSchemas';
import { createEntity, linkReportToEntity, findEntity } from '@research-os/db/entity';
import { randomUUID } from 'crypto';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate input with Zod
    const result = entityChosenSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const { chosen } = result.data;
    const reportId = params.id;

    // Check if entity already exists
    let entity = await findEntity(chosen.name, chosen.type);
    
    if (!entity) {
      // Create new entity
      const entityId = randomUUID();
      entity = await createEntity({
        id: entityId,
        name: chosen.name,
        type: chosen.type,
        primaryUrl: chosen.primaryUrl,
      });
    }

    // Link report to entity
    await linkReportToEntity(reportId, entity.id);

    return NextResponse.json(
      { entityId: entity.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating entity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}