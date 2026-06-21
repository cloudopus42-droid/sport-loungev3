import { z } from 'zod';

export const createMenuSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200),
  category: z.string().min(1, 'Категория обязательна').max(100),
  description: z.string().max(2000).optional().default(''),
  price: z.number().min(0, 'Цена не может быть отрицательной'),
  image_url: z.string().url().optional().or(z.literal('')),
  is_available: z.boolean().optional().default(true),
  sort_order: z.number().int().min(0).optional().default(0),
});

export const updateMenuSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().min(0).optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  is_available: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
