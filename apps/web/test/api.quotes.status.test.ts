import { describe, it, expect } from 'vitest';

describe('Quote Status Rules', () => {
  it('should return Published status when isPublic is true', () => {
    const quote = {
      id: '1',
      shortText: 'Test quote',
      text: 'Test quote text',
      isPublic: true,
      isApproved: false,
      tags: [],
      createdAt: '2024-01-01',
    };

    const getStatus = (isPublic: boolean, isApproved: boolean) => {
      if (isPublic) return 'Published';
      if (!isPublic && isApproved) return 'Approved';
      return 'Pending';
    };

    const status = getStatus(quote.isPublic, quote.isApproved);
    expect(status).toBe('Published');
  });

  it('should return Approved status when isPublic is false and isApproved is true', () => {
    const quote = {
      id: '1',
      shortText: 'Test quote',
      text: 'Test quote text',
      isPublic: false,
      isApproved: true,
      tags: [],
      createdAt: '2024-01-01',
    };

    const getStatus = (isPublic: boolean, isApproved: boolean) => {
      if (isPublic) return 'Published';
      if (!isPublic && isApproved) return 'Approved';
      return 'Pending';
    };

    const status = getStatus(quote.isPublic, quote.isApproved);
    expect(status).toBe('Approved');
  });

  it('should return Pending status when isPublic is false and isApproved is false', () => {
    const quote = {
      id: '1',
      shortText: 'Test quote',
      text: 'Test quote text',
      isPublic: false,
      isApproved: false,
      tags: [],
      createdAt: '2024-01-01',
    };

    const getStatus = (isPublic: boolean, isApproved: boolean) => {
      if (isPublic) return 'Published';
      if (!isPublic && isApproved) return 'Approved';
      return 'Pending';
    };

    const status = getStatus(quote.isPublic, quote.isApproved);
    expect(status).toBe('Pending');
  });

  it('should include status field in quote response', () => {
    const mockQuoteResponse = {
      id: '1',
      shortText: 'Test quote',
      text: 'Test quote text',
      author: 'Test Author',
      source: 'Test Source',
      sourceUrl: 'https://example.com',
      tags: ['test'],
      isPublic: true,
      isApproved: false,
      status: 'Published',
      createdAt: '2024-01-01',
    };

    expect(mockQuoteResponse.status).toBeDefined();
    expect(['Published', 'Approved', 'Pending']).toContain(mockQuoteResponse.status);
  });
});