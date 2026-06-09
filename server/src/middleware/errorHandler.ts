import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';

interface ErrorResponse {
  error: string;
  status: number;
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let response: ErrorResponse;

  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => {
      const field = e.path.join('.');
      return field ? `${field}: ${e.message}` : e.message;
    });
    response = {
      error: messages.join('; '),
      status: 400,
    };
  } else if (err instanceof MulterError) {
    let message: string;
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'Файл слишком большой. Максимальный размер: 10MB';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Слишком много файлов';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = `Неожиданное поле файла: ${err.field}`;
        break;
      default:
        message = `Ошибка загрузки файла: ${err.message}`;
    }
    response = {
      error: message,
      status: 400,
    };
  } else if ((err as any).code === '23505') {
    // Unique violation in PostgreSQL
    response = {
      error: 'Запись с таким значением уже существует',
      status: 409,
    };
  } else if ((err as any).code === '23503') {
    // Foreign key violation in PostgreSQL
    response = {
      error: 'Связанная запись не найдена',
      status: 400,
    };
  } else if ((err as any).code === '22P02') {
    // Invalid text representation (e.g., malformed UUID)
    response = {
      error: 'Неверный формат идентификатора',
      status: 400,
    };
  } else {
    console.error('Unhandled error:', err);
    response = {
      error: err.message || 'Внутренняя ошибка сервера',
      status: 500,
    };
  }

  res.status(response.status).json(response);
}
