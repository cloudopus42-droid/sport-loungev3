import { z } from 'zod';

export const createPromoSchema = z.object({
  title: z
    .string({ required_error: 'Заголовок обязателен' })
    .min(1, 'Заголовок не может быть пустым'),
  description: z
    .string({ required_error: 'Описание обязательно' })
    .min(1, 'Описание не может быть пустым'),
  discountPercent: z
    .number()
    .min(0, 'Скидка не может быть отрицательной')
    .max(100, 'Скидка не может превышать 100%')
    .optional(),
  badgeColor: z.string().optional().default('#00f2fe'),
  priority: z.number().int().optional().default(0),
  startDate: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.string().optional()),
  endDate: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.string().optional()),
  isActive: z.boolean().optional().default(true),
});

export type CreatePromoInput = z.infer<typeof createPromoSchema>;
