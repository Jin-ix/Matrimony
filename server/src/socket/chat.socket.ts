import { Server, Socket } from 'socket.io';
import * as conversationService from '../services/conversation.service.js';

export function registerChatSocket(io: Server) {
    const chatNamespace = io.of('/chat');

    chatNamespace.on('connection', (socket: Socket) => {
        console.log(`💬 Chat socket connected: ${socket.id}`);

        // Join a conversation room
        socket.on('chat:join', (conversationId: string) => {
            socket.join(`conversation:${conversationId}`);
            console.log(`  → Joined conversation: ${conversationId}`);
        });

        // Send a message
        socket.on('chat:message', async (data: { conversationId: string; senderId: string; text: string }) => {
            try {
                const message = await conversationService.sendMessage(
                    data.conversationId,
                    data.senderId,
                    data.text
                );

                // Broadcast to all participants in the room
                chatNamespace.to(`conversation:${data.conversationId}`).emit('chat:message', message);

                // If flagged, send moderation warning to sender only
                if (message.moderation) {
                    socket.emit('chat:flagged', {
                        conversationId: data.conversationId,
                        messageId: message.id,
                        reason: message.moderation.reason,
                    });
                }
            } catch (error) {
                socket.emit('chat:error', { message: (error as Error).message });
            }
        });

        // Typing indicator
        socket.on('chat:typing', (data: { conversationId: string; userId: string }) => {
            socket.to(`conversation:${data.conversationId}`).emit('chat:typing', {
                userId: data.userId,
            });
        });

        // Leave a conversation room
        socket.on('chat:leave', (conversationId: string) => {
            socket.leave(`conversation:${conversationId}`);
        });

        socket.on('disconnect', () => {
            console.log(`💬 Chat socket disconnected: ${socket.id}`);
        });
    });
}
