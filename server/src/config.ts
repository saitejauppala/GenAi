import path from 'path';

export const jwtSecret = process.env.JWT_SECRET || 'devai-secret-change-in-prod';
export const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'saitejauppala07@gmail.com';
export const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMePlease!123';
export const syncSuperAdminPassword =
  String(process.env.SYNC_SUPER_ADMIN_PASSWORD || 'false').toLowerCase() === 'true';
export const stripeSecret = process.env.STRIPE_SECRET || '';
export const openAiKey = process.env.OPENAI_API_KEY || '';
export const ollamaApiUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434/api/generate';
export const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';
export const maxPromptChars = parseInt(process.env.MAX_PROMPT_CHARS || '12000', 10);
export const frontendOrigin = process.env.FRONTEND_ORIGIN || '*';
export const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
export const resetPasswordTokenExpiresMinutes = parseInt(
  process.env.RESET_PASSWORD_TOKEN_EXPIRES_MINUTES || '30',
  10
);
export const exposeResetTokenResponse =
  String(process.env.EXPOSE_RESET_TOKEN_RESPONSE || 'true').toLowerCase() === 'true';
export const projectsRootDir =
  process.env.PROJECTS_ROOT_DIR ||
  (process.env.NODE_ENV === 'production'
    ? path.join('/tmp', 'devai-projects')
    : path.resolve(process.cwd(), 'projects'));
