import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

describe('Link Preview API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return link preview data with title and image', async () => {
    // Mock HTML response with Open Graph tags
    const mockHtml = `
      <html>
        <head>
          <meta property="og:title" content="Example Article Title" />
          <meta property="og:description" content="This is an example article description" />
          <meta property="og:image" content="https://example.com/image.jpg" />
          <title>Example Title</title>
        </head>
      </html>
    `;

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    });

    // Import the API handler
    const { GET } = await import('../app/api/link-preview/route');
    
    const request = new Request('http://localhost/api/link-preview?url=https://example.com');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      title: 'Example Article Title',
      description: 'This is an example article description',
      image: 'https://example.com/image.jpg',
      favicon: 'https://www.google.com/s2/favicons?domain=example.com&sz=64',
      type: 'website'
    });
  });

  it('should return 400 for missing URL parameter', async () => {
    const { GET } = await import('../app/api/link-preview/route');
    
    const request = new Request('http://localhost/api/link-preview');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('URL parameter is required');
  });

  it('should return 400 for invalid URL format', async () => {
    const { GET } = await import('../app/api/link-preview/route');
    
    const request = new Request('http://localhost/api/link-preview?url=invalid-url');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid URL format');
  });

  it('should fallback to domain name when fetch fails', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Fetch failed'));

    const { GET } = await import('../app/api/link-preview/route');
    
    const request = new Request('http://localhost/api/link-preview?url=https://example.com');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      title: 'example.com',
      description: '',
      image: '',
      favicon: 'https://www.google.com/s2/favicons?domain=example.com&sz=64',
      type: 'website'
    });
  });

  it('should include cache headers in response', async () => {
    const mockHtml = '<html><title>Test</title></html>';
    
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    });

    const { GET } = await import('../app/api/link-preview/route');
    
    const request = new Request('http://localhost/api/link-preview?url=https://example.com');
    const response = await GET(request);

    expect(response.headers.get('Cache-Control')).toBe('s-maxage=86400, stale-while-revalidate');
  });
});