import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface TokenPayload {
    userId: string;
    role: 'candidate' | 'scout';
}

export function generateAccessToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as unknown as number };
    return jwt.sign(payload, env.JWT_SECRET, options);
}

export function generateRefreshToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as unknown as number };
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
