import { NextResponse } from 'next/server';
import { updateEntity, deleteEntity, updateEntityStatus, getEntityContent } from '@research-os/db/entity';
import { entityStatusSchema, entityEditSchema } from '@/lib/zodSchemas';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Check if this is a status update request
    if ('status' in body && Object.keys(body).length === 1) {
      try {
        const validatedData = entityStatusSchema.parse(body);
        
        const updatedEntity = await updateEntityStatus(params.id, validatedData.status);
        
        if (!updatedEntity) {
          return NextResponse.json(
            { error: 'Entity not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json(updatedEntity);
      } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
          return NextResponse.json(
            { error: 'Invalid status value' },
            { status: 400 }
          );
        }
        throw error;
      }
    }
    
    // Otherwise, handle general entity updates
    console.log('Entity update request body:', body);
    
    try {
      // Validate the entity edit data
      const validatedData = entityEditSchema.parse(body);
      console.log('Validated entity data:', validatedData);
      
      // Update the entity in the database
      const updatedEntity = await updateEntity(params.id, validatedData);
      console.log('Updated entity result:', updatedEntity);
      
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
      
    } catch (validationError) {
      console.error('Validation error:', validationError);
      if (validationError instanceof Error && validationError.name === 'ZodError') {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: (validationError as any).errors 
          },
          { status: 400 }
        );
      }
      throw validationError;
    }
    
  } catch (error) {
    console.error('Error updating entity:', error);
    return NextResponse.json(
      { error: 'Failed to update entity' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const content = await getEntityContent(params.id);
    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching entity content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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