import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';

export async function blockUser(req: Request, res: Response, next: NextFunction) {
    try {
        const blockerId = req.user!.userId;
        const { blockedId } = req.body;

        if (!blockedId) {
            res.status(400).json({ error: 'blockedId is required' });
            return;
        }

        if (blockerId === blockedId) {
            res.status(400).json({ error: 'You cannot block yourself' });
            return;
        }

        // 1. Create the Block record
        const block = await prisma.block.upsert({
            where: {
                blockerId_blockedId: { blockerId, blockedId }
            },
            update: {},
            create: { blockerId, blockedId }
        });

        // 2. Delete existing Interest/Interaction records between them
        await prisma.interest.deleteMany({
            where: {
                OR: [
                    { fromUserId: blockerId, toUserId: blockedId },
                    { fromUserId: blockedId, toUserId: blockerId }
                ]
            }
        });

        // 3. Find shared conversations
        const blockerConvs = await prisma.conversationParticipant.findMany({
            where: { userId: blockerId },
            select: { conversationId: true }
        });
        
        const blockedConvs = await prisma.conversationParticipant.findMany({
            where: { userId: blockedId },
            select: { conversationId: true }
        });

        const blockerConvIds = blockerConvs.map(c => c.conversationId);
        const blockedConvIds = blockedConvs.map(c => c.conversationId);
        const sharedConvIds = blockerConvIds.filter(id => blockedConvIds.includes(id));

        if (sharedConvIds.length > 0) {
            // Delete those conversations entirely
            await prisma.conversation.deleteMany({
                where: {
                    id: { in: sharedConvIds }
                }
            });
        }

        res.json({ success: true, message: 'User blocked successfully', data: block });
    } catch (error) {
        next(error);
    }
}

export async function reportUser(req: Request, res: Response, next: NextFunction) {
    try {
        const reporterId = req.user!.userId;
        const { reportedId, reason } = req.body;

        if (!reportedId || !reason) {
            res.status(400).json({ error: 'reportedId and reason are required' });
            return;
        }

        if (reporterId === reportedId) {
            res.status(400).json({ error: 'You cannot report yourself' });
            return;
        }

        const report = await prisma.report.create({
            data: {
                reporterId,
                reportedId,
                reason
            }
        });

        // Implicitly block the reported user for a better safety flow
        await prisma.block.upsert({
            where: {
                blockerId_blockedId: { blockerId: reporterId, blockedId: reportedId }
            },
            update: {},
            create: { blockerId: reporterId, blockedId: reportedId }
        });

        // Clean up relationships
        await prisma.interest.deleteMany({
            where: {
                OR: [
                    { fromUserId: reporterId, toUserId: reportedId },
                    { fromUserId: reportedId, toUserId: reporterId }
                ]
            }
        });

        // Find shared conversations and delete them
        const reporterConvs = await prisma.conversationParticipant.findMany({
            where: { userId: reporterId },
            select: { conversationId: true }
        });
        const reportedConvs = await prisma.conversationParticipant.findMany({
            where: { userId: reportedId },
            select: { conversationId: true }
        });
        const reporterConvIds = reporterConvs.map(c => c.conversationId);
        const reportedConvIds = reportedConvs.map(c => c.conversationId);
        const sharedConvIds = reporterConvIds.filter(id => reportedConvIds.includes(id));

        if (sharedConvIds.length > 0) {
            await prisma.conversation.deleteMany({
                where: { id: { in: sharedConvIds } }
            });
        }

        res.json({ success: true, message: 'User reported and blocked successfully', data: report });
    } catch (error) {
        next(error);
    }
}
