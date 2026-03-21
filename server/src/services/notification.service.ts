import prisma from '../config/database.js';
import type { NotificationType } from '../types/index.js';
import type { NotificationType as PrismaNotificationType } from '@prisma/client';

interface CreateNotificationData {
    type: NotificationType;
    title: string;
    description: string;
    relatedId?: string;
}

export async function createNotification(userId: string, data: CreateNotificationData) {
    const prefs = await prisma.notificationPreferences.findUnique({ where: { userId } });

    if (prefs) {
        if (data.type === 'new_message' && !prefs.directMessages) return null;
        if (data.type === 'mutual_match' && !prefs.newMatches) return null;
        if (data.type === 'new_interest' && !prefs.newMatches) return null;
        if (data.type === 'scout_recommendation' && !prefs.familyRecommendations) return null;
    }

    const notification = await prisma.notification.create({
        data: {
            userId,
            type: data.type as PrismaNotificationType,
            title: data.title,
            description: data.description,
            relatedId: data.relatedId,
        },
    });

    return notification;
}

export async function getUserNotifications(userId: string, cursor?: string, limit: number = 20) {
    const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = notifications.length > limit;
    const result = hasMore ? notifications.slice(0, limit) : notifications;

    return {
        notifications: result,
        nextCursor: hasMore ? result[result.length - 1].id : null,
        hasMore,
    };
}

export async function markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true },
    });
}

export async function markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
    });
}

export async function getNotificationPreferences(userId: string) {
    let prefs = await prisma.notificationPreferences.findUnique({ where: { userId } });

    if (!prefs) {
        prefs = await prisma.notificationPreferences.create({
            data: {
                userId,
                newMatches: true,
                directMessages: true,
                familyRecommendations: true,
                emailEnabled: true,
                smsEnabled: true,
            },
        });
    }

    return prefs;
}

export async function updateNotificationPreferences(
    userId: string,
    data: {
        newMatches?: boolean;
        directMessages?: boolean;
        familyRecommendations?: boolean;
        emailEnabled?: boolean;
        pushEnabled?: boolean;
        smsEnabled?: boolean;
    }
) {
    return prisma.notificationPreferences.upsert({
        where: { userId },
        update: data,
        create: {
            userId,
            newMatches: data.newMatches ?? true,
            directMessages: data.directMessages ?? true,
            familyRecommendations: data.familyRecommendations ?? true,
            emailEnabled: data.emailEnabled ?? true,
            pushEnabled: data.pushEnabled ?? false,
            smsEnabled: data.smsEnabled ?? true,
        },
    });
}
