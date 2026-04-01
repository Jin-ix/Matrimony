import { Router } from 'express';
import * as familyMatchController from '../controllers/familyMatch.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', familyMatchController.createFamilyMatchChat);
router.get('/', familyMatchController.getFamilyMatchChats);
router.get('/:chatId/messages', familyMatchController.getMessages);
router.post('/:chatId/messages', familyMatchController.sendMessage);
router.post('/:chatId/members', familyMatchController.addMember);

export default router;
