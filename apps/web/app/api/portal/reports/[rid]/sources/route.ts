import { NextRequest, NextResponse } from 'next/server';
import { getPublishedSources } from '@research-os/db/source';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rid: string }> }
) {
  try {
    const { rid } = await params;
    
    if (!rid) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const sources = await getPublishedSources(rid);
    
    return NextResponse.json(sources, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Error fetching published sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sources' }, 
      { status: 500 }
    );
  }
}