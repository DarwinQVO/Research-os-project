import { NextResponse } from 'next/server';
import { createQuote, createLegacyQuote, getAllQuotesWithStatus } from '@research-os/db/quote';
import { quoteInsertSchema, legacyQuoteInsertSchema } from '@/lib/zodSchemas';

export async function GET(
  request: Request,
  { params }: { params: { rid: string } }
) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  
  if (!clientId) {
    return NextResponse.json(
      { error: 'Missing clientId parameter' },
      { status: 400 }
    );
  }

  try {
    const quotes = await getAllQuotesWithStatus(clientId, params.rid);
    
    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes with status:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { rid: string } }
) {
  try {
    const body = await request.json();
    
    // Check if it's a new format (with entityId/sourceId) or legacy format
    const hasEntityId = 'entityId' in body;
    const hasSourceId = 'sourceId' in body;
    
    if (hasEntityId && hasSourceId) {
      // New format with entity and source relationships
      const result = quoteInsertSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: result.error.errors },
          { status: 400 }
        );
      }
      
      const quote = await createQuote(params.rid, result.data);
      return NextResponse.json({ quote }, { status: 201 });
      
    } else {
      // Legacy format with author/source strings
      const result = legacyQuoteInsertSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: result.error.errors },
          { status: 400 }
        );
      }

      const quote = await createLegacyQuote(params.rid, result.data);
      return NextResponse.json({ quote }, { status: 201 });
    }
    
  } catch (error) {
    console.error('Error creating quote:', error);
    
    if (error instanceof Error && error.message.includes('Entity') && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Entity not found. Please ensure the speaker exists in this report.' },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message.includes('Source') && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Source not found. Please ensure the source exists in this report.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}