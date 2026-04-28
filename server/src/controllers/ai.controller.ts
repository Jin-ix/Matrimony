import { Request, Response, NextFunction } from 'express';
import * as aiService from '../services/ai.service.js';
import * as icebreakerService from '../services/icebreaker.service.js';
import type { UserRole } from '@prisma/client';

export async function onboardingChat(req: Request, res: Response, next: NextFunction) {
    try {
        const { message, currentStep } = req.body;
        const result = await aiService.processOnboardingChat(
            req.user!.userId,
            req.user!.role as UserRole,
            message,
            currentStep || 0
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function getOnboardingSummary(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req.params.userId as string) || req.user!.userId;
        const summary = await aiService.getOnboardingSummary(userId);
        res.json(summary);
    } catch (error) {
        next(error);
    }
}

export async function generateIcebreaker(req: Request, res: Response, next: NextFunction) {
    try {
        const { matchUserId } = req.body;
        if (!matchUserId) {
            res.status(400).json({ error: 'matchUserId required' });
            return;
        }
        const result = await icebreakerService.generateIcebreaker(req.user!.userId, matchUserId);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function homepageChatAssistant(req: Request, res: Response, next: NextFunction) {
    try {
        const { message } = req.body;
        if (message === undefined) {
             res.status(400).json({ error: 'message required' });
             return;
        }
        const result = await aiService.processHomepageChat(req.user!.userId, message);
        res.json(result);
    } catch (error) {
        next(error);
    }
}
