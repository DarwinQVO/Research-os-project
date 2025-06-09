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