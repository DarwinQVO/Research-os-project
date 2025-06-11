import { NextResponse } from 'next/server';
import { getPublishedQuotes, createLegacyQuote } from '@research-os/db/quote';
import { getAllClients } from '@research-os/db/client';

export async function GET() {
  try {
    console.log('Debug endpoint called');
    
    // Get all clients to check if any exist
    const clients = await getAllClients();
    console.log('Available clients:', clients.length);
    
    return NextResponse.json({
      status: 'ok',
      clientsCount: clients.length,
      clients: clients.map(c => ({ id: c.id, name: c.name }))
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function POST(request: Request) {
  try {
    const { clientId, reportId, createTestQuote } = await request.json();
    
    if (createTestQuote) {
      // Create a test quote
      const testQuote = await createLegacyQuote(reportId, {
        shortText: 'This is a test quote for debugging',
        text: 'This is a longer test quote text that meets the minimum requirements for testing the quote system.',
        author: 'Test Author',
        source: 'Test Source',
        sourceUrl: 'https://example.com',
        date: 'Test Date',
        isPublic: true
      });
      
      return NextResponse.json({
        status: 'quote created',
        quote: testQuote
      });
    }
    
    // Test getting quotes
    const quotes = await getPublishedQuotes(clientId, reportId);
    
    return NextResponse.json({
      status: 'ok',
      clientId,
      reportId,
      quotesCount: quotes.length,
      quotes
    });
  } catch (error) {
    console.error('Debug POST error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}