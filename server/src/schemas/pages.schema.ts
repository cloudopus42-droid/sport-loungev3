import { z } from 'zod';

export const createPageSchema = z.object({
  slug: z.string().min(1, 'Slug обязателен').max(200).regex(/^[a-z0-9-]+$/, 'Slug может содержать только латинские буквы, цифры и дефисы'),
  title: z.string().min(1, 'Заголовок обязателен').max(500),
  content: z.string().min(1, 'Содержимое обязательно'),
  meta_description: z.string().max(500).optional().default(''),
  is_published: z.boolean().optional().default(false),
  sort_order: z.number().int().min(0).optional().default(0),
});

export const updatePageSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug может содержать только латинские буквы, цифры и дефисы').optional(),
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  meta_description: z.string().max(500).optional(),
  is_published: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
