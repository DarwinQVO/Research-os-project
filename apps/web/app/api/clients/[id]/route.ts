import { NextResponse } from 'next/server';
import { getClientWithReports, updateClient, deleteClient } from '@research-os/db/client';
import { clientExtendedSchema } from '@/lib/zodSchemas';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getClientWithReports(params.id);
    
    if (!result) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate input with partial schema (at least one field required)
    const partialSchema = clientExtendedSchema.partial().refine(
      (data) => Object.keys(data).length > 0,
      { message: "At least one field must be provided for update" }
    );
    
    const result = partialSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    // Update client in Neo4j
    const updatedClient = await updateClient(params.id, result.data);
    
    if (!updatedClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ client: updatedClient });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteClient(params.id);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}