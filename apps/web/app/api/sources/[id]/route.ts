import { NextResponse } from 'next/server';
import { updateSource, deleteSource } from '@research-os/db/source';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { 
      url, 
      title, 
      author, 
      publishedAt, 
      type, 
      description, 
      thumbnail 
    } = body;
    
    // Update the source in the database
    const updatedSource = await updateSource(params.id, { 
      url, 
      title, 
      author, 
      publishedAt, 
      type, 
      description, 
      thumbnail 
    });
    
    if (!updatedSource) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Source updated successfully',
      source: updatedSource
    });
    
  } catch (error) {
    console.error('Error updating source:', error);
    return NextResponse.json(
      { error: 'Failed to update source' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteSource(params.id);
    
    return NextResponse.json({ 
      success: true,
      message: 'Source deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting source:', error);
    return NextResponse.json(
      { error: 'Failed to delete source' },
      { status: 500 }
    );
  }
}