import { Request, Response, NextFunction } from 'express';
import * as discoveryService from '../services/discovery.service.js';
import type { DiscoveryFilters } from '../types/index.js';

export async function getDiscoveryFeed(req: Request, res: Response, next: NextFunction) {
    try {
        const filters: DiscoveryFilters = {
            rite: req.query.rite as string | undefined,
            orthodoxBridge: req.query.orthodoxBridge === 'true',
            strictKnanaya: req.query.strictKnanaya === 'true',
            minAge: req.query.minAge ? parseInt(req.query.minAge as string) : undefined,
            maxAge: req.query.maxAge ? parseInt(req.query.maxAge as string) : undefined,
            education: req.query.education as string | undefined,
            diet: req.query.diet as string | undefined,
        };

        const cursor = req.query.cursor as string | undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

        const result = await discoveryService.getDiscoveryFeed(
            req.user!.userId,
            filters,
            cursor,
            Math.min(limit, 50)
        );

        res.json(result);
    } catch (error) {
        next(error);
    }
}
