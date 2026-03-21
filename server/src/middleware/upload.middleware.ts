import multer from 'multer';
import path from 'path';
import { createError } from './error.middleware.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

export const uploadPhoto = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 3,
    },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(createError('Only JPEG, PNG, and WebP images are allowed', 400));
        }
    },
});
