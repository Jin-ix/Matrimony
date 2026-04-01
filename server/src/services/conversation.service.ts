import prisma from '../config/database.js';
import { moderateMessage } from './moderation.service.js';
import { createNotification } from './notification.service.js';

export async function getUserConversations(userId: string) {
    const conversations = await prisma.conversation.findMany({
        where: {
            participants: { some: { userId } },
            isArchived: false,
        },
        include: {
            participants: {
                include: {
                    user: {
                        include: {
                            profile: { select: { firstName: true, lastName: true } },
                            photos: { where: { isPrimary: true }, take: 1 },
                        },
                    },
                },
            },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
        },
        orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((conv) => {
        const otherParticipant = conv.participants.find((p) => p.userId !== userId);
        const lastMessage = conv.messages[0];

        return {
            id: conv.id,
            matchUser: otherParticipant ? {
                id: otherParticipant.userId,
                name: otherParticipant.user.profile?.firstName || 'Unknown',
                avatar: otherParticipant.user.photos[0]?.url || '',
            } : null,
            lastMessage: lastMessage ? {
                text: lastMessage.text,
                timestamp: lastMessage.createdAt,
                senderId: lastMessage.senderId,
            } : null,
            updatedAt: conv.updatedAt,
        };
    });
}

export async function getConversationMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit: number = 50
) {
    const participant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId },
    });

    if (!participant) {
        throw Object.assign(new Error('Not a participant in this conversation'), { statusCode: 403 });
    }

    const matchParticipant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: { not: userId } },
        include: {
            user: {
                include: {
                    profile: { select: { firstName: true } },
                    photos: { where: { isPrimary: true }, take: 1 },
                },
            },
        },
    });

    const matchUser = matchParticipant ? {
        id: matchParticipant.userId,
        name: matchParticipant.user.profile?.firstName || 'Unknown',
        avatar: matchParticipant.user.photos[0]?.url || '',
    } : null;

    const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
            sender: {
                include: {
                    profile: { select: { firstName: true } },
                },
            },
        },
    });

    const hasMore = messages.length > limit;
    const result = hasMore ? messages.slice(0, limit) : messages;

    return {
        matchUser,
        messages: result.reverse().map((m) => ({
            id: m.id,
            senderId: m.senderId,
            senderName: m.sender.profile?.firstName || 'Unknown',
            text: m.text,
            flagged: m.flagged,
            flagReason: m.flagReason,
            timestamp: m.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: m.createdAt,
        })),
        nextCursor: hasMore ? result[0].id : null,
        hasMore,
    };
}

export async function sendMessage(
    conversationId: string,
    senderId: string,
    text: string
) {
    const participant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: senderId },
    });

    if (!participant) {
        throw Object.assign(new Error('Not a participant in this conversation'), { statusCode: 403 });
    }

    const moderation = moderateMessage(text);

    const message = await prisma.message.create({
        data: {
            conversationId,
            senderId,
            text,
            flagged: moderation.flagged,
            flagReason: moderation.reason,
        },
        include: {
            sender: {
                include: { profile: { select: { firstName: true } } },
            },
        },
    });

    await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
    });

    const otherParticipant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: { not: senderId } },
    });

    if (otherParticipant) {
        await createNotification(otherParticipant.userId, {
            type: 'new_message',
            title: 'New Message',
            description: `${message.sender.profile?.firstName} sent you a message.`,
            relatedId: conversationId,
        });
    }

    return {
        id: message.id,
        senderId: message.senderId,
        senderName: message.sender.profile?.firstName || 'Unknown',
        text: message.text,
        flagged: message.flagged,
        flagReason: message.flagReason,
        timestamp: message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: message.createdAt,
        moderation: moderation.flagged ? moderation : undefined,
    };
}

export async function archiveConversation(conversationId: string, userId: string) {
    const participant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId },
    });

    if (!participant) {
        throw Object.assign(new Error('Not a participant'), { statusCode: 403 });
    }

    await prisma.conversation.update({
        where: { id: conversationId },
        data: { isArchived: true },
    });

    const otherParticipant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: { not: userId } },
    });

    const userProfile = await prisma.profile.findUnique({ where: { userId } });

    if (otherParticipant) {
        await createNotification(otherParticipant.userId, {
            type: 'new_message',
            title: 'Connection Archived',
            description: `${userProfile?.firstName} has respectfully closed this connection.`,
            relatedId: conversationId,
        });
    }

    return { success: true };
}

export async function revealMedia(conversationId: string, userId: string, type: 'photo' | 'video') {
    const participant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId },
    });

    if (!participant) {
        throw Object.assign(new Error('Not a participant'), { statusCode: 403 });
    }

    const data: any = {};
    if (type === 'photo') data.photosRevealedAt = new Date();
    if (type === 'video') data.videoRevealedAt = new Date();

    const result = await prisma.conversation.update({
        where: { id: conversationId },
        data,
    });

    return { 
        success: true, 
        photosRevealedAt: result.photosRevealedAt, 
        videoRevealedAt: result.videoRevealedAt 
    };
}
