import { NextResponse } from 'next/server';
import { createQuote, getAllQuotesWithStatus } from '@research-os/db/quote';
import { quoteInsertSchema } from '@/lib/zodSchemas';

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
    
    const result = quoteInsertSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const quote = await createQuote(params.rid, result.data);
    
    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}