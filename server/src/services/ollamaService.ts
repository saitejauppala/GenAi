import axios from 'axios';
import { IncomingMessage } from 'http';
import { ollamaApiUrl, ollamaModel } from '../config';
import { logger } from '../utils/logger';

export type OllamaResponse = {
  text: string;
  model: string;
  tokensUsed: number;
};

type RetryOptions = {
  maxRetries?: number;
  timeoutMs?: number;
};

type OllamaHealth = {
  status: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
  checkedAt: string | null;
  message: string;
};

const DEFAULT_TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT_MS || '120000', 10);
const HEALTH_TIMEOUT_MS = parseInt(process.env.OLLAMA_HEALTH_TIMEOUT_MS || '10000', 10);
const MAX_RETRIES = 3;
const HEALTH_POLL_INTERVAL_MS = 60000;

const healthState: OllamaHealth = {
  status: 'UNKNOWN',
  checkedAt: null,
  message: 'Health has not been checked yet.'
};

let monitorStarted = false;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(err: any) {
  const code = String(err?.code || '');
  if (!err?.response) return true;
  if (['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNABORTED'].includes(code)) return true;
  const status = Number(err?.response?.status || 0);
  return status >= 500;
}

async function postToOllama(
  body: Record<string, unknown>,
  options: RetryOptions = {}
): Promise<any> {
  const maxRetries = options.maxRetries ?? MAX_RETRIES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const { data } = await axios.post(ollamaApiUrl, body, { timeout: timeoutMs });
      return data;
    } catch (err: any) {
      lastError = err;
      const retry = attempt < maxRetries && shouldRetry(err);
      if (!retry) break;
      const backoffMs = attempt * 500;
      logger.warn(`Ollama request failed (attempt ${attempt}/${maxRetries}), retrying in ${backoffMs}ms`);
      await wait(backoffMs);
    }
  }

  if (!lastError?.response) {
    throw new Error(
      'Remote AI server is unreachable. Check tunnel URL and Ollama server availability.'
    );
  }

  const message =
    lastError?.response?.data?.error ||
    lastError?.response?.data?.message ||
    `Ollama request failed with status ${lastError.response.status}`;
  throw new Error(message);
}

export async function generateWithOllama(
  prompt: string,
  options: RetryOptions = {}
): Promise<OllamaResponse> {
  if (!prompt.trim()) throw new Error('Prompt cannot be empty');

  const data = await postToOllama(
    { model: ollamaModel, prompt, stream: false },
    { maxRetries: options.maxRetries ?? MAX_RETRIES, timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS }
  );

  const text = String(data?.response || '').trim();
  const tokensUsed = Number(data?.eval_count || 0) + Number(data?.prompt_eval_count || 0);
  return { text, model: data?.model || ollamaModel, tokensUsed };
}

export async function streamGenerateWithOllama(params: {
  prompt: string;
  onChunk: (chunk: string) => void;
  timeoutMs?: number;
}): Promise<OllamaResponse> {
  if (!params.prompt.trim()) throw new Error('Prompt cannot be empty');

  let response: IncomingMessage;
  try {
    const result = await axios.post(
      ollamaApiUrl,
      { model: ollamaModel, prompt: params.prompt, stream: true },
      { responseType: 'stream', timeout: params.timeoutMs ?? DEFAULT_TIMEOUT_MS }
    );
    response = result.data;
  } catch (err: any) {
    if (!err?.response) {
      throw new Error(
        'Remote AI server is unreachable. Check tunnel URL and Ollama server availability.'
      );
    }
    const message =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      `Ollama request failed with status ${err.response.status}`;
    throw new Error(message);
  }

  return new Promise((resolve, reject) => {
    let buffer = '';
    let fullText = '';
    let modelName = ollamaModel;
    let tokensUsed = 0;

    response.on('data', (chunk: Buffer) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.model) modelName = parsed.model;
          if (parsed.response) {
            const text = String(parsed.response);
            fullText += text;
            params.onChunk(text);
          }
          if (parsed.done) {
            tokensUsed = Number(parsed.eval_count || 0) + Number(parsed.prompt_eval_count || 0);
          }
        } catch {
          // Ignore malformed partial chunks.
        }
      }
    });

    response.on('end', () => {
      resolve({ text: fullText.trim(), model: modelName, tokensUsed });
    });

    response.on('error', (err) => reject(err));
  });
}

export async function checkOllamaHealth(force = false): Promise<OllamaHealth> {
  if (!force && healthState.status !== 'UNKNOWN' && healthState.checkedAt) {
    const elapsed = Date.now() - new Date(healthState.checkedAt).getTime();
    if (elapsed < 15000) return { ...healthState };
  }

  try {
    await postToOllama(
      { model: ollamaModel, prompt: 'health check', stream: false, options: { num_predict: 1 } },
      { timeoutMs: HEALTH_TIMEOUT_MS, maxRetries: 1 }
    );
    healthState.status = 'ONLINE';
    healthState.message = 'Remote AI server is reachable.';
  } catch (err: any) {
    healthState.status = 'OFFLINE';
    healthState.message = String(err?.message || 'Remote AI server is unavailable.');
    logger.error('Ollama health check failed:', healthState.message);
  }

  healthState.checkedAt = new Date().toISOString();
  return { ...healthState };
}

export function getOllamaHealthStatus(): OllamaHealth {
  return { ...healthState };
}

export function startOllamaHealthMonitor() {
  if (monitorStarted) return;
  monitorStarted = true;

  const run = async () => {
    await checkOllamaHealth(true);
  };

  run().catch((err) => logger.error('Initial Ollama health check failed:', err));
  const timer = setInterval(() => {
    run().catch((err) => logger.error('Scheduled Ollama health check failed:', err));
  }, HEALTH_POLL_INTERVAL_MS);

  if (typeof (timer as any).unref === 'function') {
    (timer as any).unref();
  }
}
