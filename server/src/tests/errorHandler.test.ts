import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { MulterError } from 'multer';
import { errorHandler } from '../middleware/errorHandler';

function mockRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const req = {} as Request;
const next = jest.fn() as NextFunction;

function run(err: Error) {
  const res = mockRes();
  errorHandler(err, req, res, next);
  return res;
}

describe('errorHandler middleware', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('formats ZodError issues into a 400 with joined field messages', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const parsed = schema.safeParse({ age: 'nope' });
    const err = (parsed as { error: z.ZodError }).error;

    const res = run(err);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.status).toBe(400);
    expect(body.error).toContain('name');
    expect(body.error).toContain('age');
    expect(body.error).toContain(';');
  });

  it('maps a MulterError file-size limit to a friendly 400 message', () => {
    const res = run(new MulterError('LIMIT_FILE_SIZE'));

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Файл слишком большой. Максимальный размер: 10MB',
      status: 400,
    });
  });

  it('maps a MulterError file-count limit to a friendly 400 message', () => {
    const res = run(new MulterError('LIMIT_FILE_COUNT'));

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Слишком много файлов',
      status: 400,
    });
  });

  it('maps an unhandled MulterError code to a generic 400 upload message', () => {
    const res = run(new MulterError('LIMIT_PART_COUNT'));

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.status).toBe(400);
    expect(body.error).toContain('Ошибка загрузки файла');
  });

  it('maps a MulterError unexpected-file to a 400 including the field name', () => {
    const res = run(new MulterError('LIMIT_UNEXPECTED_FILE', 'avatar'));

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.status).toBe(400);
    expect(body.error).toContain('avatar');
  });

  it('maps a postgres unique-violation (23505) to 409', () => {
    const err = Object.assign(new Error('dup'), { code: '23505' });
    const res = run(err);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Запись с таким значением уже существует',
      status: 409,
    });
  });

  it('maps a postgres foreign-key violation (23503) to 400', () => {
    const err = Object.assign(new Error('fk'), { code: '23503' });
    const res = run(err);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Связанная запись не найдена',
      status: 400,
    });
  });

  it('maps an invalid-text-representation (22P02) to 400', () => {
    const err = Object.assign(new Error('bad uuid'), { code: '22P02' });
    const res = run(err);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Неверный формат идентификатора',
      status: 400,
    });
  });

  it('falls back to 500 with the error message for unknown errors', () => {
    const res = run(new Error('boom'));

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'boom', status: 500 });
  });

  it('uses a default message when an unknown error has no message', () => {
    const res = run(new Error());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Внутренняя ошибка сервера',
      status: 500,
    });
  });
});
