import { NextResponse } from 'next/server';
import { updateSource, deleteSource, getSource } from '@research-os/db/source';
import { sourceUpdateSchema } from '@/lib/zodSchemas';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Check if this is a status-only update
    if (body.status && Object.keys(body).length === 1) {
      // Validate status update
      const validation = sourceUpdateSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.errors },
          { status: 400 }
        );
      }

      // Check if source exists
      const existingSource = await getSource(params.id);
      if (!existingSource) {
        return NextResponse.json(
          { error: 'Source not found' },
          { status: 404 }
        );
      }

      // Update source status
      const updatedSource = await updateSource(params.id, {
        status: validation.data.status
      });

      if (!updatedSource) {
        return NextResponse.json(
          { error: 'Failed to update source' },
          { status: 500 }
        );
      }

      return NextResponse.json(updatedSource);
    }
    
    // Handle full source update
    const { 
      url, 
      title, 
      author, 
      publishedAt, 
      type, 
      description, 
      thumbnail,
      status
    } = body;
    
    // Update the source in the database
    const updatedSource = await updateSource(params.id, { 
      url, 
      title, 
      author, 
      publishedAt, 
      type, 
      description, 
      thumbnail,
      status
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