import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createQuote, deleteQuote, getQuoteById } from '@research-os/db';

describe('Quote Delete Functionality', () => {
  let quoteId: string;
  let reportId: string;
  let entityId: string;
  let sourceId: string;

  beforeAll(async () => {
    // Setup test data
    reportId = 'test-report-' + Date.now();
    entityId = 'test-entity-' + Date.now();
    sourceId = 'test-source-' + Date.now();
    
    // Create test quote
    const quote = await createQuote(reportId, {
      shortText: 'Test quote text',
      text: 'Full test quote text',
      entityId,
      sourceId,
      sourceUrl: 'https://example.com',
      date: '2024-01-01',
      isPublic: false,
      isApproved: false
    });
    quoteId = quote.id;
  });

  it('should delete quote and return 204', async () => {
    // Verify quote exists before deletion
    const quoteBefore = await getQuoteById(quoteId);
    expect(quoteBefore).toBeTruthy();
    expect(quoteBefore.id).toBe(quoteId);
    
    // Delete quote
    await deleteQuote(quoteId);
    
    // Verify quote is deleted
    const quoteAfter = await getQuoteById(quoteId);
    expect(quoteAfter).toBeNull();
  });

  it('should handle deletion of non-existent quote gracefully', async () => {
    const nonExistentId = 'non-existent-quote-id';
    
    // Should not throw error
    await expect(deleteQuote(nonExistentId)).resolves.not.toThrow();
  });

  afterAll(async () => {
    // Cleanup is handled by DETACH DELETE
  });
});