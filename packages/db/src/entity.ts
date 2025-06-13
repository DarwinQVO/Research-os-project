import { getDriver } from './index';

export type EntityStatus = 'pending' | 'approved' | 'published';

export interface EntityData {
  id: string;
  name: string;
  type: 'person' | 'company' | 'industry' | 'other';
  primaryUrl?: string;
  confidence?: number;
  status?: EntityStatus;
  avatarUrl?: string;
  description?: string;
  createdAt?: string;
}

export interface Entity {
  id: string;
  name: string;
  avatarUrl?: string;
  primaryUrl?: string;
  description?: string;
  status: EntityStatus;
  type: 'person' | 'company' | 'industry' | 'other';
  createdAt: string;
}

export async function createEntity(reportId: string, entityData: Omit<EntityData, 'id' | 'createdAt'>) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const entityId = `entity_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const result = await session.run(
      'MATCH (r:Report {id: $reportId}) ' +
      'MERGE (e:Entity {name: $name, type: $type}) ' +
      'ON CREATE SET e.id = $entityId, e.primaryUrl = $primaryUrl, e.confidence = $confidence, ' +
      'e.status = $status, e.avatarUrl = $avatarUrl, e.description = $description, e.createdAt = datetime() ' +
      'ON MATCH SET e.primaryUrl = CASE WHEN $primaryUrl IS NOT NULL THEN $primaryUrl ELSE e.primaryUrl END, ' +
      'e.confidence = CASE WHEN $confidence IS NOT NULL THEN $confidence ELSE e.confidence END, ' +
      'e.status = COALESCE($status, e.status, "pending"), ' +
      'e.avatarUrl = CASE WHEN $avatarUrl IS NOT NULL THEN $avatarUrl ELSE e.avatarUrl END, ' +
      'e.description = CASE WHEN $description IS NOT NULL THEN $description ELSE e.description END ' +
      'MERGE (r)-[:HAS_ENTITY]->(e) ' +
      'RETURN e { .*, status: COALESCE(e.status, "pending"), createdAt: toString(e.createdAt) } LIMIT 1',
      { 
        reportId,
        entityId,
        name: entityData.name,
        type: entityData.type,
        primaryUrl: entityData.primaryUrl || null,
        confidence: entityData.confidence || null,
        status: entityData.status || 'pending',
        avatarUrl: entityData.avatarUrl || null,
        description: entityData.description || null
      }
    );
    
    return result.records[0].get(0);
  } finally {
    await session.close();
  }
}

export async function linkReportToEntity(reportId: string, entityId: string) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      'MATCH (r:Report {id: $reportId}), (e:Entity {id: $entityId}) ' +
      'MERGE (r)-[:HAS_ENTITY]->(e) ' +
      'RETURN e {.*} LIMIT 1',
      { reportId, entityId }
    );
    
    return result.records[0]?.get(0) || null;
  } finally {
    await session.close();
  }
}

export async function getReportEntity(reportId: string) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      'MATCH (r:Report {id: $reportId})-[:HAS_ENTITY]->(e:Entity) ' +
      'RETURN e {.*} LIMIT 1',
      { reportId }
    );
    
    return result.records[0]?.get(0) || null;
  } finally {
    await session.close();
  }
}

export async function findEntity(name: string, type: string) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      'MATCH (e:Entity {name: $name, type: $type}) ' +
      'RETURN e {.*} LIMIT 1',
      { name, type }
    );
    
    return result.records[0]?.get(0) || null;
  } finally {
    await session.close();
  }
}

export async function getReportEntities(reportId: string, status?: EntityStatus) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const whereClause = status ? 'WHERE COALESCE(e.status, "pending") = $status' : '';
    const result = await session.run(
      `MATCH (r:Report {id: $reportId})-[:HAS_ENTITY]->(e:Entity)
       ${whereClause}
       RETURN e { .*, status: COALESCE(e.status, 'pending'), createdAt: toString(e.createdAt) } AS e
       ORDER BY e.name`,
      { reportId, status }
    );
    
    return result.records.map(record => record.get('e'));
  } finally {
    await session.close();
  }
}

export async function getPublishedEntities(reportId: string): Promise<Entity[]> {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      `MATCH (r:Report {id: $reportId})-[:HAS_ENTITY]->(e:Entity)
       WHERE COALESCE(e.status, 'pending') = 'published'
       OPTIONAL MATCH (e)<-[:QUOTE_OF]-(q:Quote)
       WITH e, count(q) AS quoteCount
       OPTIONAL MATCH (e)<-[:QUOTE_OF]-(q2:Quote)-[:CITES]->(s:Source)
       WITH e, quoteCount, count(DISTINCT s) AS sourceCount
       RETURN e { 
         .*, 
         status: COALESCE(e.status, 'pending'),
         createdAt: toString(e.createdAt)
       } AS entity,
       quoteCount,
       sourceCount
       ORDER BY entity.name`,
      { reportId }
    );
    
    return result.records.map(record => {
      const entity = record.get('entity');
      const quoteCount = record.get('quoteCount');
      const sourceCount = record.get('sourceCount');
      return {
        ...entity,
        quoteCount: quoteCount?.toNumber ? quoteCount.toNumber() : quoteCount,
        sourceCount: sourceCount?.toNumber ? sourceCount.toNumber() : sourceCount
      };
    });
  } finally {
    await session.close();
  }
}

export async function createEntityQuick(clientId: string, reportId: string, data: Omit<EntityData, 'id'>) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const entityId = `entity_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const result = await session.run(
      'MATCH (c:Client {id: $clientId})-[:HAS_REPORT]->(r:Report {id: $reportId}) ' +
      'CREATE (e:Entity {id: $entityId, name: $name, type: $type, primaryUrl: $primaryUrl, confidence: $confidence, createdAt: datetime()}) ' +
      'CREATE (r)-[:HAS_ENTITY]->(e) ' +
      'RETURN e {.*}',
      { 
        clientId, 
        reportId, 
        entityId,
        name: data.name,
        type: data.type,
        primaryUrl: data.primaryUrl || null,
        confidence: data.confidence || null
      }
    );
    
    return result.records[0].get(0);
  } finally {
    await session.close();
  }
}

