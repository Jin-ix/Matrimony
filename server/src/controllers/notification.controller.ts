import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notification.service.js';

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
        const cursor = req.query.cursor as string | undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
        const result = await notificationService.getUserNotifications(req.user!.userId, cursor, limit);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        await notificationService.markAsRead(id, req.user!.userId);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
        await notificationService.markAllAsRead(req.user!.userId);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
}

export async function getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
        const prefs = await notificationService.getNotificationPreferences(req.user!.userId);
        res.json(prefs);
    } catch (error) {
        next(error);
    }
}

export async function updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
        const prefs = await notificationService.updateNotificationPreferences(req.user!.userId, req.body);
        res.json(prefs);
    } catch (error) {
        next(error);
    }
}
