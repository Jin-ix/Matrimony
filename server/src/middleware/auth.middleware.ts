import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    const xUserId = req.headers['x-user-id'] as string;

    if (xUserId) {
        req.user = { userId: xUserId, role: 'candidate' };
        return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = verifyAccessToken(token);
        req.user = payload;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired access token' });
    }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            req.user = verifyAccessToken(token);
        } catch {
            // Token invalid, proceed without user
        }
    }

    next();
}
