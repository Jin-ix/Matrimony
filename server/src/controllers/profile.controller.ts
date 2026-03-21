import { Request, Response, NextFunction } from 'express';
import * as profileService from '../services/profile.service.js';
import * as uploadService from '../services/upload.service.js';

export async function getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
        const profile = await profileService.getProfile(req.user!.userId);
        res.json(profile);
    } catch (error) {
        next(error);
    }
}

export async function updateMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
        const profile = await profileService.updateProfile(req.user!.userId, req.body);
        res.json(profile);
    } catch (error) {
        next(error);
    }
}

export async function getPublicProfile(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.params.userId as string;
        const profile = await profileService.getPublicProfile(userId);
        res.json(profile);
    } catch (error) {
        next(error);
    }
}

export async function uploadPhoto(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        const photo = await uploadService.uploadPhoto(req.user!.userId, req.file);
        res.status(201).json(photo);
    } catch (error) {
        next(error);
    }
}

export async function deletePhoto(req: Request, res: Response, next: NextFunction) {
    try {
        const photoId = req.params.photoId as string;
        await uploadService.deletePhoto(req.user!.userId, photoId);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
}

export async function setPrimaryPhoto(req: Request, res: Response, next: NextFunction) {
    try {
        const photoId = req.params.photoId as string;
        await uploadService.setPrimaryPhoto(req.user!.userId, photoId);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
}

export async function updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
        const prefs = await profileService.updatePreferences(req.user!.userId, req.body);
        res.json(prefs);
    } catch (error) {
        next(error);
    }
}

export async function getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
        const prefs = await profileService.getPreferences(req.user!.userId);
        res.json(prefs);
    } catch (error) {
        next(error);
    }
}

export async function toggleGhostMode(req: Request, res: Response, next: NextFunction) {
    try {
        const { enabled } = req.body;
        await profileService.toggleGhostMode(req.user!.userId, enabled);
        res.json({ success: true, ghostMode: enabled });
    } catch (error) {
        next(error);
    }
}
