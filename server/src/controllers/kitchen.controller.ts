import { Request, Response, NextFunction } from 'express';
import * as kitchenService from '../services/kitchen.service.js';
import type { UserRole } from '@prisma/client';

export async function getKitchenTable(req: Request, res: Response, next: NextFunction) {
    try {
        const matchId = req.params.matchId as string;
        const table = await kitchenService.getOrCreateKitchenTable(matchId, req.user!.userId);
        res.json(table);
    } catch (error) {
        next(error);
    }
}

export async function getMessages(req: Request, res: Response, next: NextFunction) {
    try {
        const matchId = req.params.matchId as string;
        const cursor = req.query.cursor as string | undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const result = await kitchenService.getKitchenTableMessages(matchId, cursor, limit);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
        const matchId = req.params.matchId as string;
        const { text, senderName } = req.body;
        const message = await kitchenService.sendKitchenMessage(
            matchId,
            req.user!.userId,
            req.user!.role as UserRole,
            senderName,
            text
        );
        res.status(201).json(message);
    } catch (error) {
        next(error);
    }
}

export async function getMyTables(req: Request, res: Response, next: NextFunction) {
    try {
        const tables = await kitchenService.getUserKitchenTables(req.user!.userId);
        res.json(tables);
    } catch (error) {
        next(error);
    }
}

export async function addMember(req: Request, res: Response, next: NextFunction) {
    try {
        const matchId = req.params.matchId as string;
        const { userId, role } = req.body;
        const member = await kitchenService.addKitchenTableMember(matchId, userId, req.user!.userId, role);
        res.status(201).json(member);
    } catch (error) {
        next(error);
    }
}
