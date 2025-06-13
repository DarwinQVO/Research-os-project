import { NextRequest, NextResponse } from 'next/server';
import { getSourceContent } from '@research-os/db/source';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sid: string }> }
) {
  let sid: string | undefined;
  
  try {
    const resolvedParams = await params;
    sid = resolvedParams.sid;
    console.log('Source content API called with sourceId:', sid);
    
    if (!sid) {
      console.error('Missing source ID in content request');
      return NextResponse.json({ error: 'Source ID is required' }, { status: 400 });
    }

    console.log('Fetching content for source:', sid);
    const content = await getSourceContent(sid);
    console.log(`Found content for source ${sid}:`, {
      quotes: content.quotes.length,
      entities: content.entities.length,
      images: content.images.length
    });
    
    return NextResponse.json(content, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=150'
      }
    });
  } catch (error) {
    console.error('Error fetching source content for source', sid || 'unknown', ':', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to fetch source content', details: errorMessage }, 
      { status: 500 }
    );
  }
}