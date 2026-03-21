import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from './env.js';

let io: Server;

export function initializeSocket(httpServer: HttpServer): Server {
    io = new Server(httpServer, {
        cors: {
            origin: env.FRONTEND_URL,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingInterval: 25000,
        pingTimeout: 60000,
    });

    io.on('connection', (socket: Socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        socket.on('disconnect', (reason) => {
            console.log(`🔌 Socket disconnected: ${socket.id}, reason: ${reason}`);
        });
    });

    return io;
}

export function getIO(): Server {
    if (!io) {
        throw new Error('Socket.IO has not been initialized');
    }
    return io;
}
