import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database functions
vi.mock('@research-os/db/entity', () => ({
  updateEntityStatus: vi.fn(),
  getEntityContent: vi.fn(),
}));

import { updateEntityStatus, getEntityContent } from '@research-os/db/entity';
import { PATCH, GET } from '../app/api/entities/[id]/route';

describe('/api/entities/[id] API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PATCH /api/entities/[id]', () => {
    it('should update entity status successfully', async () => {
      const mockEntity = {
        id: 'entity-1',
        name: 'John Doe',
        type: 'person',
        status: 'published',
        createdAt: '2023-01-01T00:00:00Z',
      };

      (updateEntityStatus as any).mockResolvedValue(mockEntity);

      const request = new Request('http://localhost/api/entities/entity-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });

      const response = await PATCH(request, { params: { eid: 'entity-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockEntity);
      expect(updateEntityStatus).toHaveBeenCalledWith('entity-1', 'published');
    });

    it('should return 400 for invalid status', async () => {
      const request = new Request('http://localhost/api/entities/entity-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'invalid-status' }),
      });

      const response = await PATCH(request, { params: { eid: 'entity-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid status value');
      expect(updateEntityStatus).not.toHaveBeenCalled();
    });

    it('should return 404 when entity not found', async () => {
      (updateEntityStatus as any).mockResolvedValue(null);

      const request = new Request('http://localhost/api/entities/entity-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });

      const response = await PATCH(request, { params: { eid: 'entity-1' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Entity not found');
    });

    it('should return 500 on database error', async () => {
      (updateEntityStatus as any).mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost/api/entities/entity-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });

      const response = await PATCH(request, { params: { eid: 'entity-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should validate status enum values', async () => {
      const validStatuses = ['pending', 'approved', 'published'];
      
      for (const status of validStatuses) {
        const mockEntity = {
          id: 'entity-1',
          name: 'John Doe',
          type: 'person',
          status,
          createdAt: '2023-01-01T00:00:00Z',
        };

        (updateEntityStatus as any).mockResolvedValue(mockEntity);

        const request = new Request('http://localhost/api/entities/entity-1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });

        const response = await PATCH(request, { params: { eid: 'entity-1' } });
        expect(response.status).toBe(200);
      }
    });
  });

  describe('GET /api/entities/[id]', () => {
    it('should return entity content successfully', async () => {
      const mockContent = {
        quotes: [
          { id: 'quote-1', shortText: 'Test quote', sourceTitle: 'Example Source' }
        ],
        relatedEntities: [
          { id: 'entity-2', name: 'Related Entity' }
        ],
        sources: [
          { id: 'source-1', title: 'Example Source', url: 'https://example.com' }
        ]
      };

      (getEntityContent as any).mockResolvedValue(mockContent);

      const request = new Request('http://localhost/api/entities/entity-1');
      const response = await GET(request, { params: { eid: 'entity-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockContent);
      expect(getEntityContent).toHaveBeenCalledWith('entity-1');
    });

    it('should return 500 on database error', async () => {
      (getEntityContent as any).mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost/api/entities/entity-1');
      const response = await GET(request, { params: { eid: 'entity-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});