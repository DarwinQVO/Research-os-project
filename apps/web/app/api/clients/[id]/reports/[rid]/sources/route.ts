import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSource, getSources } from '@research-os/db/source';
import { fetchMetadata } from '@research-os/ai/fetchMetadata';
import { getClient } from '@research-os/db/client';
import { getReport } from '@research-os/db/report';

const createSourceSchema = z.object({
  url: z.string().url()
});

export async function POST(
  request: Request,
  { params }: { params: { id: string; rid: string } }
) {
  try {
    const body = await request.json();
    const validation = createSourceSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
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
    
    // Fetch metadata
    const metadata = await fetchMetadata(validation.data.url);
    
    // Create source
    const source = await createSource(params.rid, metadata);
    
    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    console.error('Error creating source:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string; rid: string } }
) {
  try {
    const sources = await getSources(params.rid);
    return NextResponse.json(sources);
  } catch (error) {
    console.error('Error fetching sources:', error);
    return NextResponse.json([], { status: 200 });
  }
}