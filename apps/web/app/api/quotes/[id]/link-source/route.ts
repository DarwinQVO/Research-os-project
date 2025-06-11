import { NextResponse } from 'next/server';
import { linkQuoteToSource } from '@research-os/db/source';
import { z } from 'zod';

const linkSourceSchema = z.object({
  sourceId: z.string().min(1, 'Source ID is required')
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = linkSourceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const { sourceId } = result.data;
    
    // Link quote to source
    const linkResult = await linkQuoteToSource(params.id, sourceId);
    
    if (!linkResult) {
      return NextResponse.json(
        { error: 'Failed to link quote to source' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(linkResult);
  } catch (error) {
    console.error('Error linking quote to source:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}