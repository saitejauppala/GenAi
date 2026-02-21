import { Response } from 'express';
import path from 'path';
import Project from '../models/project';
import ProjectFile from '../models/projectFile';
import {
  createProjectDirectory,
  createProjectZip,
  removeFileSilently,
  readTextFileSafe,
  verifyPathExists,
  writeProjectFile
} from '../services/projectFileService';
import { logger } from '../utils/logger';

async function getOwnedProject(projectId: string, userId: string) {
  const project = await Project.findById(projectId);
  if (!project) return null;
  if (project.owner.toString() !== userId) return null;
  if (!project.folderPath) {
    project.folderPath = await createProjectDirectory(project.name);
    await project.save();
  }
  return project;
}

export async function createProject(req: any, res: Response) {
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ message: 'Project name is required' });

  const description = String(req.body?.description || '').trim();
  const existing = await Project.findOne({ owner: req.user.id, name });
  if (existing) return res.status(400).json({ message: 'Project with this name already exists' });

  const folderPath = await createProjectDirectory(name);
  const project = new Project({
    owner: req.user.id,
    createdBy: req.user.id,
    name,
    description: description || undefined,
    folderPath,
    files: {}
  });
  await project.save();
  logger.info(`Project created: ${name} by user ${req.user.id}`);

  res.json(project);
}

export async function listProjects(req: any, res: Response) {
  const projects = await Project.find({ owner: req.user.id }).sort({ updatedAt: -1 });
  res.json(projects);
}

export async function getProjectById(req: any, res: Response) {
  const project = await getOwnedProject(req.params.id, req.user.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
}

export async function saveProjectFile(req: any, res: Response) {
  const project = await getOwnedProject(req.params.id, req.user.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const fileName = String(req.body?.fileName || '').trim();
  const content = String(req.body?.content || '');
  const contentType = String(req.body?.contentType || 'text/plain');
  if (!fileName) return res.status(400).json({ message: 'fileName is required' });

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
  logger.info(`File saved in project ${project.name}: ${saved.fileName}`);

  res.json(metadata);
}

export async function listProjectFiles(req: any, res: Response) {
  const project = await getOwnedProject(req.params.id, req.user.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const files = await ProjectFile.find({ project: project._id }).sort({ createdAt: -1 });
  res.json(files);
}

export async function downloadProjectFile(req: any, res: Response) {
  const project = await getOwnedProject(req.params.id, req.user.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const file = await ProjectFile.findById(req.params.fileId);
  if (!file || file.project.toString() !== project._id.toString()) {
    return res.status(404).json({ message: 'File not found' });
  }

  await verifyPathExists(file.absolutePath);
  logger.info(`File downloaded from project ${project.name}: ${file.fileName}`);
  return res.download(file.absolutePath, file.fileName);
}

export async function exportProjectZip(req: any, res: Response) {
  const project = await getOwnedProject(req.params.id, req.user.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const zipPath = await createProjectZip(project.folderPath, project.name);
  const fileName = `${project.name.replace(/\s+/g, '-').toLowerCase() || 'project'}.zip`;
  logger.info(`Project ZIP export started: ${project.name}`);

  res.download(zipPath, fileName, async () => {
    await removeFileSilently(zipPath);
  });
}

// Backward-compatible endpoint kept for existing UI integration.
export async function downloadProject(req: any, res: Response) {
  return exportProjectZip(req, res);
}

export async function getFileContent(req: any, res: Response) {
  const project = await getOwnedProject(req.params.id, req.user.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const file = await ProjectFile.findById(req.params.fileId);
  if (!file || file.project.toString() !== project._id.toString()) {
    return res.status(404).json({ message: 'File not found' });
  }

  await verifyPathExists(file.absolutePath);
  const relative = path.relative(project.folderPath, file.absolutePath);
  const preview = await readTextFileSafe(file.absolutePath);
  res.json({ ...file.toObject(), relativePath: relative, preview });
}
