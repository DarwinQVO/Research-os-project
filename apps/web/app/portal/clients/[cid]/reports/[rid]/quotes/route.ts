import { NextResponse } from 'next/server';
import { getPublishedQuotes } from '@research-os/db/quote';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cid: string; rid: string }> | { cid: string; rid: string } }
) {
  // Handle both sync and async params (Next.js 13+ compatibility)
  const resolvedParams = await Promise.resolve(params);
  try {
    console.log('Portal API - Fetching quotes for client:', resolvedParams.cid, 'report:', resolvedParams.rid);
    
    // Validate params
    if (!resolvedParams.cid || !resolvedParams.rid) {
      console.error('Missing required parameters:', { cid: resolvedParams.cid, rid: resolvedParams.rid });
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    const quotes = await getPublishedQuotes(resolvedParams.cid, resolvedParams.rid);
    
    // Ensure quotes is an array
    if (!Array.isArray(quotes)) {
      console.error('getPublishedQuotes returned non-array:', quotes);
      return NextResponse.json([], { status: 200 });
    }
    
    console.log('Found quotes:', quotes.length);
    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Error fetching published quotes:', error);
    
    if (error instanceof Error && error.message === 'Client-Report chain not found') {
      return NextResponse.json(
        { error: 'Client or Report not found' },
        { status: 404 }
      );
    }
    
    // Log the full error for debugging
    console.error('Full error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}