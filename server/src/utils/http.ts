import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async Express handler so any thrown error / rejected promise is
 * forwarded to the central errorHandler middleware via `next`, removing the
 * repetitive `try { ... } catch (error) { next(error); }` boilerplate that was
 * duplicated across every route handler.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => unknown | Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Removes keys whose value is `undefined` from an object, mutating and
 * returning it. Used to build partial Supabase update payloads without
 * overwriting existing columns with `undefined`.
 */
export function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  for (const key of Object.keys(obj)) {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  }
  return obj;
}
