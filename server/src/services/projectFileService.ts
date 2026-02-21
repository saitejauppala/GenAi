import { createWriteStream, promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { logger } from '../utils/logger';

// Use require to avoid strict type dependency issues in current TS config.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const archiver = require('archiver');

const PROJECTS_ROOT = path.resolve(process.cwd(), 'projects');

function sanitizeSegment(input: string): string {
  const value = input.trim().toLowerCase();
  const safe = value.replace(/[^a-z0-9-_ ]/gi, '').replace(/\s+/g, '-');
  return safe || `project-${Date.now()}`;
}

function sanitizeFileName(input: string): string {
  const base = path.basename(input.trim() || `file-${Date.now()}.txt`);
  return base.replace(/[^a-z0-9._-]/gi, '_');
}

export async function ensureProjectsRoot() {
  await fs.mkdir(PROJECTS_ROOT, { recursive: true });
}

export async function createProjectDirectory(projectName: string): Promise<string> {
  await ensureProjectsRoot();
  const baseFolder = sanitizeSegment(projectName);
  let folderPath = path.join(PROJECTS_ROOT, baseFolder);
  let counter = 2;

  while (true) {
    try {
      await fs.access(folderPath);
      folderPath = path.join(PROJECTS_ROOT, `${baseFolder}-${counter}`);
      counter += 1;
    } catch {
      await fs.mkdir(folderPath, { recursive: true });
      return folderPath;
    }
  }
}

export async function writeProjectFile(params: {
  folderPath: string;
  fileName: string;
  content: string;
}): Promise<{ absolutePath: string; relativePath: string; size: number; fileName: string }> {
  const { folderPath, content } = params;
  const fileName = sanitizeFileName(params.fileName);
  await fs.mkdir(folderPath, { recursive: true });

  const absolutePath = path.join(folderPath, fileName);
  await fs.writeFile(absolutePath, content, 'utf8');
  const stats = await fs.stat(absolutePath);

  return {
    absolutePath,
    relativePath: fileName,
    size: stats.size,
    fileName
  };
}

export async function verifyPathExists(filePath: string) {
  await fs.access(filePath);
}

export async function readTextFileSafe(filePath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content.slice(0, 250_000);
  } catch {
    return '';
  }
}

export async function createProjectZip(folderPath: string, projectName: string): Promise<string> {
  const safeProjectName = sanitizeSegment(projectName);
  const zipPath = path.join(os.tmpdir(), `${safeProjectName}-${Date.now()}.zip`);

  await fs.mkdir(path.dirname(zipPath), { recursive: true });

  return new Promise((resolve, reject) => {
    let archive: any;
    try {
      archive = archiver('zip', { zlib: { level: 9 } });
    } catch (err) {
      reject(new Error('`archiver` package is required. Run `npm i archiver` in server.'));
      return;
    }

    const output = createWriteStream(zipPath);
    output.on('close', () => resolve(zipPath));
    output.on('error', (err) => reject(err));

    archive.on('warning', (err: any) => logger.warn('Zip warning:', err?.message || err));
    archive.on('error', (err: any) => reject(err));

    archive.pipe(output);
    archive.directory(folderPath, false);
    archive.finalize().catch((err: any) => reject(err));
  });
}

export async function removeFileSilently(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch {
    // no-op
  }
}
