import { createServer, Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { AddressInfo } from 'net';
import { io as createClient, Socket } from 'socket.io-client';
import { Server as SocketIOServer } from 'socket.io';
import { config } from '../config/env';
import { getAdminRoom, initSocket } from '../socket';

describe('Socket authentication', () => {
  let httpServer: HttpServer;
  let ioServer: SocketIOServer;
  let url: string;
  const clients: Socket[] = [];

  beforeAll((done) => {
    httpServer = createServer();
    ioServer = initSocket(httpServer);
    httpServer.listen(() => {
      const address = httpServer.address() as AddressInfo;
      url = `http://127.0.0.1:${address.port}`;
      done();
    });
  });

  afterEach(() => {
    clients.splice(0).forEach((client) => client.disconnect());
  });

  afterAll((done) => {
    ioServer.close();
    httpServer.close(done);
  });

  function connect(auth?: { token: string }): Promise<Socket> {
    const client = createClient(url, {
      auth,
      forceNew: true,
      transports: ['websocket'],
    });
    clients.push(client);

    return new Promise((resolve, reject) => {
      client.once('connect', () => resolve(client));
      client.once('connect_error', reject);
    });
  }

  it('does not trust client-declared admin roles', async () => {
    const client = await connect();
    client.emit('user:active', { id: 'attacker', role: 'admin', isAdmin: true, name: 'Attacker' });

    const serverSocket = ioServer.sockets.sockets.get(client.id!);
    expect(serverSocket?.rooms.has(getAdminRoom())).toBe(false);
  });

  it('joins the admin room only with a verified admin token', async () => {
    const token = jwt.sign(
      { id: 'admin-id', email: 'admin@example.com', role: 'admin' },
      config.jwtSecret,
      { expiresIn: '1m' }
    );
    const client = await connect({ token });

    const serverSocket = ioServer.sockets.sockets.get(client.id!);
    expect(serverSocket?.rooms.has(getAdminRoom())).toBe(true);
  });

  it('rejects invalid authentication tokens', async () => {
    const client = createClient(url, {
      auth: { token: 'invalid-token' },
      forceNew: true,
      transports: ['websocket'],
    });
    clients.push(client);

    await expect(
      new Promise<void>((resolve, reject) => {
        client.once('connect', () => resolve());
        client.once('connect_error', reject);
      })
    ).rejects.toThrow('Unauthorized');
  });
});
