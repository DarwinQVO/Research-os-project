import { NextResponse } from 'next/server';
import { updateQuote, deleteQuote } from '@research-os/db/quote';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { 
      isPublic, 
      isApproved, 
      shortText, 
      text, 
      sourceUrl, 
      date, 
      entityId, 
      sourceId 
    } = body;
    
    // Update the quote in the database
    const updatedQuote = await updateQuote(params.id, { 
      isPublic, 
      isApproved, 
      shortText, 
      text, 
      sourceUrl, 
      date, 
      entityId, 
      sourceId 
    });
    
    if (!updatedQuote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Quote updated successfully',
      quote: updatedQuote
    });
    
  } catch (error) {
    console.error('Error updating quote:', error);
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteQuote(params.id);
    
    return NextResponse.json({ 
      success: true,
      message: 'Quote deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json(
      { error: 'Failed to delete quote' },
      { status: 500 }
    );
  }
}