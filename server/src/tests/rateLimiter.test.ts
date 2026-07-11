import { Request, Response, NextFunction } from 'express';
import { rateLimiter } from '../middleware/rateLimiter';

function mockRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// Each test uses a unique IP so the module-level store does not leak between tests.
function mockReq(ip: string, path = '/api/test'): Request {
  return { ip, path, socket: {} } as unknown as Request;
}

describe('rateLimiter middleware', () => {
  it('allows requests up to the configured limit', () => {
    const limiter = rateLimiter(3, 60000);
    const req = mockReq('10.0.0.1');

    for (let i = 0; i < 3; i++) {
      const res = mockRes();
      const next = jest.fn() as NextFunction;
      limiter(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    }
  });

  it('blocks with 429 once the limit is exceeded', () => {
    const limiter = rateLimiter(2, 60000);
    const req = mockReq('10.0.0.2');

    limiter(req, mockRes(), jest.fn() as NextFunction);
    limiter(req, mockRes(), jest.fn() as NextFunction);

    const res = mockRes();
    const next = jest.fn() as NextFunction;
    limiter(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Слишком много запросов. Пожалуйста, попробуйте позже.',
      status: 429,
    });
  });

  it('tracks limits independently per IP + path key', () => {
    const limiter = rateLimiter(1, 60000);

    const resA = mockRes();
    const nextA = jest.fn() as NextFunction;
    limiter(mockReq('10.0.0.3', '/a'), resA, nextA);
    expect(nextA).toHaveBeenCalledTimes(1);

    const resB = mockRes();
    const nextB = jest.fn() as NextFunction;
    limiter(mockReq('10.0.0.3', '/b'), resB, nextB);
    expect(nextB).toHaveBeenCalledTimes(1);
    expect(resB.status).not.toHaveBeenCalled();
  });

  it('resets the window after windowMs elapses', () => {
    jest.useFakeTimers();
    try {
      const limiter = rateLimiter(1, 1000);
      const req = mockReq('10.0.0.4');

      const first = mockRes();
      const firstNext = jest.fn() as NextFunction;
      limiter(req, first, firstNext);
      expect(firstNext).toHaveBeenCalledTimes(1);

      const blocked = mockRes();
      limiter(req, blocked, jest.fn() as NextFunction);
      expect(blocked.status).toHaveBeenCalledWith(429);

      jest.advanceTimersByTime(1001);

      const afterReset = mockRes();
      const afterNext = jest.fn() as NextFunction;
      limiter(req, afterReset, afterNext);
      expect(afterNext).toHaveBeenCalledTimes(1);
      expect(afterReset.status).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('falls back to the socket remote address when req.ip is missing', () => {
    const limiter = rateLimiter(1, 60000);
    const req = {
      path: '/api/test',
      socket: { remoteAddress: '10.0.0.5' },
    } as unknown as Request;

    const res = mockRes();
    const next = jest.fn() as NextFunction;
    limiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
