import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { listUsers, updateUser, getUsage } from '../controllers/adminController';

const router = Router();

router.use(authenticateJWT, requireRole('admin'));
router.get('/users', listUsers);
router.patch('/users/:id', updateUser);
router.get('/usage', getUsage);

export default router;
