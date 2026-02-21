import { Response } from 'express';
import Project from '../models/project';
import ProjectFile from '../models/projectFile';
import {
  createProjectZip,
  removeFileSilently,
  verifyPathExists,
  writeProjectFile
} from '../services/projectFileService';
import { logger } from '../utils/logger';

async function getOwnedProjectByName(userId: string, encodedProjectName: string) {
  const projectName = decodeURIComponent(encodedProjectName);
  return Project.findOne({ owner: userId, name: projectName });
}

export async function saveFile(req: any, res: Response) {
  const projectName = String(req.body?.projectName || '').trim();
  const fileName = String(req.body?.fileName || '').trim();
  const content = String(req.body?.content || '');
  const contentType = String(req.body?.contentType || 'text/plain');

  if (!projectName) return res.status(400).json({ message: 'projectName is required' });
  if (!fileName) return res.status(400).json({ message: 'fileName is required' });

  const project = await Project.findOne({ owner: req.user.id, name: projectName });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  try {
    const saved = await writeProjectFile({
      folderPath: project.folderPath,
      fileName,
      content
    });

    const metadata = await ProjectFile.create({
      project: project._id,
      owner: req.user.id,
      projectName: project.name,
      fileName: saved.fileName,
      relativePath: saved.relativePath,
      absolutePath: saved.absolutePath,
      filePath: saved.absolutePath,
      contentType,
      size: saved.size
    });

    logger.info(`File saved to project "${project.name}" as "${saved.fileName}"`);
    return res.json(metadata);
  } catch (err) {
    logger.error('File save failed:', err);
    return res.status(500).json({ message: 'Failed to save file' });
  }
}

export async function listFiles(req: any, res: Response) {
  const project = await getOwnedProjectByName(req.user.id, req.params.projectName);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const files = await ProjectFile.find({ project: project._id }).sort({ createdAt: -1 });
  return res.json(files);
}

export async function downloadFile(req: any, res: Response) {
  const project = await getOwnedProjectByName(req.user.id, req.params.projectName);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const fileNameRaw = req.params.fileName || req.query.fileName;
  const fileName = String(fileNameRaw || '').trim();

  let file = null;
  if (fileName) {
    file = await ProjectFile.findOne({ project: project._id, fileName: decodeURIComponent(fileName) }).sort({
      createdAt: -1
    });
  } else {
    file = await ProjectFile.findOne({ project: project._id }).sort({ createdAt: -1 });
  }

  if (!file) return res.status(404).json({ message: 'File not found' });

  try {
    await verifyPathExists(file.absolutePath);
    logger.info(`File download: ${project.name}/${file.fileName}`);
    return res.download(file.absolutePath, file.fileName);
  } catch (err) {
    logger.error('File download failed:', err);
    return res.status(404).json({ message: 'File not found on disk' });
  }
}

export async function exportProject(req: any, res: Response) {
  const project = await getOwnedProjectByName(req.user.id, req.params.projectName);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  try {
    const zipPath = await createProjectZip(project.folderPath, project.name);
    const fileName = `${project.name.replace(/\s+/g, '-').toLowerCase() || 'project'}.zip`;
    logger.info(`Project export requested: ${project.name}`);

    return res.download(zipPath, fileName, async () => {
      await removeFileSilently(zipPath);
    });
  } catch (err) {
    logger.error('Project export failed:', err);
    return res.status(500).json({ message: 'Failed to export project files' });
  }
}
