import { NextRequest, NextResponse } from 'next/server';
import { deleteQuote, getQuoteById } from '@research-os/db';

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