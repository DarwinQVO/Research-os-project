import { getDriver } from './index';

interface QuoteInput {
  shortText: string;
  text: string;
  author?: string;
  source?: string;
  sourceUrl?: string;
  date?: string;
  isPublic: boolean;
  isApproved?: boolean;
}

export async function createQuote(reportId: string, data: QuoteInput) {
  const driver = getDriver();
  const session = driver.session();
  
  const quoteData = {
    ...data,
    isApproved: data.isApproved || false
  };
  
  try {
    const result = await session.run(
      `MATCH (r:Report {id: $rid})
       CREATE (q:Quote {
         id: randomUUID(), shortText: $shortText, text: $text,
         author: $author, source: $source, sourceUrl: $sourceUrl,
         date: $date, isPublic: $isPublic, isApproved: $isApproved,
         embedding: [0.0], createdAt: datetime()
       })
       MERGE (r)-[:HAS_QUOTE]->(q)
       RETURN q {.*}`,
      { rid: reportId, ...quoteData }
    );
    
    return result.records[0].get(0);
  } finally {
    await session.close();
  }
}

export async function getAllQuotesWithStatus(
  clientId: string,
  reportId: string
): Promise<Array<{
  id: string;
  shortText: string;
  author?: string;
  source?: string;
  sourceUrl?: string;
  date?: string;
  createdAt: string;
  status: 'Published' | 'Approved' | 'Pending';
  isPublic: boolean;
  isApproved: boolean;
}>> {
  const driver = getDriver();
  const session = driver.session();
  
  console.log('DB - getAllQuotesWithStatus called with:', { clientId, reportId });
  
  try {
    // Get all quotes with computed status
    const result = await session.run(
      `MATCH (c:Client {id: $cid})<-[:BELONGS_TO]-(r:Report {id: $rid})
       -[:HAS_QUOTE]->(q:Quote)
       RETURN q { .id, .shortText, .author, .source, .sourceUrl, .date, .isPublic, .isApproved,
         createdAt: toString(q.createdAt),
         status: CASE 
           WHEN q.isPublic = true THEN 'Published'
           WHEN q.isPublic = false AND q.isApproved = true THEN 'Approved' 
           ELSE 'Pending'
         END
       } AS q
       ORDER BY q.createdAt DESC`,
      { cid: clientId, rid: reportId }
    );
    
    return result.records.map(record => record.get('q'));
  } finally {
    await session.close();
  }
}

export async function getPublishedQuotes(
  clientId: string, 
  reportId: string
): Promise<Array<{
  id: string;
  shortText: string;
  author?: string;
  source?: string;
  sourceUrl?: string;
  date?: string;
  createdAt: string;
}>> {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    console.log('DB: Checking client-report chain for:', { clientId, reportId });
    
    // First check if the client-report chain exists
    const chainCheck = await session.run(
      'MATCH (c:Client {id: $cid})<-[:BELONGS_TO]-(r:Report {id: $rid}) RETURN count(*) as count',
      { cid: clientId, rid: reportId }
    );
    
    const count = chainCheck.records[0]?.get('count')?.toNumber() || 0;
    console.log('DB: Chain check count:', count);
    
    if (count === 0) {
      throw new Error('Client-Report chain not found');
    }
    
    // Get published quotes
    console.log('DB: Fetching published quotes');
    const result = await session.run(
      `MATCH (c:Client {id: $cid})<-[:BELONGS_TO]-(r:Report {id: $rid})
       -[:HAS_QUOTE]->(q:Quote)
       WHERE q.isPublic = true
       RETURN q { .id, .shortText, .author, .source, .sourceUrl,
         .date, createdAt: toString(q.createdAt) } AS q
       ORDER BY q.createdAt DESC`,
      { cid: clientId, rid: reportId }
    );
    
    const quotes = result.records.map(record => record.get('q'));
    console.log('DB: Found quotes:', quotes.length);
    
    // Ensure we always return an array
    return quotes || [];
  } catch (error) {
    console.error('DB Error in getPublishedQuotes:', error);
    throw error;
  } finally {
    await session.close();
  }
}

export async function updateQuote(id: string, updates: { isPublic?: boolean; isApproved?: boolean }) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const setClause = Object.keys(updates)
      .map(key => `q.${key} = $${key}`)
      .join(', ');
    
    const result = await session.run(
      `MATCH (q:Quote {id: $id}) SET ${setClause} RETURN q {.*} LIMIT 1`,
      { id, ...updates }
    );
    
    return result.records[0]?.get(0) || null;
  } finally {
    await session.close();
  }
}