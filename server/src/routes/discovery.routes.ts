import { Router } from 'express';
import * as discoveryController from '../controllers/discovery.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/feed', discoveryController.getDiscoveryFeed);

export default router;
