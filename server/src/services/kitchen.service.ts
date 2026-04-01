import prisma from '../config/database.js';
import type { UserRole } from '@prisma/client';

export async function getOrCreateKitchenTable(matchProfileId: string, userId: string) {
    let table = await prisma.kitchenTable.findFirst({
        where: {
            matchProfileId,
            members: { some: { userId } },
        },
        include: {
            members: {
                include: {
                    user: { include: { profile: { select: { firstName: true, lastName: true } } } },
                },
            },
        },
    });

    if (!table) {
        const matchProfile = await prisma.profile.findFirst({
            where: { userId: matchProfileId },
        });

        table = await prisma.kitchenTable.create({
            data: {
                name: `Discussion about ${matchProfile?.firstName || 'Match'}`,
                matchProfileId,
                members: {
                    create: {
                        userId,
                        role: 'candidate',
                    },
                },
            },
            include: {
                members: {
                    include: {
                        user: { include: { profile: { select: { firstName: true, lastName: true } } } },
                    },
                },
            },
        });
    }

    // ── Auto-add the linked parent or candidate ──────────────
    // Look up ParentCandidateLink for this user (as parent or as candidate)
    const linkAsParent = await prisma.parentCandidateLink.findFirst({
        where: { parentId: userId },
    });
    const linkAsCandidate = await prisma.parentCandidateLink.findFirst({
        where: { candidateId: userId },
    });

    const linkedUserId = linkAsParent?.candidateId ?? linkAsCandidate?.parentId ?? null;
    const linkedRole: UserRole = linkAsParent ? 'candidate' : 'scout';

    if (linkedUserId) {
        const alreadyMember = table.members.some((m) => m.userId === linkedUserId);
        if (!alreadyMember) {
            await prisma.kitchenTableMember.upsert({
                where: { kitchenTableId_userId: { kitchenTableId: table.id, userId: linkedUserId } },
                update: {},
                create: { kitchenTableId: table.id, userId: linkedUserId, role: linkedRole },
            });

            // Re-fetch to include the new member in the returned object
            table = await prisma.kitchenTable.findUniqueOrThrow({
                where: { id: table.id },
                include: {
                    members: {
                        include: {
                            user: { include: { profile: { select: { firstName: true, lastName: true } } } },
                        },
                    },
                },
            });
        }
    }

    return table;
}


export async function getKitchenTableMessages(
    kitchenTableId: string,
    cursor?: string,
    limit: number = 50
) {
    const messages = await prisma.kitchenMessage.findMany({
        where: { kitchenTableId },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = messages.length > limit;
    const result = hasMore ? messages.slice(0, limit) : messages;

    return {
        messages: result.reverse().map((m) => ({
            id: m.id,
            senderId: m.senderId,
            senderRole: m.senderRole,
            senderName: m.senderName,
            text: m.text,
            timestamp: m.createdAt,
        })),
        nextCursor: hasMore ? result[0].id : null,
        hasMore,
    };
}

export async function sendKitchenMessage(
    kitchenTableId: string,
    senderId: string,
    senderRole: UserRole,
    senderName: string,
    text: string
) {
    const member = await prisma.kitchenTableMember.findFirst({
        where: { kitchenTableId, userId: senderId },
    });

    if (!member) {
        throw Object.assign(new Error('Not a member of this Kitchen Table'), { statusCode: 403 });
    }

    const message = await prisma.kitchenMessage.create({
        data: {
            kitchenTableId,
            senderId,
            senderRole,
            senderName,
            text,
        },
    });

    await prisma.kitchenTable.update({
        where: { id: kitchenTableId },
        data: { updatedAt: new Date() },
    });

    return {
        id: message.id,
        senderId: message.senderId,
        senderRole: message.senderRole,
        senderName: message.senderName,
        text: message.text,
        timestamp: message.createdAt,
    };
}

export async function getUserKitchenTables(userId: string) {
    return prisma.kitchenTable.findMany({
        where: {
            members: { some: { userId } },
        },
        include: {
            members: {
                include: {
                    user: { include: { profile: { select: { firstName: true, lastName: true } } } },
                },
            },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
        },
        orderBy: { updatedAt: 'desc' },
    });
}

export async function addKitchenTableMember(
    kitchenTableId: string,
    userId: string,
    inviterId: string,
    role: UserRole = 'scout'
) {
    const inviterMember = await prisma.kitchenTableMember.findFirst({
        where: { kitchenTableId, userId: inviterId },
    });

    if (!inviterMember) {
        throw Object.assign(new Error('Not a member of this Kitchen Table'), { statusCode: 403 });
    }

    const existing = await prisma.kitchenTableMember.findFirst({
        where: { kitchenTableId, userId },
    });

    if (existing) {
        throw Object.assign(new Error('User is already a member'), { statusCode: 409 });
    }

    return prisma.kitchenTableMember.create({
        data: { kitchenTableId, userId, role },
    });
}
