import { getDriver } from './index';

export interface EntityData {
  id: string;
  name: string;
  type: 'person' | 'company' | 'industry' | 'other';
  primaryUrl?: string;
  confidence?: number;
}

export async function createEntity(entityData: EntityData) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      'MERGE (e:Entity {name: $name, type: $type}) ' +
      'ON CREATE SET e.id = $id, e.primaryUrl = $primaryUrl, e.confidence = $confidence, e.createdAt = datetime() ' +
      'ON MATCH SET e.primaryUrl = CASE WHEN $primaryUrl IS NOT NULL THEN $primaryUrl ELSE e.primaryUrl END, ' +
      'e.confidence = CASE WHEN $confidence IS NOT NULL THEN $confidence ELSE e.confidence END ' +
      'RETURN e {.*} LIMIT 1',
      entityData
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

export async function getReportEntities(reportId: string) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      'MATCH (r:Report {id: $reportId})-[:HAS_ENTITY]->(e:Entity) ' +
      'RETURN e {.*} ORDER BY e.name',
      { reportId }
    );
    
    return result.records.map(record => record.get(0));
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
    const result = await session.run(
      'MATCH (e:Entity {id: $id}) ' +
      'SET e.name = COALESCE($name, e.name), ' +
      'e.type = COALESCE($type, e.type), ' +
      'e.primaryUrl = COALESCE($primaryUrl, e.primaryUrl), ' +
      'e.confidence = COALESCE($confidence, e.confidence) ' +
      'RETURN e {.*}',
      { id, ...data }
    );
    
    return result.records[0]?.get(0) || null;
  } finally {
    await session.close();
  }
}