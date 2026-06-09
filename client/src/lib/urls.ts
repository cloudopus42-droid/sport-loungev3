/**
 * Returns the dynamic API base URL.
 * Works on localhost, LAN IP, and via tunnels like localtunnel/ngrok.
 * When served from port 5000 (SPA via Express), returns empty string (same origin).
 */
export function getApiBase(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const { protocol, hostname, port } = window.location;
  if (port === '5000' || port === '') return '';
  return `${protocol}//${hostname}:5000`;
}

export const PREMIUM_PLACEHOLDER_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgNDAwIDQwMCI+PGRlZnM+PHJhZGlhbEdyYWRpZW50IGlkPSJnIiBjeD0iNTAlIiBjeT0iNTAlIiByPSI1MCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMyYTFkMDgiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMxMzEzMTMiLz48L3JhZGlhbEdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTUwLCAxMDApIiBzdHJva2U9IiNGRkJGMDAiIHN0cm9rZS13aWR0aD0iMS41IiBmaWxsPSJub25lIiBvcGFjaXR5PSIwLjM1Ij48cGF0aCBkPSJNNTAsNDAgQzUwLDIwIDMwLDEwIDUwLDAgQzcwLDEwIDUwLDIwIDUwLDQwIFoiIGZpbGw9IiNGRkJGMDAiIG9wYWNpdHk9IjAuMSIvPjxwYXRoIGQ9Ik00MCw1MCBDNDAsMzUgNjAsMzUgNjAsNTAgWiIvPjxyZWN0IHg9IjQ1IiB5PSI1MCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjgwIiByeD0iMyIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMTQwIiByPSIyNSIgc3Ryb2tlLWRhc2hhcnJheT0iNCAyIi8+PHBhdGggZD0iTTI1LDE0MCBMNzUsMTQwIi8+PHBhdGggZD0iTTUwLDE2NSBMNTAsMTgwIEwyMCwyMDAiLz48L2c+PHRleHQgeD0iNTAlIiB5PSI4NSUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSInUGxheWZhaXIgRGlzcGxheScsIHNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZlMmFiIiBsZXR0ZXItc3BhY2luZz0iNCIgb3BhY2l0eT0iMC42Ij5TUE9SVCBMT1VOR0U8L3RleHQ+PC9zdmc+';

/**
 * Resolves an image URL that may be relative (/uploads/...) or absolute (https://...).
 */
export function resolveImageUrl(url: string): string {
  if (!url) return PREMIUM_PLACEHOLDER_SVG;
  if (url.startsWith('http')) return url;
  if (url.startsWith('data:')) return url;
  // If absolute path but lacks host
  if (url.startsWith('/uploads')) {
    return `${getApiBase()}${url}`;
  }
  return url;
}
