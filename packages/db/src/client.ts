import { getDriver } from './index';

interface ClientData {
  id: string;
  name: string;
  mandatorySources?: string[];
  context?: string;
  niches?: string[];
  interests?: string[];
  language?: 'en' | 'es';
}

export async function createClient(clientData: ClientData) {
  const driver = getDriver();
  const session = driver.session();
  
  const defaultData = {
    mandatorySources: [],
    context: '',
    niches: [],
    interests: [],
    language: 'en',
    ...clientData
  };
  
  try {
    const result = await session.run(
      'CREATE (c:Client {id: $id, name: $name, mandatorySources: $mandatorySources, context: $context, niches: $niches, interests: $interests, language: $language}) RETURN c {.*} LIMIT 1',
      defaultData
    );
    
    return result.records[0].get(0);
  } finally {
    await session.close();
  }
}

export async function getAllClients() {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      'MATCH (c:Client) RETURN c {.*} ORDER BY c.name'
    );
    
    return result.records.map(record => record.get(0));
  } finally {
    await session.close();
  }
}

export async function updateClient(id: string, updates: Partial<Omit<ClientData, 'id'>>) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const setClause = Object.keys(updates)
      .map(key => `c.${key} = $${key}`)
      .join(', ');
    
    const result = await session.run(
      `MATCH (c:Client {id: $id}) SET ${setClause} RETURN c {.*} LIMIT 1`,
      { id, ...updates }
    );
    
    return result.records[0]?.get(0) || null;
  } finally {
    await session.close();
  }
}

export async function getClientWithReports(id: string) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      'MATCH (c:Client {id: $id}) OPTIONAL MATCH (r:Report)-[:BELONGS_TO]->(c) RETURN c {.*} as client, collect(r {.*}) as reports',
      { id }
    );
    
    return result.records[0] ? { client: result.records[0].get('client'), reports: result.records[0].get('reports') } : null;
  } finally {
    await session.close();
  }
}

export async function deleteClient(id: string) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      'MATCH (c:Client {id: $id}) DETACH DELETE c RETURN count(c) as deleted',
      { id }
    );
    
    return result.records[0].get('deleted').toNumber() > 0;
  } finally {
    await session.close();
  }
}