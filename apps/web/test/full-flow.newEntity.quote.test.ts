import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  createEntityQuick, 
  deleteEntity, 
  createQuote, 
  getQuoteById,
  getReportEntities 
} from '@research-os/db';

describe('Full Flow: New Entity → Quote → Delete Entity', () => {
  let clientId: string;
  let reportId: string;
  let entityId: string;
  let sourceId: string;
  let quoteId: string;

  beforeAll(async () => {
    // Setup test data
    clientId = 'test-client-' + Date.now();
    reportId = 'test-report-' + Date.now();
    sourceId = 'test-source-' + Date.now();
  });

  it('should create entity, link to quote, then delete entity and detach quote', async () => {
    // Step 1: Create new entity
    const entity = await createEntityQuick(clientId, reportId, {
      name: 'New Test Speaker',
      type: 'person',
      primaryUrl: 'https://example.com'
    });
    entityId = entity.id;
    
    expect(entity.name).toBe('New Test Speaker');
    expect(entity.type).toBe('person');
    
    // Step 2: Create quote linked to entity
    const quote = await createQuote(reportId, {
      shortText: 'Quote from new speaker',
      text: 'Full quote from new speaker',
      entityId: entity.id,
      sourceId,
      sourceUrl: 'https://example.com',
      date: '2024-01-01',
      isPublic: false,
      isApproved: false
    });
    quoteId = quote.id;
    
    expect(quote.shortText).toBe('Quote from new speaker');
    
    // Step 3: Verify quote is linked to entity
    const linkedQuote = await getQuoteById(quoteId);
    expect(linkedQuote).toBeTruthy();
    expect(linkedQuote.entityId).toBe(entityId);
    
    // Step 4: Verify entity exists in report
    const entitiesBefore = await getReportEntities(reportId);
    const foundEntity = entitiesBefore.find(e => e.id === entityId);
    expect(foundEntity).toBeTruthy();
    
    // Step 5: Delete entity (should DETACH DELETE)
    await deleteEntity(entityId);
    
    // Step 6: Verify entity is deleted
    const entitiesAfter = await getReportEntities(reportId);
    const deletedEntity = entitiesAfter.find(e => e.id === entityId);
    expect(deletedEntity).toBeUndefined();
    
    // Step 7: Verify quote relationships are cleaned up
    const quoteAfter = await getQuoteById(quoteId);
    if (quoteAfter) {
      // Quote might still exist but should not be linked to deleted entity
      expect(quoteAfter.entityId).toBeNull();
    }
    // Note: Depending on implementation, quote might be deleted or just detached
  });

  it('should handle entity creation with minimal data', async () => {
    const minimalEntity = await createEntityQuick(clientId, reportId, {
      name: 'Minimal Speaker',
      type: 'other'
    });
    
    expect(minimalEntity.name).toBe('Minimal Speaker');
    expect(minimalEntity.type).toBe('other');
    expect(minimalEntity.primaryUrl).toBeUndefined();
    
    // Cleanup
    await deleteEntity(minimalEntity.id);
  });

  afterAll(async () => {
    // Cleanup any remaining test data
    // The DETACH DELETE should handle most cleanup
  });
});