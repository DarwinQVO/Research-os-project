import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createEntityQuick, deleteEntity, getReportEntities } from '@research-os/db';

describe('Entity Delete Functionality', () => {
  let clientId: string;
  let reportId: string;
  let entityId: string;

  beforeAll(async () => {
    // Setup test data
    clientId = 'test-client-' + Date.now();
    reportId = 'test-report-' + Date.now();
    
    // Create test entity
    const entity = await createEntityQuick(clientId, reportId, {
      name: 'Test Speaker',
      type: 'person',
      primaryUrl: 'https://example.com'
    });
    entityId = entity.id;
  });

  it('should delete entity and return 204', async () => {
    // Get initial count
    const entitiesBefore = await getReportEntities(reportId);
    const initialCount = entitiesBefore.length;
    
    // Delete entity
    await deleteEntity(entityId);
    
    // Verify deletion
    const entitiesAfter = await getReportEntities(reportId);
    expect(entitiesAfter.length).toBe(initialCount - 1);
    
    // Verify specific entity is gone
    const deletedEntity = entitiesAfter.find(e => e.id === entityId);
    expect(deletedEntity).toBeUndefined();
  });

  it('should handle deletion of non-existent entity gracefully', async () => {
    const nonExistentId = 'non-existent-entity-id';
    
    // Should not throw error
    await expect(deleteEntity(nonExistentId)).resolves.not.toThrow();
  });

  afterAll(async () => {
    // Cleanup is handled by DETACH DELETE
  });
});