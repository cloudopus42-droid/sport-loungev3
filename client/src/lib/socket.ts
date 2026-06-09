import { io, Socket } from 'socket.io-client';

function getSocketUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const { protocol, hostname, port } = window.location;
  if (port === '5000' || port === '') return '';
  return `${protocol}//${hostname}:5000`;
}

const SOCKET_URL = getSocketUrl();

let socket: Socket | null = null;

export function connectSocket(token?: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: token ? { token } : undefined,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

