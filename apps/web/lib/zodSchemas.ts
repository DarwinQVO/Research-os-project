import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(3, 'Client name must be at least 3 characters')
});

export const clientExtendedSchema = z.object({
  name: z.string().min(3, 'Client name must be at least 3 characters'),
  mandatorySources: z.array(z.string()).optional().default([]),
  context: z.string().optional().default(''),
  niches: z.array(z.string()).optional().default([]),
  interests: z.array(z.string()).optional().default([]),
  language: z.enum(['en', 'es']).optional().default('en')
});

export const reportSchema = z.object({
  title: z.string().min(3, 'Report title must be at least 3 characters')
});

export const entityNameSchema = z.object({
  name: z.string().min(2, 'Entity name must be at least 2 characters')
});

export const entityChosenSchema = z.object({
  chosen: z.object({
    name: z.string(),
    type: z.enum(['person', 'company', 'industry', 'other']),
    primaryUrl: z.string().optional()
  })
});

export const entityStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'published'])
});

export const entityEditSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  type: z.enum(['person', 'company', 'industry', 'other']),
  description: z.string().max(160, 'Description must be 160 characters or less').optional(),
  primaryUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal(''))
});

export const quoteInsertSchema = z.object({
  shortText: z.string().min(5),  // Removed max(300) limit
  text: z.string().min(10),
  entityId: z.string().min(1),  // Changed from uuid() to just string
  sourceId: z.string().min(1),  // Changed from uuid() to just string
  sourceUrl: z.string().url(),
  date: z.string().max(20).optional().transform(val => val || undefined),
  isPublic: z.boolean().default(false),
  isApproved: z.boolean().default(false),
});

// Legacy schema for backward compatibility
export const legacyQuoteInsertSchema = z.object({
  shortText: z.string().min(5),  // Removed max(300) limit
  text: z.string().min(10),
  author: z.string().optional().transform(val => val || undefined),
  source: z.string().optional().transform(val => val || undefined),
  sourceUrl: z.string().optional().transform(val => {
    if (!val || val.trim() === '') return undefined;
    // Basic URL validation
    try {
      new URL(val);
      return val;
    } catch {
      return undefined;
    }
  }),
  date: z.string().max(20).optional().transform(val => val || undefined),
  isPublic: z.boolean().default(false),
  isApproved: z.boolean().default(false),
});

export const quoteStatusSchema = quoteInsertSchema.extend({
  status: z.enum(['Published', 'Approved', 'Pending'])
});

export const sourceUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'published'])
});