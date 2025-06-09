import { NextResponse } from 'next/server';
import { entityNameSchema } from '@/lib/zodSchemas';
import { disambiguate } from '@research-os/ai';
import { getClientWithReports } from '@research-os/db/client';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate input with Zod
    const result = entityNameSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const { name } = result.data;
    
    // Get report and client context
    // For now, we'll use a simplified approach - in a real implementation,
    // you might want to get the actual report and its client's context
    const context = "Research report context";
    const niches = ["Technology", "Business"];

    try {
      const suggestions = await disambiguate(name, context, niches);
      
      if (suggestions.length === 0) {
        return NextResponse.json(
          { error: 'No suggestions found' },
          { status: 422 }
        );
      }

      return NextResponse.json({ suggestions });
    } catch (aiError) {
      console.error('AI disambiguation error:', aiError);
      
      if (aiError instanceof Error && aiError.message.includes('No suggestions')) {
        return NextResponse.json(
          { error: 'No suggestions found' },
          { status: 422 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to disambiguate entity' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in disambiguation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}