import { getDriver } from './index';

export interface SourceInput {
  url: string;
  title: string;
  author?: string;
  publishedAt?: string;
  type: 'article' | 'video' | 'social' | 'other';
  description?: string;
  thumbnail?: string;
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
         createdAt: datetime()
       })
       MERGE (r)-[:HAS_SOURCE]->(s)
       RETURN s {.*}`,
      { 
        rid: reportId, 
        url: data.url,
        title: data.title,
        author: data.author || null,
        publishedAt: data.publishedAt || null,
        type: data.type || 'article',
        description: data.description || null,
        thumbnail: data.thumbnail || null
      }
    );
    
    return result.records[0].get(0);
  } finally {
    await session.close();
  }
}

export async function getSources(reportId: string) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      `MATCH (r:Report {id: $rid})-[:HAS_SOURCE]->(s:Source)
       RETURN s { .*, createdAt: toString(s.createdAt) } AS s
       ORDER BY s.createdAt DESC`,
      { rid: reportId }
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
       RETURN s {.*} LIMIT 1`,
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
      `MATCH (s:Source {id: $sid})<-[:FROM_SOURCE]-(q:Quote)
       RETURN q { .*, createdAt: toString(q.createdAt) } AS q
       ORDER BY q.createdAt DESC`,
      { sid: sourceId }
    );
    
    return result.records.map(record => record.get('q'));
  } finally {
    await session.close();
  }
}

export async function updateSource(id: string, data: Partial<SourceInput>) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      'MATCH (s:Source {id: $id}) ' +
      'SET s.url = COALESCE($url, s.url), ' +
      's.title = COALESCE($title, s.title), ' +
      's.author = COALESCE($author, s.author), ' +
      's.publishedAt = COALESCE($publishedAt, s.publishedAt), ' +
      's.type = COALESCE($type, s.type), ' +
      's.description = COALESCE($description, s.description), ' +
      's.thumbnail = COALESCE($thumbnail, s.thumbnail) ' +
      'RETURN s {.*}',
      { id, ...data }
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
  isPublic?: boolean;
  createdAt: string;
  quoteCount?: number;
}

export async function getPublishedSources(reportId: string): Promise<SourceMeta[]> {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      `MATCH (cl:Client)<-[:BELONGS_TO]-(r:Report {id: $reportId})-[:HAS_SOURCE]->(s:Source)
       OPTIONAL MATCH (s)<-[:FROM_SOURCE]-(q:Quote)
       RETURN s { 
         .*, 
         createdAt: toString(s.createdAt),
         quoteCount: count(q),
         isPublic: COALESCE(s.isPublic, true)
       } AS source
       ORDER BY source.createdAt DESC`,
      { reportId }
    );
    
    return result.records.map(record => record.get('source'));
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
    // Get quotes from this source
    const quotesResult = await session.run(
      `MATCH (s:Source {id: $sourceId})<-[:FROM_SOURCE]-(q:Quote)
       WHERE COALESCE(q.isPublic, true) = true
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
    
    // Get entities mentioned in quotes from this source
    const entitiesResult = await session.run(
      `MATCH (s:Source {id: $sourceId})<-[:FROM_SOURCE]-(q:Quote)-[:QUOTE_OF]->(e:Entity)
       RETURN DISTINCT e { .*, createdAt: toString(e.createdAt) } AS entity
       ORDER BY e.name`,
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