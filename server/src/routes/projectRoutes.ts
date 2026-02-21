import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import {
  createProject,
  downloadProject,
  downloadProjectFile,
  exportProjectZip,
  getFileContent,
  getProjectById,
  listProjectFiles,
  listProjects,
  saveProjectFile
} from '../controllers/projectController';

const router = Router();

router.use(authenticateJWT);

// Route aliases for compatibility with external API clients.
router.post('/create', createProject);
router.get('/list', listProjects);

router.post('/', createProject);
router.get('/', listProjects);
router.get('/:id', getProjectById);
router.get('/:id/files', listProjectFiles);
router.post('/:id/files', saveProjectFile);
router.get('/:id/files/:fileId', getFileContent);
router.get('/:id/files/:fileId/download', downloadProjectFile);
router.get('/:id/export-zip', exportProjectZip);
router.get('/:id/download', downloadProject);

export default router;
