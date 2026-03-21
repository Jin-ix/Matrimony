import { Server, Socket } from 'socket.io';
import * as kitchenService from '../services/kitchen.service.js';
import type { UserRole } from '@prisma/client';

export function registerKitchenSocket(io: Server) {
    const kitchenNamespace = io.of('/kitchen');

    kitchenNamespace.on('connection', (socket: Socket) => {
        console.log(`🍽️ Kitchen socket connected: ${socket.id}`);

        // Join a Kitchen Table room
        socket.on('kitchen:join', (kitchenTableId: string) => {
            socket.join(`kitchen:${kitchenTableId}`);
            console.log(`  → Joined Kitchen Table: ${kitchenTableId}`);
        });

        // Send a message
        socket.on('kitchen:message', async (data: {
            kitchenTableId: string;
            senderId: string;
            senderRole: UserRole;
            senderName: string;
            text: string;
        }) => {
            try {
                const message = await kitchenService.sendKitchenMessage(
                    data.kitchenTableId,
                    data.senderId,
                    data.senderRole,
                    data.senderName,
                    data.text
                );

                // Broadcast to all members in the room
                kitchenNamespace.to(`kitchen:${data.kitchenTableId}`).emit('kitchen:message', message);
            } catch (error) {
                socket.emit('kitchen:error', { message: (error as Error).message });
            }
        });

        // Typing indicator
        socket.on('kitchen:typing', (data: { kitchenTableId: string; userId: string; name: string }) => {
            socket.to(`kitchen:${data.kitchenTableId}`).emit('kitchen:typing', {
                userId: data.userId,
                name: data.name,
            });
        });

        // Leave
        socket.on('kitchen:leave', (kitchenTableId: string) => {
            socket.leave(`kitchen:${kitchenTableId}`);
        });

        socket.on('disconnect', () => {
            console.log(`🍽️ Kitchen socket disconnected: ${socket.id}`);
        });
    });
}
