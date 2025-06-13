import { getDriver } from './index';

export type SourceStatus = 'pending' | 'approved' | 'published';

export interface SourceInput {
  url: string;
  title: string;
  author?: string;
  publishedAt?: string;
  type: 'article' | 'video' | 'social' | 'other';
  description?: string;
  thumbnail?: string;
  status?: SourceStatus;
}

export async function createSource(reportId: string, data: SourceInput) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      `MATCH (r:Report {id: $rid})
       CREATE (s:Source {
         id: randomUUID(), 
         url: $url, 
         title: $title,
         author: $author, 
         publishedAt: $publishedAt,
         type: $type,
         description: $description,
         thumbnail: $thumbnail,
         status: $status,
         createdAt: datetime()
       })
       MERGE (r)-[:HAS_SOURCE]->(s)
       RETURN s { .*, status: s.status, createdAt: toString(s.createdAt) }`,
      { 
        rid: reportId, 
        url: data.url,
        title: data.title,
        author: data.author || null,
        publishedAt: data.publishedAt || null,
        type: data.type || 'article',
        description: data.description || null,
        thumbnail: data.thumbnail || null,
        status: data.status || 'pending'
      }
    );
    
    return result.records[0].get(0);
  } finally {
    await session.close();
  }
}

export async function getSources(reportId: string, status?: SourceStatus) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const whereClause = status ? 'WHERE COALESCE(s.status, "pending") = $status' : '';
    const result = await session.run(
      `MATCH (r:Report {id: $rid})-[:HAS_SOURCE]->(s:Source)
       ${whereClause}
       RETURN s { .*, status: COALESCE(s.status, 'pending'), createdAt: toString(s.createdAt) } AS s
       ORDER BY s.createdAt DESC`,
      { rid: reportId, status }
    );
    
    return result.records.map(record => record.get('s'));
  } finally {
    await session.close();
  }
}

export async function getSource(sourceId: string) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      `MATCH (s:Source {id: $sid})
       RETURN s { .*, status: COALESCE(s.status, 'pending'), createdAt: toString(s.createdAt) } LIMIT 1`,
      { sid: sourceId }
    );
    
    return result.records[0]?.get(0) || null;
  } finally {
    await session.close();
  }
}

export async function linkQuoteToSource(quoteId: string, sourceId: string) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      `MATCH (q:Quote {id: $qid}), (s:Source {id: $sid})
       MERGE (q)-[:FROM_SOURCE]->(s)
       RETURN q {.*}, s {.*}`,
      { qid: quoteId, sid: sourceId }
    );
    
    return result.records[0] ? {
      quote: result.records[0].get(0),
      source: result.records[0].get(1)
    } : null;
  } finally {
    await session.close();
  }
}

export async function getQuotesFromSource(sourceId: string) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      `MATCH (s:Source {id: $sid})<-[:CITES]-(q:Quote)
       OPTIONAL MATCH (q)-[:QUOTE_OF]->(e:Entity)
       RETURN q { 
         .*, 
         createdAt: toString(q.createdAt),
         speaker: e.name
       } AS quote
       ORDER BY quote.createdAt DESC`,
      { sid: sourceId }
    );
    
    return result.records.map(record => record.get('quote'));
  } finally {
    await session.close();
  }
}

