import { NextResponse } from 'next/server';
import { updateEntity, deleteEntity } from '@research-os/db/entity';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { 
      name, 
      type, 
      primaryUrl, 
      confidence 
    } = body;
    
    // Update the entity in the database
    const updatedEntity = await updateEntity(params.id, { 
      name, 
      type, 
      primaryUrl, 
      confidence 
    });
    
    if (!updatedEntity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Entity updated successfully',
      entity: updatedEntity
    });
    
  } catch (error) {
    console.error('Error updating entity:', error);
    return NextResponse.json(
      { error: 'Failed to update entity' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteEntity(params.id);
    
    return NextResponse.json({ 
      success: true,
      message: 'Entity deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting entity:', error);
    return NextResponse.json(
      { error: 'Failed to delete entity' },
      { status: 500 }
    );
  }
}