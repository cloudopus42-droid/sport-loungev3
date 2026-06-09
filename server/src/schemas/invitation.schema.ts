import { z } from 'zod';

export const createInvitationSchema = z.object({
  title: z
    .string({ required_error: 'Заголовок обязателен' })
    .min(1, 'Заголовок не может быть пустым'),
  description: z
    .string({ required_error: 'Описание обязательно' })
    .min(1, 'Описание не может быть пустым'),
  dateTime: z.string({ required_error: 'Дата и время обязательны' }).min(1, 'Дата и время обязательны'),
  location: z.string().optional(),
  maxParticipants: z.number().int().min(1).optional(),
  status: z.enum(['draft', 'published']).optional().default('draft'),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
