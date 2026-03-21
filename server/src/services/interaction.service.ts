import prisma from '../config/database.js';
import { createNotification } from './notification.service.js';
import { pushNotificationToUser } from '../socket/notification.socket.js';

export async function expressInterest(fromUserId: string, toUserId: string, message?: string) {
    // Check for existing interaction
    const existing = await prisma.interest.findUnique({
        where: { fromUserId_toUserId: { fromUserId, toUserId } },
    });

    if (existing) {
        throw Object.assign(new Error('You have already interacted with this profile'), { statusCode: 409 });
    }

    // Create interest
    const interest = await prisma.interest.create({
        data: { fromUserId, toUserId, type: 'interest', message },
    });

    // Check for mutual match
    const reciprocal = await prisma.interest.findFirst({
        where: { fromUserId: toUserId, toUserId: fromUserId, type: 'interest' },
    });

    if (reciprocal) {
        // Mutual match — create conversation
        const conversation = await prisma.conversation.create({
            data: {
                participants: {
                    create: [
                        { userId: fromUserId },
                        { userId: toUserId },
                    ],
                },
            },
        });

        // Notify both users of the mutual match
        const fromProfile = await prisma.profile.findUnique({ where: { userId: fromUserId } });
        const toProfile = await prisma.profile.findUnique({ where: { userId: toUserId } });

        const notif1 = await createNotification(fromUserId, {
            type: 'mutual_match',
            title: "It's a Match! 💍",
            description: `You and ${toProfile?.firstName} are mutually interested. Start a conversation!`,
            relatedId: conversation.id,
        });
        if (notif1) pushNotificationToUser(fromUserId, notif1);

        const notif2 = await createNotification(toUserId, {
            type: 'mutual_match',
            title: "It's a Match! 💍",
            description: `You and ${fromProfile?.firstName} are mutually interested. Start a conversation!`,
            relatedId: conversation.id,
        });
        if (notif2) pushNotificationToUser(toUserId, notif2);

        return { interest, mutualMatch: true, conversationId: conversation.id };
    }

    // Notify the target user
    const fromProfile = await prisma.profile.findUnique({ where: { userId: fromUserId } });
    const notif3 = await createNotification(toUserId, {
        type: 'new_interest',
        title: 'New Interest',
        description: `${fromProfile?.firstName} has expressed interest in your profile.`,
        relatedId: interest.id,
    });
    if (notif3) pushNotificationToUser(toUserId, notif3);

    return { interest, mutualMatch: false };
}

export async function passProfile(fromUserId: string, toUserId: string) {
    const existing = await prisma.interest.findUnique({
        where: { fromUserId_toUserId: { fromUserId, toUserId } },
    });

    if (existing) {
        throw Object.assign(new Error('You have already interacted with this profile'), { statusCode: 409 });
    }

    return prisma.interest.create({
        data: { fromUserId, toUserId, type: 'pass' },
    });
}

export async function recommendProfile(
    fromUserId: string,
    toUserId: string,
    message?: string
) {
    // Create or update recommendation
    const existing = await prisma.interest.findUnique({
        where: { fromUserId_toUserId: { fromUserId, toUserId } },
    });

    if (existing) {
        throw Object.assign(new Error('Already interacted with this profile'), { statusCode: 409 });
    }

    const recommendation = await prisma.interest.create({
        data: {
            fromUserId,
            toUserId,
            type: 'recommend',
            recommendedByUserId: fromUserId,
            message,
        },
    });

    // Notify the target user (the candidate this profile is for)
    const fromProfile = await prisma.profile.findUnique({ where: { userId: fromUserId } });
    const toProfile = await prisma.profile.findUnique({ where: { userId: toUserId } });

    await createNotification(toUserId, {
        type: 'scout_recommendation',
        title: 'Family Recommendation',
        description: `${fromProfile?.firstName} has recommended a profile for you.`,
        relatedId: recommendation.id,
    });

    return recommendation;
}

export async function getReceivedInterests(userId: string) {
    return prisma.interest.findMany({
        where: { toUserId: userId, type: 'interest' },
        include: {
            fromUser: {
                include: {
                    profile: true,
                    photos: { where: { isPrimary: true }, take: 1 },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function getSentInterests(userId: string) {
    return prisma.interest.findMany({
        where: { fromUserId: userId, type: 'interest' },
        include: {
            toUser: {
                include: {
                    profile: true,
                    photos: { where: { isPrimary: true }, take: 1 },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}
