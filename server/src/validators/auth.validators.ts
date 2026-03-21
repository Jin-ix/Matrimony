import { z } from 'zod';

export const registerSchema = z.object({
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    role: z.enum(['candidate', 'scout']),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    email: z.string().email().optional(),
});

export const sendOtpSchema = z.object({
    phone: z.string().min(10),
});

export const verifyOtpSchema = z.object({
    phone: z.string().min(10),
    otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const loginSchema = z.object({
    identifier: z.string().min(1, 'Phone or email required'),
    password: z.string().min(1, 'Password required'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1),
});
