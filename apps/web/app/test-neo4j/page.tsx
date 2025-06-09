'use client';

import { useState } from 'react';

export default function TestNeo4jPage() {
  const [envData, setEnvData] = useState<any>(null);
  const [neo4jData, setNeo4jData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testEnv = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug-env');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const text = await response.text();
      console.log('Raw response:', text);
      
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(text);
      setEnvData(data);
    } catch (error) {
      console.error('Error testing env:', error);
      setEnvData({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const testNeo4j = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ping-neo4j');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const text = await response.text();
      console.log('Raw Neo4j response:', text);
      
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(text);
      setNeo4jData(data);
    } catch (error) {
      console.error('Error testing Neo4j:', error);
      setNeo4jData({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Neo4j Connection Test</h1>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={testEnv}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Environment Variables
          </button>
          
          {envData && (
            <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
              {JSON.stringify(envData, null, 2)}
            </pre>
          )}
        </div>

        <div>
          <button
            onClick={testNeo4j}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Neo4j Connection
          </button>
          
          {neo4jData && (
            <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
              {JSON.stringify(neo4jData, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}