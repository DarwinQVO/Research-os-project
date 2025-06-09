import { describe, it, expect } from 'vitest';
import { clientSchema } from '../lib/zodSchemas';

describe('Client Schema Validation', () => {
  it('should accept valid client names', () => {
    const validInput = { name: 'Test Client' };
    const result = clientSchema.safeParse(validInput);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Test Client');
    }
  });

  it('should reject names that are too short', () => {
    const invalidInput = { name: 'ab' };
    const result = clientSchema.safeParse(invalidInput);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Client name must be at least 3 characters');
    }
  });

  it('should reject missing name field', () => {
    const invalidInput = {};
    const result = clientSchema.safeParse(invalidInput);
    
    expect(result.success).toBe(false);
  });
});