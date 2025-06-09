import { getDriver } from './index';

export async function deleteReport(id: string) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      'MATCH (r:Report {id: $id}) DETACH DELETE r RETURN count(r) as deleted',
      { id }
    );
    
    return result.records[0].get('deleted').toNumber() > 0;
  } finally {
    await session.close();
  }
}

export async function createReport(clientId: string, title: string) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      'MATCH (c:Client {id: $clientId}) ' +
      'CREATE (r:Report {id: randomUUID(), title: $title, createdAt: datetime()}) ' +
      'MERGE (c)<-[:BELONGS_TO]-(r) ' +
      'RETURN r {.*} LIMIT 1',
      { clientId, title }
    );
    
    return result.records[0].get(0);
  } finally {
    await session.close();
  }
}