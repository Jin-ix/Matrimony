import { Server, Socket } from 'socket.io';

// Map userId -> socketId for real-time notification delivery
const userSockets = new Map<string, string>();
let notificationDispatcher: ((userId: string, notification: unknown) => void) | null = null;

export function registerNotificationSocket(io: Server) {
    const notifNamespace = io.of('/notifications');

    notifNamespace.on('connection', (socket: Socket) => {
        console.log(`🔔 Notification socket connected: ${socket.id}`);

        // Register user's socket
        socket.on('notification:register', (userId: string) => {
            userSockets.set(userId, socket.id);
            socket.join(`user:${userId}`);
            console.log(`  → Registered user ${userId} for notifications`);
        });

        socket.on('disconnect', () => {
            // Remove from mapping
            for (const [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    userSockets.delete(userId);
                    break;
                }
            }
            console.log(`🔔 Notification socket disconnected: ${socket.id}`);
        });
    });

    notificationDispatcher = (userId: string, notification: unknown) => {
        notifNamespace.to(`user:${userId}`).emit('notification:new', notification);
    };

    return {
        // Push a notification to a specific user
        pushToUser: notificationDispatcher,
    };
}

export function pushNotificationToUser(userId: string, notification: unknown) {
    if (notificationDispatcher) {
        notificationDispatcher(userId, notification);
    } else {
        console.warn('notificationDispatcher is not initialized yet');
    }
}
