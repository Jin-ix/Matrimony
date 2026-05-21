import { Request, Response, NextFunction } from 'express';
import * as compatibilityReviewService from '../services/compatibilityReview.service.js';

export async function getCompatibilityReview(req: Request, res: Response, next: NextFunction) {
    try {
        const { targetUserId } = req.params;
        if (!targetUserId) {
            res.status(400).json({ error: 'targetUserId required' });
            return;
        }
        const review = await compatibilityReviewService.generateCompatibilityReview(
            req.user!.userId,
            targetUserId as string
        );
        res.json(review);
    } catch (error) {
        next(error);
    }
}
