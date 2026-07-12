function getBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const { protocol, hostname, port } = window.location;
  if (port === '5000' || port === '') return '';
  return `${protocol}//${hostname}:5000`;
}

function normalizeKeys(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (obj instanceof Date || obj instanceof RegExp || obj instanceof Blob || obj instanceof File) return obj;
  if (Array.isArray(obj)) {
    return obj.map(normalizeKeys);
  }
  const normalized: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      normalized[key] = normalizeKeys(obj[key]);
    }
  }
  if (normalized.id !== undefined && normalized._id === undefined) {
    normalized._id = normalized.id;
  }
  if (normalized._id !== undefined && normalized.id === undefined) {
    normalized.id = normalized._id;
  }
  return normalized;
}

export interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

interface ApiFunction {
  <T = any>(endpoint: string, options?: ApiOptions): Promise<T>;
  get<T = any>(endpoint: string, options?: ApiOptions): Promise<T>;
  post<T = any>(endpoint: string, body?: any, options?: ApiOptions): Promise<T>;
  put<T = any>(endpoint: string, body?: any, options?: ApiOptions): Promise<T>;
  delete<T = any>(endpoint: string, options?: ApiOptions): Promise<T>;
}

async function apiImpl<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let url = `${getBaseUrl()}${endpoint}`;

  if (options.params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) searchParams.set(key, String(value));
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  let body: BodyInit | undefined;
  if (options.body) {
    if (options.body instanceof FormData) {
      body = options.body;
      delete headers['Content-Type'];
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body,
    signal: options.signal,
  });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const base = import.meta.env.BASE_URL;
      if (window.location.pathname.includes('/admin')) {
        window.location.href = `${base}login`;
      }
    }
    const errBody = await res.json().catch(() => ({}));
    const err: any = new Error(errBody.error || `HTTP ${res.status}`);
    err.response = { data: errBody, status: res.status };
    throw err;
  }

  const text = await res.text();
  if (!text) return undefined as unknown as T;
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response from ${endpoint}`);
  }
  const normalized = normalizeKeys(json) as Record<string, unknown>;
  // Auto-unwrap paginated responses for backwards compatibility
  if (normalized && typeof normalized === 'object' && 'data' in normalized && 'pagination' in normalized) {
    const p = normalized as { data: unknown[]; pagination: { page: number; [k: string]: unknown } };
    if (Array.isArray(p.data) && p.pagination?.page) {
      return Object.assign(p.data, { _pagination: p.pagination }) as T;
    }
  }
  return normalized as T;
}

const api: ApiFunction = Object.assign(apiImpl, {
  get: <T = any>(endpoint: string, options?: ApiOptions) =>
    apiImpl<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any, options?: ApiOptions) =>
    apiImpl<T>(endpoint, { ...options, method: 'POST', body }),
  put: <T = any>(endpoint: string, body?: any, options?: ApiOptions) =>
    apiImpl<T>(endpoint, { ...options, method: 'PUT', body }),
  delete: <T = any>(endpoint: string, options?: ApiOptions) =>
    apiImpl<T>(endpoint, { ...options, method: 'DELETE' }),
}) as ApiFunction;

export { api };
export default api;
