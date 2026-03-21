import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '../utils/jwt.js';
import { UserRole } from '@prisma/client';

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
    const existingUser = await prisma.user.findFirst({
        where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
    });

    if (existingUser) {
        throw Object.assign(new Error('User with this phone or email already exists'), { statusCode: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            phone,
            email,
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
    const user = await prisma.user.findFirst({
        where: {
            OR: [{ phone: identifier }, { email: identifier }],
        },
    });

    if (!user || !user.passwordHash) {
        throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
        throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
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
        throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
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
        throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
        throw Object.assign(new Error('Current password is incorrect'), { statusCode: 400 });
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
    });
}

export async function linkLinkedIn(userId: string, linkedInId: string): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: {
            linkedInId,
            isVerified: true,
        },
    });
}
