import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';
import * as otpService from '../services/otp.service.js';
import * as linkedinService from '../services/linkedin.service.js';

export async function register(req: Request, res: Response, next: NextFunction) {
    try {
        const { phone, password, role, email } = req.body;
        const result = await authService.register(phone, password, role, email);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

export async function sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
        const { phone } = req.body;
        const result = await otpService.sendOtp(phone);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
        const { phone, otp } = req.body;
        const isValid = await otpService.verifyOtp(phone, otp);
        if (!isValid) {
            res.status(400).json({ error: 'Invalid or expired OTP' });
            return;
        }
        res.json({ success: true, message: 'Phone verified successfully' });
    } catch (error) {
        next(error);
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const { identifier, password } = req.body;
        const result = await authService.login(identifier, password);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
        const { refreshToken } = req.body;
        const tokens = await authService.refreshTokens(refreshToken);
        res.json(tokens);
    } catch (error) {
        next(error);
    }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
    try {
        await authService.logout(req.user!.userId);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
    try {
        const { currentPassword, newPassword } = req.body;
        await authService.changePassword(req.user!.userId, currentPassword, newPassword);
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
}

export async function linkedInAuth(_req: Request, res: Response) {
    const url = linkedinService.getLinkedInAuthUrl();
    res.redirect(url);
}

export async function linkedInCallback(req: Request, res: Response, next: NextFunction) {
    try {
        const { code } = req.query;
        if (!code || typeof code !== 'string') {
            res.status(400).json({ error: 'Authorization code required' });
            return;
        }
        const linkedInData = await linkedinService.exchangeLinkedInCode(code);

        // If user is authenticated, link LinkedIn to their account
        if (req.user) {
            await authService.linkLinkedIn(req.user.userId, linkedInData.linkedInId);
            res.redirect(`${process.env.FRONTEND_URL}/settings?linkedin=success`);
        } else {
            res.json({ linkedInData });
        }
    } catch (error) {
        next(error);
    }
}
