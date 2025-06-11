import { NextRequest, NextResponse } from 'next/server';
import { deleteSource, getSource } from '@research-os/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; rid: string; sid: string }> }
) {
  try {
    const { id: clientId, rid: reportId, sid: sourceId } = await params;
    
    // Verify the source exists
    const source = await getSource(sourceId);
    if (!source) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }
    
    // Delete the source
    await deleteSource(sourceId);
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting source:', error);
    return NextResponse.json(
      { error: 'Failed to delete source' },
      { status: 500 }
    );
  }
}