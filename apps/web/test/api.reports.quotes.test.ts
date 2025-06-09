import { describe, it, expect } from 'vitest';
import { quoteInsertSchema } from '@/lib/zodSchemas';

describe('Quote Insert Schema', () => {
  it('should validate a complete quote object', () => {
    const validQuote = {
      shortText: 'This is a valid short text',
      text: 'This is a longer text that meets the minimum requirements',
      author: 'John Doe',
      source: 'Test Source',
      sourceUrl: 'https://example.com',
      tags: ['tag1', 'tag2'],
      isPublic: true,
    };

    const result = quoteInsertSchema.safeParse(validQuote);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.shortText).toBe(validQuote.shortText);
      expect(result.data.text).toBe(validQuote.text);
      expect(result.data.isPublic).toBe(true);
    }
  });

  it('should fail validation for short text under 5 characters', () => {
    const invalidQuote = {
      shortText: 'Hi',
      text: 'This is a longer text that meets the minimum requirements',
    };

    const result = quoteInsertSchema.safeParse(invalidQuote);
    expect(result.success).toBe(false);
  });

  it('should fail validation for text under 10 characters', () => {
    const invalidQuote = {
      shortText: 'Valid short text',
      text: 'Short',
    };

    const result = quoteInsertSchema.safeParse(invalidQuote);
    expect(result.success).toBe(false);
  });

  it('should fail validation for invalid URL', () => {
    const invalidQuote = {
      shortText: 'Valid short text',
      text: 'This is a longer text that meets the minimum requirements',
      sourceUrl: 'not-a-url',
    };

    const result = quoteInsertSchema.safeParse(invalidQuote);
    expect(result.success).toBe(false);
  });

  it('should use default values for optional fields', () => {
    const minimalQuote = {
      shortText: 'Valid short text',
      text: 'This is a longer text that meets the minimum requirements',
    };

    const result = quoteInsertSchema.safeParse(minimalQuote);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
      expect(result.data.isPublic).toBe(false);
    }
  });
});