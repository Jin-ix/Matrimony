import prisma from '../config/database.js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// Local file storage for development
// In production, replace with Cloudinary or S3
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

async function ensureUploadDir() {
    try {
        await fs.access(UPLOAD_DIR);
    } catch {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
}

export async function uploadPhoto(
    userId: string,
    file: Express.Multer.File
): Promise<{ id: string; url: string }> {
    await ensureUploadDir();

    // Check photo limit
    const photoCount = await prisma.photo.count({ where: { userId } });
    if (photoCount >= 3) {
        throw Object.assign(new Error('Maximum 3 photos allowed'), { statusCode: 400 });
    }

    // Process image with Sharp
    const filename = `${userId}_${Date.now()}.webp`;
    const filepath = path.join(UPLOAD_DIR, filename);

    await sharp(file.buffer)
        .resize(800, 1000, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(filepath);

    const url = `/uploads/${filename}`;
    const isPrimary = photoCount === 0;

    const photo = await prisma.photo.create({
        data: {
            userId,
            url,
            publicId: filename,
            isPrimary,
            order: photoCount,
        },
    });

    return { id: photo.id, url: photo.url };
}

export async function deletePhoto(userId: string, photoId: string): Promise<void> {
    const photo = await prisma.photo.findFirst({
        where: { id: photoId, userId },
    });

    if (!photo) {
        throw Object.assign(new Error('Photo not found'), { statusCode: 404 });
    }

    // Delete file from disk
    if (photo.publicId) {
        try {
            await fs.unlink(path.join(UPLOAD_DIR, photo.publicId));
        } catch {
            // File may not exist on disk
        }
    }

    await prisma.photo.delete({ where: { id: photoId } });

    // If deleted primary, make next photo primary
    if (photo.isPrimary) {
        const nextPhoto = await prisma.photo.findFirst({
            where: { userId },
            orderBy: { order: 'asc' },
        });
        if (nextPhoto) {
            await prisma.photo.update({
                where: { id: nextPhoto.id },
                data: { isPrimary: true },
            });
        }
    }
}

export async function setPrimaryPhoto(userId: string, photoId: string): Promise<void> {
    const photo = await prisma.photo.findFirst({
        where: { id: photoId, userId },
    });

    if (!photo) {
        throw Object.assign(new Error('Photo not found'), { statusCode: 404 });
    }

    // Unset all primary
    await prisma.photo.updateMany({
        where: { userId },
        data: { isPrimary: false },
    });

    // Set new primary
    await prisma.photo.update({
        where: { id: photoId },
        data: { isPrimary: true },
    });
}
