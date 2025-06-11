import { NextRequest, NextResponse } from 'next/server';
import { deleteEntity } from '@research-os/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; rid: string; eid: string }> }
) {
  try {
    const { id: clientId, rid: reportId, eid: entityId } = await params;
    
    // Delete the entity (DETACH DELETE will handle relationships)
    await deleteEntity(entityId);
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting entity:', error);
    return NextResponse.json(
      { error: 'Failed to delete entity' },
      { status: 500 }
    );
  }
}