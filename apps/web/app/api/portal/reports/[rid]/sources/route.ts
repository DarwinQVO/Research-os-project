import { NextRequest, NextResponse } from 'next/server';
import { getPublishedSources } from '@research-os/db/source';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rid: string }> }
) {
  try {
    const { rid } = await params;
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
    console.error('Error fetching published sources for report', rid, ':', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json(
      { error: 'Failed to fetch sources', details: error?.message }, 
      { status: 500 }
    );
  }
}