import { Router } from 'express';
import * as conversationController from '../controllers/conversation.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { sendMessageSchema } from '../validators/message.validators.js';

const router = Router();

router.use(authMiddleware);

router.get('/', conversationController.getConversations);
router.get('/:conversationId/messages', conversationController.getMessages);
router.post('/:conversationId/messages', validate(sendMessageSchema), conversationController.sendMessage);
router.post('/:conversationId/close', conversationController.archiveConversation);
router.get('/:conversationId/icebreaker', conversationController.getIcebreaker);
router.post('/:conversationId/reveal', conversationController.revealMedia);

export default router;
