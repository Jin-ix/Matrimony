import { Request, Response, NextFunction } from 'express';
import * as interactionService from '../services/interaction.service.js';

export async function expressInterest(req: Request, res: Response, next: NextFunction) {
    try {
        const { toUserId, message } = req.body;
        const result = await interactionService.expressInterest(req.user!.userId, toUserId, message);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

export async function passProfile(req: Request, res: Response, next: NextFunction) {
    try {
        const { toUserId } = req.body;
        const result = await interactionService.passProfile(req.user!.userId, toUserId);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

export async function recommendProfile(req: Request, res: Response, next: NextFunction) {
    try {
        const { toUserId, message } = req.body;
        const result = await interactionService.recommendProfile(req.user!.userId, toUserId, message);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

export async function getReceivedInterests(req: Request, res: Response, next: NextFunction) {
    try {
        const interests = await interactionService.getReceivedInterests(req.user!.userId);
        res.json(interests);
    } catch (error) {
        next(error);
    }
}

export async function getSentInterests(req: Request, res: Response, next: NextFunction) {
    try {
        const interests = await interactionService.getSentInterests(req.user!.userId);
        res.json(interests);
    } catch (error) {
        next(error);
    }
}
