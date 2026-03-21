import prisma from '../config/database.js';
import { calculateCompatibility } from './compatibility.service.js';
import type { DiscoveryFilters, MatchProfileResponse } from '../types/index.js';
import type { Rite, Prisma } from '@prisma/client';

const RITE_DISPLAY: Record<string, string> = {
    SYRO_MALABAR: 'Syro-Malabar',
    LATIN: 'Latin',
    KNANAYA_CATHOLIC: 'Knanaya Catholic',
    MALANKARA_ORTHODOX: 'Malankara Orthodox',
    SYRO_MALANKARA: 'Syro-Malankara',
    OTHER: 'Other',
};

export async function getDiscoveryFeed(
    userId: string,
    filters: DiscoveryFilters,
    cursor?: string,
    limit: number = 20
): Promise<{ profiles: MatchProfileResponse[]; nextCursor: string | null; hasMore: boolean }> {
    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            profile: true,
            matchPreferences: true,
        },
    });

    if (!currentUser?.profile) {
        return { profiles: [], nextCursor: null, hasMore: false };
    }

    const interactions = await prisma.interest.findMany({
        where: { fromUserId: userId },
        select: { toUserId: true },
    });
    const excludeIds = [userId, ...interactions.map((i) => i.toUserId)];

    const where: Prisma.ProfileWhereInput = {
        userId: { notIn: excludeIds },
        user: { ghostMode: false },
    };

    if (filters.rite) {
        where.rite = filters.rite as Rite;
    }
    if (filters.orthodoxBridge) {
        where.orthodoxBridge = true;
    }
    if (filters.strictKnanaya) {
        where.rite = 'KNANAYA_CATHOLIC';
    }
    if (filters.minAge || filters.maxAge) {
        where.age = {};
        if (filters.minAge) where.age.gte = filters.minAge;
        if (filters.maxAge) where.age.lte = filters.maxAge;
    }
    if (filters.education) {
        where.education = filters.education;
    }
    if (filters.diet) {
        where.dietaryPreference = filters.diet;
    }

    const profiles = await prisma.profile.findMany({
        where,
        include: {
            user: {
                include: {
                    photos: { where: { isPrimary: true }, take: 1 },
                    receivedInteractions: {
                        where: { type: 'recommend', fromUserId: { not: userId } },
                        take: 1,
                    },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = profiles.length > limit;
    const resultProfiles = hasMore ? profiles.slice(0, limit) : profiles;
    const nextCursor = hasMore ? resultProfiles[resultProfiles.length - 1].id : null;

    const matchProfiles: MatchProfileResponse[] = resultProfiles.map((profile) => {
        const compat = calculateCompatibility(
            { ...currentUser.profile!, user: { ghostMode: currentUser.ghostMode } },
            profile,
            currentUser.matchPreferences
        );

        return {
            id: profile.userId,
            name: profile.firstName,
            age: profile.age,
            gender: profile.gender,
            location: profile.location,
            rite: RITE_DISPLAY[profile.rite] || profile.rite,
            image: profile.user.photos[0]?.url || '',
            compatibility: compat.score,
            dealbreaker: compat.dealbreaker,
            scoutRecommended: profile.user.receivedInteractions.length > 0,
            hobbies: profile.hobbies,
        };
    });

    return { profiles: matchProfiles, nextCursor, hasMore };
}
