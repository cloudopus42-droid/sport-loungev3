import { z } from 'zod';

export const createStorySchema = z.object({
  mediaType: z.enum(['image', 'video']).optional().default('image'),
  durationSeconds: z
    .number()
    .int()
    .min(1, 'Длительность минимум 1 секунда')
    .max(60, 'Длительность максимум 60 секунд')
    .optional()
    .default(5),
  sortOrder: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateOrderSchema = z.array(
  z.object({
    id: z.string().min(1, 'ID обязателен'),
    sortOrder: z.number().int(),
  })
);

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
