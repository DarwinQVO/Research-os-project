import { NextResponse } from 'next/server';
import { getQuotesFromSource } from '@research-os/db/source';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const quotes = await getQuotesFromSource(params.id);
    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes from source:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}