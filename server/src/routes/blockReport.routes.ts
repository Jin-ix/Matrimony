import { Router } from 'express';
import * as blockReportController from '../controllers/blockReport.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/block', blockReportController.blockUser);
router.post('/report', blockReportController.reportUser);

export default router;
