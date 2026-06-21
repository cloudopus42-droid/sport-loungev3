import { Request, Response, NextFunction } from 'express';
import { captureError } from '../services/errorMonitor';

export function errorMonitor(err: Error, req: Request, res: Response, next: NextFunction): void {
  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
  captureError(err, {
    route: `${req.method} ${req.path}`,
    userId: (req as any).user?.id,
    isCritical: statusCode >= 500,
  });
  next(err);
}
