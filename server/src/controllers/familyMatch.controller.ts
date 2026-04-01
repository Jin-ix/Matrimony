import { Request, Response, NextFunction } from 'express';
import * as familyMatchService from '../services/familyMatch.service.js';

export async function createFamilyMatchChat(req: Request, res: Response, next: NextFunction) {
    try {
        const { candidateAId, candidateBId } = req.body;
        const result = await familyMatchService.createFamilyMatchChat(candidateAId, candidateBId);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

export async function getFamilyMatchChats(req: Request, res: Response, next: NextFunction) {
    try {
        const result = await familyMatchService.getFamilyMatchChats(req.user!.userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function getMessages(req: Request, res: Response, next: NextFunction) {
    try {
        const chatId = req.params.chatId as string;
        const cursor = req.query.cursor as string | undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const result = await familyMatchService.getFamilyMatchMessages(chatId, cursor, limit);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
        const chatId = req.params.chatId as string;
        const { text, senderName } = req.body;
        const result = await familyMatchService.sendFamilyMatchMessage(
            chatId,
            req.user!.userId,
            req.user!.role,
            senderName,
            text
        );
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

export async function addMember(req: Request, res: Response, next: NextFunction) {
    try {
        const chatId = req.params.chatId as string;
        const { userId, role } = req.body;
        const result = await familyMatchService.addFamilyMatchMember(chatId, userId, role);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}
