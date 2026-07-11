import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import type { JwtPayload } from '../middleware/auth';

let io: SocketIOServer | null = null;

let lastOnlineEmit = 0;

function throttledOnlineEmit(ioServer: SocketIOServer, onlineUsers: Map<string, any>) {
  const now = Date.now();
  if (now - lastOnlineEmit < 5000) return;
  lastOnlineEmit = now;
  ioServer.emit('online:count', {
    count: onlineUsers.size,
    users: Array.from(onlineUsers.values()).filter((u) => u.name),
  });
}

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
  const adminRoom = 'admin';

  ioServer.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      next();
      return;
    }

    try {
      socket.data.user = jwt.verify(token, config.jwtSecret) as JwtPayload;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  ioServer.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    const user = socket.data.user as JwtPayload | undefined;
    onlineUsers.set(socket.id, {
      socketId: socket.id,
      userId: user?.id,
      role: user?.role,
    });
    if (user?.role === 'admin') {
      socket.join(adminRoom);
    }
    throttledOnlineEmit(ioServer, onlineUsers);

    socket.on('user:active', (userInfo) => {
      if (user && userInfo && typeof userInfo.name === 'string') {
        onlineUsers.set(socket.id, {
          socketId: socket.id,
          userId: user.id,
          name: userInfo.name.slice(0, 100),
          role: user.role,
        });
        throttledOnlineEmit(ioServer, onlineUsers);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
      onlineUsers.delete(socket.id);
      throttledOnlineEmit(ioServer, onlineUsers);
    });
  });

  console.log('✅ Socket.IO initialized');
  return ioServer;
}

export function getAdminRoom(): string {
  return 'admin';
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO не инициализирован. Вызовите initSocket() первым.');
  }
  return io;
}
