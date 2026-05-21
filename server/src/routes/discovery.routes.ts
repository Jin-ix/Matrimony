import { Router } from 'express';
import * as discoveryController from '../controllers/discovery.controller.js';
import * as compatibilityReviewController from '../controllers/compatibilityReview.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/feed', discoveryController.getDiscoveryFeed);
router.get('/compatibility-review/:targetUserId', compatibilityReviewController.getCompatibilityReview);

export default router;
