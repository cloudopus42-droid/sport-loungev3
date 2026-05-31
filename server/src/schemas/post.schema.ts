import { z } from 'zod';

export const createPostSchema = z.object({
  title: z
    .string({ required_error: 'Заголовок обязателен' })
    .min(1, 'Заголовок не может быть пустым'),
  description: z.string().optional().default(''),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
