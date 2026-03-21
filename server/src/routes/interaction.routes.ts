import { Router } from 'express';
import * as interactionController from '../controllers/interaction.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { expressInterestSchema, recommendSchema } from '../validators/interaction.validators.js';

const router = Router();

router.use(authMiddleware);

router.post('/interest', validate(expressInterestSchema), interactionController.expressInterest);
router.post('/pass', validate(expressInterestSchema), interactionController.passProfile);
router.post('/recommend', validate(recommendSchema), interactionController.recommendProfile);
router.get('/received', interactionController.getReceivedInterests);
router.get('/sent', interactionController.getSentInterests);

export default router;
