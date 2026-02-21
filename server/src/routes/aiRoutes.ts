import { Router } from 'express';
import {
  assist,
  chat,
  generate,
  getChatById,
  getLastHealthStatus,
  healthCheck,
  listChats
} from '../controllers/aiController';
import { authenticateJWT } from '../middleware/auth';
import { enforceAiQuota } from '../middleware/usageMeter';

const router = Router();

// Public health checks for frontend/monitoring.
router.post('/health-check', healthCheck);
router.get('/health-check', getLastHealthStatus);

router.use(authenticateJWT);

router.get('/chats', listChats);
router.get('/chats/:id', getChatById);
router.post('/chat', enforceAiQuota, chat);

// assist: available to free and premium (subject to quota)
router.post('/assist', enforceAiQuota, assist);

// generate: remote Ollama integration endpoint
router.post('/generate', enforceAiQuota, generate);

export default router;
