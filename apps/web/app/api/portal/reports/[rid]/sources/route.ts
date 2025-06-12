import { NextRequest, NextResponse } from 'next/server';
import { getPublishedSources } from '@research-os/db/source';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rid: string }> }
) {
  let rid: string | undefined;
  
  try {
    const resolvedParams = await params;
    rid = resolvedParams.rid;
    console.log('Portal sources API called with reportId:', rid);
    
    if (!rid) {
      console.error('Missing report ID in portal sources request');
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    console.log('Fetching published sources for report:', rid);
    const sources = await getPublishedSources(rid);
    console.log(`Found ${sources.length} sources for report ${rid}`);
    
    return NextResponse.json(sources, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Error fetching published sources for report', rid || 'unknown', ':', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Failed to fetch sources', details: errorMessage }, 
      { status: 500 }
    );
  }
}