import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createQuote } from '@research-os/db/quote';
import { quoteInsertSchema } from '@/lib/zodSchemas';
import { getClient } from '@research-os/db/client';
import { getReport } from '@research-os/db/report';

export async function POST(
  request: Request,
  { params }: { params: { id: string; rid: string } }
) {
  try {
    const body = await request.json();
    const validation = quoteInsertSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    // Verify client exists
    const client = await getClient(params.id);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    // Verify report exists and belongs to client  
    const report = await getReport(params.rid);
    if (!report || report.clientId !== params.id) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
    // Create quote with entity and source relationships
    const quote = await createQuote(params.rid, validation.data);
    
    return NextResponse.json({ quote }, { status: 201 });
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