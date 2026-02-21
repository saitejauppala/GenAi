import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { downloadFile, exportProject, listFiles, saveFile } from '../controllers/filesController';

const router = Router();

router.use(authenticateJWT);

router.post('/save', saveFile);
router.get('/list/:projectName', listFiles);
router.get('/download/:projectName', downloadFile);
router.get('/download/:projectName/:fileName', downloadFile);
router.post('/export/:projectName', exportProject);

export default router;
