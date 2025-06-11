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