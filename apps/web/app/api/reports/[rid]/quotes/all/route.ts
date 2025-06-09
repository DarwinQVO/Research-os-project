import { NextResponse } from 'next/server';
import { getAllQuotesWithStatus } from '@research-os/db/quote';

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