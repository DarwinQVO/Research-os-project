import { NextResponse } from 'next/server';
import { clientExtendedSchema } from '@/lib/zodSchemas';
import { createClient, getAllClients } from '@research-os/db/client';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input with Zod
    const result = clientExtendedSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    // Generate unique ID and prepare client data
    const id = randomUUID();
    const clientData = {
      id,
      ...result.data
    };

    // Create client in Neo4j
    const client = await createClient(clientData);

    return NextResponse.json(
      { client },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const clients = await getAllClients();
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}