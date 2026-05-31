/**
 * Returns the dynamic API base URL.
 * Works on localhost, LAN IP, and via tunnels like localtunnel/ngrok.
 * When served from port 5000 (SPA via Express), returns empty string (same origin).
 */
export function getApiBase(): string {
  const { protocol, hostname, port } = window.location;
  if (port === '5000' || port === '') return '';
  return `${protocol}//${hostname}:5000`;
}

/**
 * Resolves an image URL that may be relative (/uploads/...) or absolute (https://...).
 */
export function resolveImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${getApiBase()}${url}`;
}