export async function deleteEntity(id: string) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    await session.run(
      'MATCH (e:Entity {id: $id}) ' +
      'DETACH DELETE e',
      { id }
    );
  } finally {
    await session.close();
  }
}

export async function updateEntity(id: string, data: Partial<Omit<EntityData, 'id'>>) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    // Build dynamic SET clause based on provided data
    const setClause = [];
    const params: any = { id };
    
    if (data.name !== undefined) {
      setClause.push('e.name = $name');
      params.name = data.name;
    }
    if (data.type !== undefined) {
      setClause.push('e.type = $type');
      params.type = data.type;
    }
    if (data.primaryUrl !== undefined) {
      setClause.push('e.primaryUrl = $primaryUrl');
      params.primaryUrl = data.primaryUrl;
    }
    if (data.confidence !== undefined) {
      setClause.push('e.confidence = $confidence');
      params.confidence = data.confidence;
    }
    if (data.status !== undefined) {
      setClause.push('e.status = $status');
      params.status = data.status;
    }
    if (data.avatarUrl !== undefined) {
      setClause.push('e.avatarUrl = $avatarUrl');
      params.avatarUrl = data.avatarUrl;
    }
    if (data.description !== undefined) {
      setClause.push('e.description = $description');
      params.description = data.description;
    }
    
    if (setClause.length === 0) {
      // No fields to update, just return the existing entity
      const result = await session.run(
        'MATCH (e:Entity {id: $id}) ' +
        'RETURN e { .*, status: COALESCE(e.status, "pending"), createdAt: toString(e.createdAt) }',
        { id }
      );
      return result.records[0]?.get(0) || null;
    }
    
    const result = await session.run(
      'MATCH (e:Entity {id: $id}) ' +
      'SET ' + setClause.join(', ') + ' ' +
      'RETURN e { .*, status: COALESCE(e.status, "pending"), createdAt: toString(e.createdAt) }',
      params
    );
    
    return result.records[0]?.get(0) || null;
  } finally {
    await session.close();
  }
}

export async function updateEntityStatus(entityId: string, status: EntityStatus) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      'MATCH (e:Entity {id: $entityId}) ' +
      'SET e.status = $status ' +
      'RETURN e { .*, status: e.status, createdAt: toString(e.createdAt) }',
      { entityId, status }
    );
    
    return result.records[0]?.get(0) || null;
  } finally {
    await session.close();
  }
}

export async function getEntityContent(entityId: string) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    // Get quotes from this entity (only published ones)
    const quotesResult = await session.run(
      `MATCH (e:Entity {id: $entityId})<-[:QUOTE_OF]-(q:Quote)
       WHERE q.isPublic = true AND q.isApproved = true
       OPTIONAL MATCH (q)-[:CITES]->(s:Source)
       RETURN q { 
         .*, 
         createdAt: toString(q.createdAt),
         sourceTitle: s.title,
         sourceUrl: s.url
       } AS quote
       ORDER BY q.createdAt DESC`,
      { entityId }
    );
    
    // Get related entities (through shared quotes, only published entities)
    const entitiesResult = await session.run(
      `MATCH (e1:Entity {id: $entityId})<-[:QUOTE_OF]-(q:Quote)-[:QUOTE_OF]->(e2:Entity)
       WHERE e1 <> e2 
       AND q.isPublic = true AND q.isApproved = true
       AND COALESCE(e2.status, 'pending') = 'published'
       WITH DISTINCT e2
       RETURN e2 { .*, createdAt: toString(e2.createdAt) } AS entity
       ORDER BY entity.name
       LIMIT 10`,
      { entityId }
    );
    
    // Get sources (through quotes, only published sources)
    const sourcesResult = await session.run(
      `MATCH (e:Entity {id: $entityId})<-[:QUOTE_OF]-(q:Quote)-[:CITES]->(s:Source)
       WHERE q.isPublic = true AND q.isApproved = true
       AND COALESCE(s.status, 'pending') = 'published'
       WITH DISTINCT s
       RETURN s { .*, createdAt: toString(s.createdAt) } AS source
       ORDER BY source.title
       LIMIT 10`,
      { entityId }
    );
    
    const quotes = quotesResult.records.map(record => record.get('quote'));
    const entities = entitiesResult.records.map(record => record.get('entity'));
    const sources = sourcesResult.records.map(record => record.get('source'));
    
    return {
      quotes,
      relatedEntities: entities,
      sources
    };
  } finally {
    await session.close();
  }
}