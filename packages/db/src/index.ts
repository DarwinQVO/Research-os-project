import neo4j, { Driver } from 'neo4j-driver';

let driver: Driver | null = null;
let currentConfig: Neo4jConfig | null = null;

export interface Neo4jConfig {
  uri?: string;
  username?: string;
  password?: string;
}

function configsMatch(config1: Neo4jConfig | null, config2: Neo4jConfig): boolean {
  if (!config1) return false;
  return config1.uri === config2.uri && 
         config1.username === config2.username && 
         config1.password === config2.password;
}

export function getDriver(config?: Neo4jConfig): Driver {
  // Get effective configuration
  const effectiveConfig: Neo4jConfig = {
    uri: config?.uri || process.env.NEO4J_URI || 'neo4j://localhost:7687',
    username: config?.username || process.env.NEO4J_USERNAME || 'neo4j',
    password: config?.password || process.env.NEO4J_PASSWORD || 'password'
  };

  // Check if we need to create a new driver (either no driver exists or config changed)
  if (!driver || !configsMatch(currentConfig, effectiveConfig)) {
    // Close existing driver if any
    if (driver) {
      console.log('Configuration changed, closing existing driver');
      driver.close().catch(err => console.error('Error closing driver:', err));
    }

    console.log('Creating Neo4j driver with config:', {
      uri: effectiveConfig.uri,
      username: effectiveConfig.username,
      password: effectiveConfig.password ? '***' : 'not set'
    });

    driver = neo4j.driver(
      effectiveConfig.uri!, 
      neo4j.auth.basic(effectiveConfig.username!, effectiveConfig.password!)
    );
    
    currentConfig = effectiveConfig;
  }

  return driver;
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
    currentConfig = null;
  }
}

// Force reset the driver - useful for testing or when env vars change
export function resetDriver(): void {
  if (driver) {
    driver.close().catch(err => console.error('Error closing driver during reset:', err));
    driver = null;
    currentConfig = null;
  }
}

export { neo4j };
export * from './source';
export * from './quote';
export * from './entity';
export * from './client';
export * from './report';
