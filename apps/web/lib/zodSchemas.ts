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

export const quoteInsertSchema = z.object({
  shortText: z.string().min(5).max(300),
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