import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
    registerSchema,
    sendOtpSchema,
    verifyOtpSchema,
    loginSchema,
    changePasswordSchema,
    refreshTokenSchema,
} from '../validators/auth.validators.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/send-otp', validate(sendOtpSchema), authController.sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);
router.post('/change-password', authMiddleware, validate(changePasswordSchema), authController.changePassword);
router.get('/linkedin', authController.linkedInAuth);
router.get('/linkedin/callback', optionalAuth, authController.linkedInCallback);
router.get('/instagram', authController.instagramAuth);
router.get('/instagram/callback', optionalAuth, authController.instagramCallback);

// Parent-Candidate linking
router.post('/link-parent', authController.linkParent);
router.get('/my-link', authMiddleware, authController.getMyLink);

export default router;
