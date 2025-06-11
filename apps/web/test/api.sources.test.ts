import { test, expect } from '@playwright/test';

test.describe('Sources API', () => {
  const clientId = 'test-client-id';
  const reportId = 'test-report-id';
  const baseUrl = `/api/clients/${clientId}/reports/${reportId}/sources`;
  
  test('should create a new source', async ({ request }) => {
    const response = await request.post(baseUrl, {
      data: {
        url: 'https://example.com/article',
        title: 'Test Article',
        author: 'Test Author',
        type: 'article'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.source).toBeDefined();
    expect(data.source.url).toBe('https://example.com/article');
    expect(data.source.title).toBe('Test Article');
    expect(data.source.author).toBe('Test Author');
    expect(data.source.type).toBe('article');
  });
  
  test('should fetch metadata if title not provided', async ({ request }) => {
    const response = await request.post(baseUrl, {
      data: {
        url: 'https://example.com/auto-fetch'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.source).toBeDefined();
    expect(data.source.title).toBeDefined();
    expect(data.source.title).not.toBe('');
  });
  
  test('should validate URL format', async ({ request }) => {
    const response = await request.post(baseUrl, {
      data: {
        url: 'not-a-valid-url',
        title: 'Test'
      }
    });
    
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.details).toBeDefined();
  });
  
  test('should get all sources for a report', async ({ request }) => {
    // First create a source
    await request.post(baseUrl, {
      data: {
        url: 'https://example.com/source1',
        title: 'Source 1'
      }
    });
    
    // Then fetch all sources
    const response = await request.get(baseUrl);
    
    expect(response.ok()).toBeTruthy();
    
    const sources = await response.json();
    expect(Array.isArray(sources)).toBeTruthy();
  });
});

test.describe('Metadata Preview API', () => {
  test('should fetch metadata for a valid URL', async ({ request }) => {
    const response = await request.post('/api/metadata-preview', {
      data: {
        url: 'https://example.com/article'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const metadata = await response.json();
    expect(metadata.title).toBeDefined();
    expect(metadata.type).toBeDefined();
  });
  
  test('should handle invalid URLs', async ({ request }) => {
    const response = await request.post('/api/metadata-preview', {
      data: {
        url: 'not-a-url'
      }
    });
    
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.error).toBeDefined();
  });
  
  test('should return minimal metadata on fetch error', async ({ request }) => {
    const response = await request.post('/api/metadata-preview', {
      data: {
        url: 'https://non-existent-domain-12345.com/page'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const metadata = await response.json();
    expect(metadata.title).toBeDefined();
    expect(metadata.type).toBe('other');
  });
});

test.describe('Quote Source Linking API', () => {
  test('should link a quote to a source', async ({ request }) => {
    const quoteId = 'test-quote-id';
    const sourceId = 'test-source-id';
    
    const response = await request.post(`/api/quotes/${quoteId}/link-source`, {
      data: {
        sourceId: sourceId
      }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.quote).toBeDefined();
    expect(data.source).toBeDefined();
  });
  
  test('should validate sourceId', async ({ request }) => {
    const quoteId = 'test-quote-id';
    
    const response = await request.post(`/api/quotes/${quoteId}/link-source`, {
      data: {
        sourceId: ''
      }
    });
    
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});