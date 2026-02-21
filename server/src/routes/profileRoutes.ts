import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { getMyProfile, updateMyProfile } from '../controllers/profileController';

const router = Router();

router.use(authenticateJWT);
router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);

export default router;
