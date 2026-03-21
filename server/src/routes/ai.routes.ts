import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/onboarding/chat', aiController.onboardingChat);
router.get('/onboarding/summary/:userId?', aiController.getOnboardingSummary);
router.post('/icebreaker', aiController.generateIcebreaker);

export default router;