export async function updateSource(id: string, data: Partial<SourceInput>) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const params: any = { id };
    const setClauses: string[] = [];
    
    // Only include fields that are provided
    if (data.url !== undefined) {
      params.url = data.url;
      setClauses.push('s.url = $url');
    }
    if (data.title !== undefined) {
      params.title = data.title;
      setClauses.push('s.title = $title');
    }
    if (data.author !== undefined) {
      params.author = data.author;
      setClauses.push('s.author = $author');
    }
    if (data.publishedAt !== undefined) {
      params.publishedAt = data.publishedAt;
      setClauses.push('s.publishedAt = $publishedAt');
    }
    if (data.type !== undefined) {
      params.type = data.type;
      setClauses.push('s.type = $type');
    }
    if (data.description !== undefined) {
      params.description = data.description;
      setClauses.push('s.description = $description');
    }
    if (data.thumbnail !== undefined) {
      params.thumbnail = data.thumbnail;
      setClauses.push('s.thumbnail = $thumbnail');
    }
    if (data.status !== undefined) {
      params.status = data.status;
      setClauses.push('s.status = $status');
    }
    
    if (setClauses.length === 0) {
      // No updates to make, just return the existing source
      const result = await session.run(
        'MATCH (s:Source {id: $id}) RETURN s { .*, status: COALESCE(s.status, "pending"), createdAt: toString(s.createdAt) }',
        { id }
      );
      return result.records[0]?.get(0) || null;
    }
    
    const result = await session.run(
      `MATCH (s:Source {id: $id}) 
       SET ${setClauses.join(', ')}
       RETURN s { .*, status: COALESCE(s.status, "pending"), createdAt: toString(s.createdAt) }`,
      params
    );
    
    return result.records[0]?.get(0) || null;
  } finally {
    await session.close();
  }
}

export async function deleteSource(id: string) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    await session.run(
      'MATCH (s:Source {id: $id}) ' +
      'DETACH DELETE s',
      { id }
    );
  } finally {
    await session.close();
  }
}

export interface SourceMeta {
  id: string;
  url: string;
  title: string;
  author?: string;
  publishedAt?: string;
  type: 'article' | 'video' | 'social' | 'other';
  description?: string;
  thumbnail?: string;
  status?: SourceStatus;
  createdAt: string;
  quoteCount?: number;
}

export async function getPublishedSources(reportId: string): Promise<SourceMeta[]> {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      `MATCH (r:Report {id: $reportId})-[:HAS_SOURCE]->(s:Source)
       WHERE COALESCE(s.status, 'pending') = 'published'
       OPTIONAL MATCH (s)<-[:CITES]-(q:Quote)
       WITH s, count(q) AS quoteCount
       RETURN s { 
         .*, 
         status: COALESCE(s.status, 'pending'),
         createdAt: toString(s.createdAt)
       } AS source,
       quoteCount
       ORDER BY source.createdAt DESC`,
      { reportId }
    );
    
    return result.records.map(record => {
      const source = record.get('source');
      const quoteCount = record.get('quoteCount');
      return {
        ...source,
        quoteCount: quoteCount?.toNumber ? quoteCount.toNumber() : quoteCount
      };
    });
  } finally {
    await session.close();
  }
}

export interface SourceContent {
  quotes: any[];
  images: any[];
  entities: any[];
}

export async function getSourceContent(sourceId: string): Promise<SourceContent> {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    // Get quotes from this source (only published ones)
    const quotesResult = await session.run(
      `MATCH (s:Source {id: $sourceId})<-[:CITES]-(q:Quote)
       WHERE q.isPublic = true AND q.isApproved = true
       OPTIONAL MATCH (q)-[:QUOTE_OF]->(e:Entity)
       RETURN q { 
         .*, 
         createdAt: toString(q.createdAt),
         speaker: e.name,
         sourceTitle: null
       } AS quote
       ORDER BY q.createdAt DESC`,
      { sourceId }
    );
    
    // Get entities mentioned in quotes from this source (only published entities and quotes)
    const entitiesResult = await session.run(
      `MATCH (s:Source {id: $sourceId})<-[:CITES]-(q:Quote)-[:QUOTE_OF]->(e:Entity)
       WHERE q.isPublic = true AND q.isApproved = true
       AND COALESCE(e.status, 'pending') = 'published'
       WITH DISTINCT e
       RETURN e { .*, createdAt: toString(e.createdAt) } AS entity
       ORDER BY entity.name`,
      { sourceId }
    );
    
    const quotes = quotesResult.records.map(record => record.get('quote'));
    const entities = entitiesResult.records.map(record => record.get('entity'));
    
    // Images would come from source metadata or attached media
    const images: any[] = [];
    
    return {
      quotes,
      images,
      entities
    };
  } finally {
    await session.close();
  }
}