import { NextRequest, NextResponse } from 'next/server';
import { deleteQuote, getQuoteById, updateQuote } from '@research-os/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; rid: string; qid: string }> }
) {
  try {
    const { id: clientId, rid: reportId, qid: quoteId } = await params;
    const body = await request.json();
    
    // Verify the quote exists and belongs to the correct client/report chain
    const quote = await getQuoteById(quoteId);
    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }
    
    // Update only the status fields (isPublic, isApproved)
    const updateData: { isPublic?: boolean; isApproved?: boolean } = {};
    
    if (typeof body.isPublic === 'boolean') {
      updateData.isPublic = body.isPublic;
    }
    
    if (typeof body.isApproved === 'boolean') {
      updateData.isApproved = body.isApproved;
    }
    
    const updatedQuote = await updateQuote(quoteId, updateData);
    
    return NextResponse.json({ quote: updatedQuote });
  } catch (error) {
    console.error('Error updating quote status:', error);
    return NextResponse.json(
      { error: 'Failed to update quote status' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; rid: string; qid: string }> }
) {
  try {
    const { id: clientId, rid: reportId, qid: quoteId } = await params;
    
    // Verify the quote exists and belongs to the correct client/report chain
    const quote = await getQuoteById(quoteId);
    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }
    
    // Delete the quote
    await deleteQuote(quoteId);
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json(
      { error: 'Failed to delete quote' },
      { status: 500 }
    );
  }
}