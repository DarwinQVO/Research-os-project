import { NextResponse } from 'next/server';
import { getDriver } from '@research-os/db';
import { createQuote, getPublishedQuotes } from '@research-os/db/quote';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const clientId = searchParams.get('clientId');
  const reportId = searchParams.get('reportId');
  
  if (!clientId || !reportId) {
    return NextResponse.json({ error: 'Missing clientId or reportId' }, { status: 400 });
  }
  
  const driver = getDriver();
  const session = driver.session();
  
  try {
    if (action === 'create-test-quote') {
      // Create a test quote
      const testQuote = {
        shortText: 'This is a test quote for debugging',
        text: 'This is a longer version of the test quote that we are using for debugging the portal display issue.',
        author: 'Test Author',
        source: 'Test Source',
        sourceUrl: 'https://example.com',
        tags: ['test', 'debug'],
        isPublic: true
      };
      
      const createdQuote = await createQuote(reportId, testQuote);
      
      return NextResponse.json({
        message: 'Test quote created',
        quote: createdQuote
      });
    }
    
    // Default action: check the flow
    const flowCheck: any = {
      clientId,
      reportId,
      checks: {}
    };
    
    // 1. Check if client exists
    const clientResult = await session.run(
      'MATCH (c:Client {id: $id}) RETURN c { .* } as client',
      { id: clientId }
    );
    flowCheck.checks.clientExists = clientResult.records.length > 0;
    if (flowCheck.checks.clientExists) {
      flowCheck.client = clientResult.records[0].get('client');
    }
    
    // 2. Check if report exists
    const reportResult = await session.run(
      'MATCH (r:Report {id: $id}) RETURN r { .* } as report',
      { id: reportId }
    );
    flowCheck.checks.reportExists = reportResult.records.length > 0;
    if (flowCheck.checks.reportExists) {
      flowCheck.report = reportResult.records[0].get('report');
    }
    
    // 3. Check relationship
    const relationResult = await session.run(
      'MATCH (c:Client {id: $cid})<-[:BELONGS_TO]-(r:Report {id: $rid}) RETURN count(*) as count',
      { cid: clientId, rid: reportId }
    );
    flowCheck.checks.relationshipExists = relationResult.records[0].get('count').toNumber() > 0;
    
    // 4. Get all quotes
    const allQuotesResult = await session.run(
      `MATCH (r:Report {id: $rid})-[:HAS_QUOTE]->(q:Quote)
       RETURN q { .*, createdAt: toString(q.createdAt) } AS q
       ORDER BY q.createdAt DESC`,
      { rid: reportId }
    );
    
    flowCheck.allQuotes = allQuotesResult.records.map(record => record.get('q'));
    flowCheck.quoteCounts = {
      total: flowCheck.allQuotes.length,
      public: flowCheck.allQuotes.filter((q: any) => q.isPublic === true).length,
      private: flowCheck.allQuotes.filter((q: any) => q.isPublic === false).length,
      undefined: flowCheck.allQuotes.filter((q: any) => q.isPublic === undefined).length
    };
    
    // 5. Test getPublishedQuotes function
    try {
      const publishedQuotes = await getPublishedQuotes(clientId, reportId);
      flowCheck.publishedQuotesFunction = {
        success: true,
        count: publishedQuotes.length,
        quotes: publishedQuotes
      };
    } catch (error) {
      flowCheck.publishedQuotesFunction = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    return NextResponse.json(flowCheck);
  } catch (error) {
    console.error('Test flow error:', error);
    return NextResponse.json(
      { 
        error: 'Test flow error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}