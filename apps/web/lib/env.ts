// Environment variable validation and initialization
// This file helps ensure environment variables are loaded correctly

const requiredEnvVars = [
  'NEO4J_URI',
  'NEO4J_USERNAME',
  'NEO4J_PASSWORD'
] as const;

type EnvVarName = typeof requiredEnvVars[number];

// Validate environment variables
export function validateEnv(): Record<EnvVarName, string> {
  const env: Partial<Record<EnvVarName, string>> = {};
  const missing: string[] = [];

  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (!value) {
      missing.push(varName);
    } else {
      env[varName] = value;
    }
  }

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    console.error('Make sure .env.local file exists and contains all required variables');
    
    // In development, log current env vars for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Current environment variables:');
      console.log('NEO4J_URI:', process.env.NEO4J_URI || 'NOT SET');
      console.log('NEO4J_USERNAME:', process.env.NEO4J_USERNAME || 'NOT SET');
      console.log('NEO4J_PASSWORD:', process.env.NEO4J_PASSWORD ? '***SET***' : 'NOT SET');
    }
  }

  return env as Record<EnvVarName, string>;
}

// Export validated environment variables
export const env = (() => {
  try {
    return validateEnv();
  } catch (error) {
    console.warn('Environment validation failed, using process.env directly');
    return {
      NEO4J_URI: process.env.NEO4J_URI!,
      NEO4J_USERNAME: process.env.NEO4J_USERNAME!,
      NEO4J_PASSWORD: process.env.NEO4J_PASSWORD!
    };
  }
})();