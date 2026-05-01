import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '../utils/jwt.js';
import { UserRole } from '@prisma/client';
import { createError } from '../middleware/error.middleware.js';

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export async function register(
    phone: string,
    password: string,
    role: UserRole,
    email?: string
): Promise<{ user: { id: string; phone: string; role: UserRole }; tokens: AuthTokens }> {
    const normalizedPhone = phone.trim();
    const normalizedEmail = email ? email.trim() : undefined;

    const existingUser = await prisma.user.findFirst({
        where: { 
            OR: [
                { phone: { equals: normalizedPhone, mode: 'insensitive' } },
                ...(normalizedEmail ? [{ email: { equals: normalizedEmail, mode: 'insensitive' as const } }] : [])
            ] 
        },
    });

    if (existingUser) {
        throw createError('User with this phone or email already exists', 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            phone: normalizedPhone,
            email: normalizedEmail,
            passwordHash,
            role,
            notificationPrefs: {
                create: {
                    newMatches: true,
                    directMessages: true,
                    familyRecommendations: true,
                    emailEnabled: true,
                    smsEnabled: true,
                },
            },
        },
    });

    const payload: TokenPayload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
    });

    return {
        user: { id: user.id, phone: user.phone!, role: user.role },
        tokens: { accessToken, refreshToken },
    };
}

export async function login(
    identifier: string,
    password: string
): Promise<{ user: { id: string; role: UserRole; phone?: string; email?: string }; tokens: AuthTokens }> {
    const normalizedIdentifier = identifier.trim();
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { phone: { equals: normalizedIdentifier, mode: 'insensitive' } },
                { email: { equals: normalizedIdentifier, mode: 'insensitive' } }
            ],
        },
    });

    if (!user || !user.passwordHash) {
        throw createError('Invalid credentials', 401);
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
        throw createError('Invalid credentials', 401);
    }

    const payload: TokenPayload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
    });

    return {
        user: { id: user.id, role: user.role, phone: user.phone ?? undefined, email: user.email ?? undefined },
        tokens: { accessToken, refreshToken },
    };
}

export async function refreshTokens(token: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(token);

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
    });

    if (!user || user.refreshToken !== token) {
        throw createError('Invalid refresh token', 401);
    }

    const newPayload: TokenPayload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(newPayload);
    const refreshToken = generateRefreshToken(newPayload);

    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
    });

    return { accessToken, refreshToken };
}

export async function logout(userId: string): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
    });
}

export async function changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.passwordHash) {
        throw createError('User not found', 404);
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
        throw createError('Current password is incorrect', 400);
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
    });
}

export async function linkLinkedIn(
    userId: string,
    linkedInId: string,
    scrapedData?: { occupation?: string; employer?: string; education?: string }
): Promise<void> {
    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: userId },
            data: {
                linkedInId,
                isVerified: true,
            },
        });

        if (scrapedData) {
            // Update the profile if it exists
            const profile = await tx.profile.findUnique({
                where: { userId },
            });

            if (profile) {
                const updateData: any = {};
                if (scrapedData.occupation && !profile.occupation) updateData.occupation = scrapedData.occupation;
                if (scrapedData.employer && !profile.employer) updateData.employer = scrapedData.employer;
                if (scrapedData.education && !profile.education) updateData.education = scrapedData.education;

                if (Object.keys(updateData).length > 0) {
                    await tx.profile.update({
                        where: { userId },
                        data: updateData,
                    });
                }
            }
        }
    });
}
