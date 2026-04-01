import prisma from '../config/database.js';
import type { UserRole } from '@prisma/client';

export async function createFamilyMatchChat(candidateAId: string, candidateBId: string) {
    const existing = await prisma.familyMatchChat.findFirst({
        where: {
            OR: [
                { candidateAId, candidateBId },
                { candidateAId: candidateBId, candidateBId: candidateAId }
            ]
        }
    });

    if (existing) return existing;

    return prisma.familyMatchChat.create({
        data: {
            candidateAId,
            candidateBId,
            members: {
                create: [
                    { userId: candidateAId, role: 'candidate' },
                    { userId: candidateBId, role: 'candidate' }
                ]
            }
        },
        include: { members: true }
    });
}

export async function getFamilyMatchChats(userId: string) {
    return prisma.familyMatchChat.findMany({
        where: {
            members: { some: { userId } }
        },
        include: {
            candidateA: { include: { profile: { select: { firstName: true, lastName: true } }, photos: { where: { isPrimary: true } } } },
            candidateB: { include: { profile: { select: { firstName: true, lastName: true } }, photos: { where: { isPrimary: true } } } },
            members: { include: { user: { include: { profile: { select: { firstName: true, lastName: true } } } } } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 }
        },
        orderBy: { updatedAt: 'desc' }
    });
}

export async function getFamilyMatchMessages(chatId: string, cursor?: string, limit: number = 50) {
    const messages = await prisma.familyMatchMessage.findMany({
        where: { familyMatchChatId: chatId },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = messages.length > limit;
    const result = hasMore ? messages.slice(0, limit) : messages;

    return {
        messages: result.reverse().map(m => ({
            id: m.id,
            senderId: m.senderId,
            senderRole: m.senderRole,
            senderName: m.senderName,
            text: m.text,
            timestamp: m.createdAt
        })),
        nextCursor: hasMore ? result[0].id : null,
        hasMore
    };
}

export async function sendFamilyMatchMessage(chatId: string, senderId: string, senderRole: UserRole, senderName: string, text: string) {
    const member = await prisma.familyMatchMember.findFirst({
        where: { familyMatchChatId: chatId, userId: senderId }
    });

    if (!member) throw Object.assign(new Error('Not a member of this Family Match Chat'), { statusCode: 403 });

    const message = await prisma.familyMatchMessage.create({
        data: {
            familyMatchChatId: chatId,
            senderId,
            senderRole,
            senderName,
            text
        }
    });

    await prisma.familyMatchChat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() }
    });

    return message;
}

export async function addFamilyMatchMember(chatId: string, userId: string, role: UserRole = 'scout') {
    const existing = await prisma.familyMatchMember.findFirst({
        where: { familyMatchChatId: chatId, userId }
    });

    if (existing) throw Object.assign(new Error('Already a member'), { statusCode: 409 });

    return prisma.familyMatchMember.create({
        data: { familyMatchChatId: chatId, userId, role }
    });
}
