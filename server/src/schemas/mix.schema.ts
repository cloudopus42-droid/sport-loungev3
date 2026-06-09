import { z } from 'zod';

export const createMixSchema = z.object({
  name: z
    .string({ required_error: 'Название обязательно' })
    .min(1, 'Название не может быть пустым'),
  manufacturer: z
    .string({ required_error: 'Производитель обязателен' })
    .min(1, 'Производитель не может быть пустым'),
  description: z.string().optional().default(''),
  flavors: z.array(z.string()).optional().default([]),
  strength: z
    .number()
    .int()
    .min(1, 'Крепость минимум 1')
    .max(10, 'Крепость максимум 10')
    .optional()
    .default(5),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

export type CreateMixInput = z.infer<typeof createMixSchema>;
