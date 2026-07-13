import { Request, Response, NextFunction } from 'express';
import { isAdmin } from '../middleware/isAdmin';

function mockRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('isAdmin middleware', () => {
  it('rejects requests with no authenticated user', () => {
    const req = {} as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Доступ запрещён', status: 403 });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a non-admin user', () => {
    const req = { user: { id: 'u1', email: 'a@b.com', role: 'user' } } as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows an admin user through', () => {
    const req = { user: { id: 'u1', email: 'a@b.com', role: 'admin' } } as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    isAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
