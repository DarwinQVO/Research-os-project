import { NextResponse } from 'next/server';
import { createQuote } from '@research-os/db/quote';
import { quoteInsertSchema } from '@/lib/zodSchemas';

export async function POST(
  request: Request,
  { params }: { params: { rid: string } }
) {
  try {
    const body = await request.json();
    
    const result = quoteInsertSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const quote = await createQuote(params.rid, result.data);
    
    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}