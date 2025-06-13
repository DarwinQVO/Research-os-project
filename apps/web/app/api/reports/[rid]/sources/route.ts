import { NextResponse } from 'next/server';
import { getSources } from '@research-os/db/source';
import type { SourceStatus } from '@research-os/db/source';

export async function GET(
  request: Request,
  { params }: { params: { rid: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as SourceStatus | null;
    
    // Validate status parameter if provided
    if (status && !['pending', 'approved', 'published'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status parameter' },
        { status: 400 }
      );
    }

    const sources = await getSources(params.rid, status || undefined);
    
    return NextResponse.json(sources);
  } catch (error) {
    console.error('Error fetching sources:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}