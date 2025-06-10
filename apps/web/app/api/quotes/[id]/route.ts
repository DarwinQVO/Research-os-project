import { NextResponse } from 'next/server';
import { updateQuote } from '@research-os/db/quote';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { isPublic, isApproved } = body;
    
    // Update the quote in the database
    const updatedQuote = await updateQuote(params.id, { isPublic, isApproved });
    
    if (!updatedQuote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Quote status updated successfully',
      quote: updatedQuote
    });
    
  } catch (error) {
    console.error('Error updating quote status:', error);
    return NextResponse.json(
      { error: 'Failed to update quote status' },
      { status: 500 }
    );
  }
}