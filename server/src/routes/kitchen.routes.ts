import { Router } from 'express';
import * as kitchenController from '../controllers/kitchen.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { sendKitchenMessageSchema } from '../validators/message.validators.js';

const router = Router();

router.use(authMiddleware);

router.get('/my-tables', kitchenController.getMyTables);
router.get('/:matchId', kitchenController.getKitchenTable);
router.get('/:matchId/messages', kitchenController.getMessages);
router.post('/:matchId/messages', validate(sendKitchenMessageSchema), kitchenController.sendMessage);
router.post('/:matchId/members', kitchenController.addMember);

export default router;
