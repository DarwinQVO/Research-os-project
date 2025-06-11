import { NextResponse } from 'next/server';
import { fetchMetadata } from '@research-os/ai';
import { z } from 'zod';

const metadataRequestSchema = z.object({
  url: z.string().url('Invalid URL format')
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = metadataRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const { url } = result.data;
    
    try {
      const metadata = await fetchMetadata(url);
      return NextResponse.json(metadata);
    } catch (metadataError) {
      console.error('Error fetching metadata:', metadataError);
      
      // Return minimal metadata on error
      return NextResponse.json({
        title: new URL(url).hostname,
        type: 'other'
      });
    }
  } catch (error) {
    console.error('Error in metadata preview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}