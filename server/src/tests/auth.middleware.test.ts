import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { auth, JwtPayload } from '../middleware/auth';
import { config } from '../config/env';

function mockRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const payload: JwtPayload = { id: 'u1', email: 'a@b.com', role: 'user' };

describe('auth middleware', () => {
  it('rejects requests without an Authorization header', () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Токен авторизации не предоставлен',
      status: 401,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects headers that do not start with "Bearer "', () => {
    const req = { headers: { authorization: 'Basic abc' } } as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an invalid token', () => {
    const req = {
      headers: { authorization: 'Bearer not-a-real-token' },
    } as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Недействительный токен авторизации',
      status: 401,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a token signed with the wrong secret', () => {
    const token = jwt.sign(payload, 'a-completely-different-secret-value!!');
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts a valid token, attaches the payload, and calls next', () => {
    const token = jwt.sign(payload, config.jwtSecret);
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    auth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toMatchObject(payload);
  });
});
