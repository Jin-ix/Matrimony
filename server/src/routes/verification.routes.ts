import { Router } from 'express';
import * as verificationController from '../controllers/verification.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/upload', verificationController.uploadDocument);
router.get('/status', verificationController.getVerificationStatus);
router.post('/admin-verify', verificationController.adminVerify);

export default router;
