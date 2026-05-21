import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import path from 'path';
import fs from 'fs/promises';
import { createNotification } from '../services/notification.service.js';
import { pushNotificationToUser } from '../socket/notification.socket.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

async function ensureUploadDir() {
    try {
        await fs.access(UPLOAD_DIR);
    } catch {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
}

export async function uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.userId;
        const { documentType, fileData, fileName } = req.body;

        if (!documentType || !fileData || !fileName) {
            res.status(400).json({ error: 'documentType, fileData, and fileName are required' });
            return;
        }

        if (documentType !== 'baptism_certificate' && documentType !== 'government_id') {
            res.status(400).json({ error: 'Invalid documentType. Must be baptism_certificate or government_id' });
            return;
        }

        await ensureUploadDir();

        // Process base64 file data
        const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let buffer: Buffer;
        let extension = 'bin';

        if (matches && matches.length === 3) {
            const mimeType = matches[1];
            buffer = Buffer.from(matches[2], 'base64');
            extension = mimeType.split('/')[1] || 'bin';
        } else {
            // Assume raw base64 string
            buffer = Buffer.from(fileData, 'base64');
            const parts = fileName.split('.');
            extension = parts[parts.length - 1] || 'bin';
        }

        const safeFileName = `verification_${userId}_${Date.now()}.${extension}`;
        const filePath = path.join(UPLOAD_DIR, safeFileName);
        
        await fs.writeFile(filePath, buffer);
        const fileUrl = `/uploads/${safeFileName}`;

        // Create VerificationDocument record
        const document = await prisma.verificationDocument.create({
            data: {
                userId,
                documentType,
                fileUrl,
                status: 'PENDING'
            }
        });

        res.status(201).json({
            success: true,
            message: 'Verification document uploaded successfully. Status: PENDING.',
            data: document
        });
    } catch (error) {
        next(error);
    }
}

export async function getVerificationStatus(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.userId;

        const [user, documents] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: { isVerified: true }
            }),
            prisma.verificationDocument.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            isVerified: user.isVerified,
            documents
        });
    } catch (error) {
        next(error);
    }
}

export async function adminVerify(req: Request, res: Response, next: NextFunction) {
    try {
        const { documentId, status } = req.body;

        if (!documentId || !status) {
            res.status(400).json({ error: 'documentId and status are required' });
            return;
        }

        if (status !== 'APPROVED' && status !== 'REJECTED') {
            res.status(400).json({ error: 'Invalid status. Must be APPROVED or REJECTED' });
            return;
        }

        const doc = await prisma.verificationDocument.findUnique({
            where: { id: documentId }
        });

        if (!doc) {
            res.status(404).json({ error: 'Verification document not found' });
            return;
        }

        const updatedDoc = await prisma.verificationDocument.update({
            where: { id: documentId },
            data: { status }
        });

        // If approved, verify the user
        let userVerified = false;
        if (status === 'APPROVED') {
            await prisma.user.update({
                where: { id: doc.userId },
                data: { isVerified: true }
            });
            userVerified = true;

            const notif = await createNotification(doc.userId, {
                type: 'profile_verified',
                title: 'Profile Verified! ⚜️',
                description: 'Your Catholic verification is complete. The Gold Badge is now visible on your profile!',
                relatedId: doc.id
            });
            if (notif) pushNotificationToUser(doc.userId, notif);
        } else {
            // Check if user has any other APPROVED documents before de-verifying
            const otherApproved = await prisma.verificationDocument.count({
                where: { userId: doc.userId, status: 'APPROVED' }
            });

            if (otherApproved === 0) {
                await prisma.user.update({
                    where: { id: doc.userId },
                    data: { isVerified: false }
                });
            }

            const notif = await createNotification(doc.userId, {
                type: 'profile_verified',
                title: 'Verification Update',
                description: 'Your uploaded verification document was declined. Please upload a clear document.',
                relatedId: doc.id
            });
            if (notif) pushNotificationToUser(doc.userId, notif);
        }

        res.json({
            success: true,
            message: `Document status updated to ${status}.`,
            isVerified: userVerified,
            data: updatedDoc
        });
    } catch (error) {
        next(error);
    }
}
