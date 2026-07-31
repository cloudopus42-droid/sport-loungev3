import { Request } from 'express';
import { getPagination, paginatedResponse } from '../utils/pagination';

function mockReq(query: Record<string, unknown> = {}): Request {
  return { query } as unknown as Request;
}

describe('getPagination', () => {
  it('returns defaults when no query params are provided', () => {
    expect(getPagination(mockReq())).toEqual({ page: 1, limit: 50, offset: 0 });
  });

  it('parses valid page and limit and computes offset', () => {
    expect(getPagination(mockReq({ page: '3', limit: '20' }))).toEqual({
      page: 3,
      limit: 20,
      offset: 40,
    });
  });

  it('honors a custom default limit', () => {
    const result = getPagination(mockReq({ page: '2' }), 10);
    expect(result).toEqual({ page: 2, limit: 10, offset: 10 });
  });

  it('clamps page to a minimum of 1 for zero or negative values', () => {
    expect(getPagination(mockReq({ page: '0' })).page).toBe(1);
    expect(getPagination(mockReq({ page: '-5' })).page).toBe(1);
  });

  it('treats a zero limit as falsy and falls back to the default', () => {
    expect(getPagination(mockReq({ limit: '0' })).limit).toBe(50);
  });

  it('clamps a negative limit to at least 1', () => {
    expect(getPagination(mockReq({ limit: '-10' })).limit).toBe(1);
  });

  it('clamps limit to the maxLimit', () => {
    expect(getPagination(mockReq({ limit: '9999' })).limit).toBe(200);
    expect(getPagination(mockReq({ limit: '9999' }), 50, 100).limit).toBe(100);
  });

  it('falls back to defaults for non-numeric input', () => {
    expect(getPagination(mockReq({ page: 'abc', limit: 'xyz' }))).toEqual({
      page: 1,
      limit: 50,
      offset: 0,
    });
  });
});

describe('paginatedResponse', () => {
  const params = { page: 2, limit: 10, offset: 10 };

  it('wraps data with pagination metadata and computes totalPages', () => {
    const data = [{ id: 1 }, { id: 2 }];
    expect(paginatedResponse(data, 25, params)).toEqual({
      data,
      pagination: { page: 2, limit: 10, total: 25, totalPages: 3 },
    });
  });

  it('uses data length as total when total is null', () => {
    const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const result = paginatedResponse(data, null, params);
    expect(result.pagination.total).toBe(3);
    expect(result.pagination.totalPages).toBe(1);
  });

  it('reports a single page when total is zero', () => {
    const result = paginatedResponse([], 0, params);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(1);
  });
});
