import { Request, Response } from 'express';
import AIUsage from '../models/aiUsage';
import ChatSession from '../models/chatSession';
import Project from '../models/project';
import ProjectFile from '../models/projectFile';
import User from '../models/user';
import { maxPromptChars } from '../config';
import {
  checkOllamaHealth,
  generateWithOllama,
  getOllamaHealthStatus,
  streamGenerateWithOllama
} from '../services/ollamaService';
import { createProjectDirectory, writeProjectFile } from '../services/projectFileService';
import { logger } from '../utils/logger';

type ChatRequest = {
  prompt?: string;
  chatId?: string;
  projectId?: string;
  saveToProject?: boolean;
  fileName?: string;
  stream?: boolean;
};

type ParsedGeneratedFile = {
  fileName: string;
  content: string;
};

function shortTitle(text: string) {
  return text.trim().slice(0, 70) || `Chat ${new Date().toLocaleString()}`;
}

function validatePrompt(prompt: string) {
  if (!prompt.trim()) return 'Missing prompt';
  if (prompt.length > maxPromptChars) {
    return `Prompt too large. Max ${maxPromptChars} characters allowed.`;
  }
  return null;
}

function buildConversationPrompt(messages: Array<{ role: string; content: string }>, latestPrompt: string) {
  const history = messages
    .slice(-12)
    .map((message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`)
    .join('\n');

  return [
    'You are a senior full-stack software engineer.',
    'Provide production-oriented and concise implementation guidance.',
    '',
    history,
    `User: ${latestPrompt}`,
    'Assistant:'
  ].join('\n');
}

function normalizeAiError(err: any): { status: number; message: string } {
  const message = String(err?.message || 'AI request failed');
  if (message.toLowerCase().includes('unreachable')) {
    return { status: 503, message: 'AI Server Offline: remote Ollama endpoint is unreachable.' };
  }
  if (message.toLowerCase().includes('timed out')) {
    return { status: 504, message: 'AI request timed out. Please retry with a shorter prompt.' };
  }
  return { status: 500, message };
}

async function safeLogUsage(payload: any) {
  try {
    await AIUsage.create(payload);
  } catch (err) {
    logger.error('Failed to save AI usage log:', err);
  }
}

async function resolveOwnedProject(userId: string, projectId?: string) {
  if (!projectId) return null;
  const project = await Project.findById(projectId);
  if (!project) return null;
  if (project.owner.toString() !== userId) return null;
  if (!project.folderPath) {
    project.folderPath = await createProjectDirectory(project.name);
    await project.save();
  }
  return project;
}

function parseGeneratedFiles(rawText: string, fallbackFileName?: string): ParsedGeneratedFile[] {
  const text = String(rawText || '');
  const markerRegex = /---FILE:\s*([^\n]+?)---/g;
  const markers: Array<{ fileName: string; index: number; end: number }> = [];

  let match: RegExpExecArray | null = null;
  while ((match = markerRegex.exec(text)) !== null) {
    markers.push({
      fileName: String(match[1] || '').trim(),
      index: match.index,
      end: markerRegex.lastIndex
    });
  }

  if (!markers.length) {
    return [
      {
        fileName: fallbackFileName?.trim() || `generated-${Date.now()}.md`,
        content: text
      }
    ];
  }

  const files: ParsedGeneratedFile[] = [];
  for (let i = 0; i < markers.length; i += 1) {
    const current = markers[i];
    const next = markers[i + 1];
    const content = text.slice(current.end, next ? next.index : text.length).trim();
    files.push({
      fileName: current.fileName || `generated-${Date.now()}-${i + 1}.md`,
      content
    });
  }

  return files.filter((file) => file.content.length > 0);
}

async function saveGeneratedOutputsToProject(params: {
  userId: string;
  project: any;
  content: string;
  fileName?: string;
}) {
  const parsedFiles = parseGeneratedFiles(params.content, params.fileName);
  const savedFiles: any[] = [];

  for (const entry of parsedFiles) {
    const written = await writeProjectFile({
      folderPath: params.project.folderPath,
      fileName: entry.fileName,
      content: entry.content
    });

    const metadata = await ProjectFile.create({
      project: params.project._id,
      owner: params.userId,
      projectName: params.project.name,
      fileName: written.fileName,
      relativePath: written.relativePath,
      absolutePath: written.absolutePath,
      filePath: written.absolutePath,
      contentType: 'text/markdown',
      size: written.size
    });

    savedFiles.push(metadata);
  }

  return savedFiles;
}

async function getOrCreateSession(req: any, prompt: string, project: any) {
  const body: ChatRequest = req.body || {};
  if (body.chatId) {
    const existing = await ChatSession.findById(body.chatId);
    if (!existing) return { error: { status: 404, message: 'Chat not found' }, session: null };
    if (existing.user.toString() !== req.user.id) {
      return { error: { status: 403, message: 'Forbidden' }, session: null };
    }
    if (!existing.project && project) existing.project = project._id;
    if (!existing.associatedProject && project) existing.associatedProject = project._id;
    return { error: null, session: existing };
  }

  const created = new ChatSession({
    user: req.user.id,
    project: project?._id,
    associatedProject: project?._id,
    title: shortTitle(prompt),
    messages: []
  });
  return { error: null, session: created };
}

async function runChatFlow(req: any, res: Response, mode: 'chat' | 'assist' | 'generate') {
  const body: ChatRequest = req.body || {};
  const prompt = String(body.prompt || '').trim();
  const validationError = validatePrompt(prompt);
  if (validationError) return res.status(400).json({ message: validationError });

  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  const project = await resolveOwnedProject(req.user.id, body.projectId);
  if (body.projectId && !project) {
    return res.status(404).json({ message: 'Project not found or not accessible' });
  }

  const sessionResult = await getOrCreateSession(req, prompt, project);
  if (sessionResult.error) return res.status(sessionResult.error.status).json({ message: sessionResult.error.message });
  const session = sessionResult.session!;
  session.messages.push({ role: 'user', content: prompt, createdAt: new Date() });

  const conversationPrompt = buildConversationPrompt(session.messages, prompt);
  const stream = Boolean(body.stream);

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      let streamedText = '';
      const ai = await streamGenerateWithOllama({
        prompt: conversationPrompt,
        onChunk: (chunk) => {
          streamedText += chunk;
          res.write(`data: ${JSON.stringify({ type: 'chunk', chunk })}\n\n`);
        }
      });

      let savedFiles: any[] = [];
      if (project && body.saveToProject) {
        savedFiles = await saveGeneratedOutputsToProject({
          userId: req.user.id,
          project,
          content: ai.text,
          fileName: body.fileName
        });
      }

      session.messages.push({
        role: 'assistant',
        content: streamedText.trim(),
        createdAt: new Date(),
        fileId: savedFiles[0]?._id
      });
      await session.save();

      await safeLogUsage({
        user: user._id,
        prompt,
        type: mode === 'chat' ? 'chat' : mode,
        modelName: ai.model,
        tokensUsed: ai.tokensUsed,
        approxCost: 0
      });

      res.write(
        `data: ${JSON.stringify({
          type: 'done',
          chatId: session._id,
          model: ai.model,
          tokensUsed: ai.tokensUsed,
          savedFile: savedFiles[0]
            ? { id: savedFiles[0]._id, fileName: savedFiles[0].fileName, projectId: savedFiles[0].project }
            : null,
          savedFiles: savedFiles.map((file) => ({
            id: file._id,
            fileName: file.fileName,
            projectId: file.project
          }))
        })}\n\n`
      );
      res.end();
      return;
    } catch (err: any) {
      await safeLogUsage({
        user: user._id,
        prompt,
        type: mode === 'chat' ? 'chat' : mode,
        modelName: 'ollama-unknown',
        tokensUsed: 0,
        approxCost: 0,
        success: false
      });
      const normalized = normalizeAiError(err);
      logger.error('AI stream request failed:', normalized.message);
      res.write(`data: ${JSON.stringify({ type: 'error', message: normalized.message })}\n\n`);
      res.end();
      return;
    }
  }

  try {
    const ai = await generateWithOllama(conversationPrompt);
    let savedFiles: any[] = [];
    if (project && body.saveToProject) {
      savedFiles = await saveGeneratedOutputsToProject({
        userId: req.user.id,
        project,
        content: ai.text,
        fileName: body.fileName
      });
    }

    session.messages.push({
      role: 'assistant',
      content: ai.text,
      createdAt: new Date(),
      fileId: savedFiles[0]?._id
    });
    await session.save();

    await safeLogUsage({
      user: user._id,
      prompt,
      type: mode === 'chat' ? 'chat' : mode,
      modelName: ai.model,
      tokensUsed: ai.tokensUsed,
      approxCost: 0
    });

    return res.json({
      chatId: session._id,
      text: ai.text,
      model: ai.model,
      tokensUsed: ai.tokensUsed,
      savedFile: savedFiles[0]
        ? {
            id: savedFiles[0]._id,
            fileName: savedFiles[0].fileName,
            projectId: savedFiles[0].project
          }
        : null,
      savedFiles: savedFiles.map((file) => ({
        id: file._id,
        fileName: file.fileName,
        projectId: file.project
      }))
    });
  } catch (err: any) {
    await safeLogUsage({
      user: user._id,
      prompt,
      type: mode === 'chat' ? 'chat' : mode,
      modelName: 'ollama-unknown',
      tokensUsed: 0,
      approxCost: 0,
      success: false
    });
    const normalized = normalizeAiError(err);
    logger.error('AI request failed:', normalized.message);
    return res.status(normalized.status).json({ message: normalized.message });
  }
}

export async function listChats(req: any, res: Response) {
  const search = String(req.query.search || '').trim();
  const filter: any = { user: req.user.id };
  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ title: regex }, { 'messages.content': regex }];
  }

  const chats = await ChatSession.find(filter)
    .sort({ updatedAt: -1 })
    .limit(50)
    .populate('project', 'name')
    .select('_id title project updatedAt createdAt');

  res.json(chats);
}

export async function getChatById(req: any, res: Response) {
  const chat = await ChatSession.findById(req.params.id)
    .populate('project', 'name')
    .populate('associatedProject', 'name');
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  if (chat.user.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  res.json(chat);
}

export async function healthCheck(_: Request, res: Response) {
  const status = await checkOllamaHealth(true);
  res.json(status);
}

export async function getLastHealthStatus(_: Request, res: Response) {
  res.json(getOllamaHealthStatus());
}

export async function chat(req: any, res: Response) {
  return runChatFlow(req, res, 'chat');
}

export async function assist(req: any, res: Response) {
  return runChatFlow(req, res, 'assist');
}

export async function generate(req: any, res: Response) {
  return runChatFlow(req, res, 'generate');
}
