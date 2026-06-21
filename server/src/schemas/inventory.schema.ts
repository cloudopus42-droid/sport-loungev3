import { z } from 'zod';

export const createInventorySchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200),
  category: z.string().min(1, 'Категория обязательна').max(100),
  quantity: z.number().int().min(0, 'Количество не может быть отрицательным'),
  unit: z.string().max(50).optional().default('шт'),
  min_stock: z.number().int().min(0).optional().default(0),
  price: z.number().min(0).optional().default(0),
  supplier: z.string().max(200).optional().default(''),
  notes: z.string().max(1000).optional().default(''),
});

export const updateInventorySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  quantity: z.number().int().min(0).optional(),
  unit: z.string().max(50).optional(),
  min_stock: z.number().int().min(0).optional(),
  price: z.number().min(0).optional(),
  supplier: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
