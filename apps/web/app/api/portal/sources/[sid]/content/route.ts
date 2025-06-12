import { NextRequest, NextResponse } from 'next/server';
import { getSourceContent } from '@research-os/db/source';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sid: string }> }
) {
  try {
    const { sid } = await params;
    
    if (!sid) {
      return NextResponse.json({ error: 'Source ID is required' }, { status: 400 });
    }

    const content = await getSourceContent(sid);
    
    return NextResponse.json(content, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=150'
      }
    });
  } catch (error) {
    console.error('Error fetching source content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch source content' }, 
      { status: 500 }
    );
  }
}