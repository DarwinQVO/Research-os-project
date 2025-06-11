import { NextResponse } from 'next/server';
import { getSources } from '@research-os/db/source';

export async function GET(
  request: Request,
  { params }: { params: { rid: string } }
) {
  try {
    const sources = await getSources(params.rid);
    return NextResponse.json(sources);
  } catch (error) {
    console.error('Error fetching sources:', error);
    return NextResponse.json([], { status: 200 });
  }
}