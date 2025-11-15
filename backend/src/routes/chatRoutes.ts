import express from 'express';
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  createMessage,
  getUnreadCount,
} from '../controllers/chatController';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/conversations', authenticate, getConversations);
router.post('/conversations', authenticate, getOrCreateConversation);
router.get('/conversations/:conversationId/messages', authenticate, getMessages);
router.post('/messages', authenticate, createMessage);
router.get('/unread-count', authenticate, getUnreadCount);

export default router;

