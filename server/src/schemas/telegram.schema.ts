import { z } from 'zod';

export const sendTelegramMessageSchema = z.object({
  chat_id: z.string().min(1, 'chat_id обязателен'),
  text: z.string().min(1, 'Текст сообщения обязателен').max(4000),
  parse_mode: z.enum(['Markdown', 'MarkdownV2', 'HTML']).optional().default('MarkdownV2'),
  disable_web_page_preview: z.boolean().optional().default(false),
});

export type SendTelegramMessageInput = z.infer<typeof sendTelegramMessageSchema>;
