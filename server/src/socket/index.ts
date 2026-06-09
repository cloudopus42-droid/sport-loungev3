import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from '../config/env';

let io: SocketIOServer | null = null;

export function initSocket(server: HttpServer): SocketIOServer {
  const ioServer = new SocketIOServer(server, {
    cors: {
      origin: config.allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });
  io = ioServer;

  const onlineUsers = new Map<string, { socketId: string; userId?: string; name?: string; role?: string }>();

  ioServer.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);
    
    // Register initial connection
    onlineUsers.set(socket.id, { socketId: socket.id });
    ioServer.emit('online:count', {
      count: onlineUsers.size,
      users: Array.from(onlineUsers.values()).filter((u) => u.name),
    });

    socket.on('user:active', (userInfo) => {
      if (userInfo && userInfo.id) {
        onlineUsers.set(socket.id, {
          socketId: socket.id,
          userId: userInfo.id,
          name: userInfo.name,
          role: userInfo.role,
        });
        ioServer.emit('online:count', {
          count: onlineUsers.size,
          users: Array.from(onlineUsers.values()).filter((u) => u.name),
        });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
      onlineUsers.delete(socket.id);
      ioServer.emit('online:count', {
        count: onlineUsers.size,
        users: Array.from(onlineUsers.values()).filter((u) => u.name),
      });
    });
  });

  console.log('✅ Socket.IO initialized');
  return ioServer;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO не инициализирован. Вызовите initSocket() первым.');
  }
  return io;
}
