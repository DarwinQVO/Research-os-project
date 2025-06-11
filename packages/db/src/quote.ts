import { getDriver } from './index';

interface QuoteInput {
  shortText: string;
  text: string;
  entityId: string;
  sourceId: string;
  sourceUrl?: string;
  date?: string;
  isPublic: boolean;
  isApproved?: boolean;
}

// Legacy interface for backward compatibility
interface LegacyQuoteInput extends Omit<QuoteInput, 'entityId' | 'sourceId'> {
  author?: string;
  source?: string;
}

export async function createQuote(reportId: string, data: QuoteInput) {
  const driver = getDriver();
  const session = driver.session();
  
  const quoteData = {
    shortText: data.shortText,
    text: data.text,
    sourceUrl: data.sourceUrl,
    date: data.date,
    isPublic: data.isPublic || false,
    isApproved: data.isApproved || false
  };
  
  try {
    const result = await session.run(
      `MATCH (r:Report {id: $rid})
       MATCH (e:Entity {id: $entityId})
       MATCH (s:Source {id: $sourceId})
       CREATE (q:Quote {
         id: randomUUID(), shortText: $shortText, text: $text,
         sourceUrl: $sourceUrl, date: $date, isPublic: $isPublic, 
         isApproved: $isApproved,
         embedding: [0.0], createdAt: datetime()
       })
       MERGE (r)-[:HAS_QUOTE]->(q)
       MERGE (q)-[:QUOTE_OF]->(e)
       MERGE (q)-[:CITES]->(s)
       RETURN q {.*}`,
      { 
        rid: reportId,
        entityId: data.entityId,
        sourceId: data.sourceId,
        ...quoteData 
      }
    );
    
    return result.records[0].get(0);
  } finally {
    await session.close();
  }
}

// Legacy function for backward compatibility
export async function createLegacyQuote(reportId: string, data: LegacyQuoteInput) {
  const driver = getDriver();
  const session = driver.session();
  
  const quoteData = {
    ...data,
    isPublic: data.isPublic || false,
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
       OPTIONAL MATCH (q)-[:QUOTE_OF]->(e:Entity)
       OPTIONAL MATCH (q)-[:CITES]->(s:Source)
       RETURN q { .id, .shortText, .author, .source, .sourceUrl, .date, .isPublic, .isApproved,
         createdAt: toString(q.createdAt),
         speaker: e.name,
         sourceTitle: s.title,
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
  speaker?: string;
  sourceTitle?: string;
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
       OPTIONAL MATCH (q)-[:QUOTE_OF]->(e:Entity)
       OPTIONAL MATCH (q)-[:CITES]->(s:Source)
       RETURN q { .id, .shortText, .author, .source, .sourceUrl,
         .date, createdAt: toString(q.createdAt),
         speaker: e.name,
         sourceTitle: s.title } AS q
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

export async function updateQuote(id: string, updates: { 
  isPublic?: boolean; 
  isApproved?: boolean;
  shortText?: string;
  text?: string;
  sourceUrl?: string;
  date?: string;
  entityId?: string;
  sourceId?: string;
}) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    // Handle entity and source relationship updates separately
    if (updates.entityId || updates.sourceId) {
      // Remove old relationships
      await session.run(
        'MATCH (q:Quote {id: $id}) ' +
        'OPTIONAL MATCH (q)-[r1:QUOTE_OF]->() ' +
        'OPTIONAL MATCH (q)-[r2:CITES]->() ' +
        'DELETE r1, r2',
        { id }
      );
      
      // Add new relationships
      if (updates.entityId) {
        await session.run(
          'MATCH (q:Quote {id: $id}), (e:Entity {id: $entityId}) ' +
          'MERGE (q)-[:QUOTE_OF]->(e)',
          { id, entityId: updates.entityId }
        );
      }
      
      if (updates.sourceId) {
        await session.run(
          'MATCH (q:Quote {id: $id}), (s:Source {id: $sourceId}) ' +
          'MERGE (q)-[:CITES]->(s)',
          { id, sourceId: updates.sourceId }
        );
      }
    }
    
    // Update quote properties
    const propUpdates = { ...updates };
    delete propUpdates.entityId;
    delete propUpdates.sourceId;
    
    if (Object.keys(propUpdates).length > 0) {
      const setClause = Object.keys(propUpdates)
        .map(key => `q.${key} = $${key}`)
        .join(', ');
      
      const result = await session.run(
        `MATCH (q:Quote {id: $id}) SET ${setClause} RETURN q {.*} LIMIT 1`,
        { id, ...propUpdates }
      );
      
      return result.records[0]?.get(0) || null;
    }
    
    // If only relationships were updated, return the quote
    const result = await session.run(
      'MATCH (q:Quote {id: $id}) RETURN q {.*} LIMIT 1',
      { id }
    );
    
    return result.records[0]?.get(0) || null;
  } finally {
    await session.close();
  }
}

export async function deleteQuote(id: string) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    await session.run(
      'MATCH (q:Quote {id: $id}) ' +
      'DETACH DELETE q',
      { id }
    );
  } finally {
    await session.close();
  }
}

export async function getQuoteById(id: string) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      `MATCH (q:Quote {id: $id})
       OPTIONAL MATCH (q)-[:QUOTE_OF]->(e:Entity)
       OPTIONAL MATCH (q)-[:CITES]->(s:Source)
       RETURN q { .*, 
         speaker: e.name,
         entityId: e.id,
         sourceTitle: s.title,
         sourceId: s.id,
         createdAt: toString(q.createdAt)
       } AS quote`,
      { id }
    );
    
    return result.records[0]?.get('quote') || null;
  } finally {
    await session.close();
  }
}