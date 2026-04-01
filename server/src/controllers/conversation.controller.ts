import { Request, Response, NextFunction } from 'express';
import * as conversationService from '../services/conversation.service.js';
import * as icebreakerService from '../services/icebreaker.service.js';

export async function getConversations(req: Request, res: Response, next: NextFunction) {
    try {
        const conversations = await conversationService.getUserConversations(req.user!.userId);
        res.json(conversations);
    } catch (error) {
        next(error);
    }
}

export async function getMessages(req: Request, res: Response, next: NextFunction) {
    try {
        const conversationId = req.params.conversationId as string;
        const cursor = req.query.cursor as string | undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const result = await conversationService.getConversationMessages(
            conversationId,
            req.user!.userId,
            cursor,
            limit
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
        const conversationId = req.params.conversationId as string;
        const { text } = req.body;
        const message = await conversationService.sendMessage(
            conversationId,
            req.user!.userId,
            text
        );
        res.status(201).json(message);
    } catch (error) {
        next(error);
    }
}

export async function archiveConversation(req: Request, res: Response, next: NextFunction) {
    try {
        const conversationId = req.params.conversationId as string;
        const result = await conversationService.archiveConversation(
            conversationId,
            req.user!.userId
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function getIcebreaker(req: Request, res: Response, next: NextFunction) {
    try {
        const matchUserId = req.query.matchUserId as string | undefined;
        if (!matchUserId) {
            res.status(400).json({ error: 'matchUserId query parameter required' });
            return;
        }
        const result = await icebreakerService.generateIcebreaker(req.user!.userId, matchUserId);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function revealMedia(req: Request, res: Response, next: NextFunction) {
    try {
        const conversationId = req.params.conversationId as string;
        const type = req.body.type as 'photo' | 'video';
        
        if (!type || (type !== 'photo' && type !== 'video')) {
           res.status(400).json({ error: 'type must be photo or video' });
           return;
        }

        const result = await conversationService.revealMedia(
            conversationId,
            req.user!.userId,
            type
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
}
