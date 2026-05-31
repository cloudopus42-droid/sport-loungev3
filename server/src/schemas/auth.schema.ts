import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email обязателен' })
    .email('Некорректный формат email'),
  password: z
    .string({ required_error: 'Пароль обязателен' })
    .min(6, 'Пароль должен содержать минимум 6 символов'),
  name: z
    .string({ required_error: 'Имя обязательно' })
    .min(1, 'Имя не может быть пустым'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email обязателен' })
    .email('Некорректный формат email'),
  password: z
    .string({ required_error: 'Пароль обязателен' })
    .min(1, 'Пароль обязателен'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
