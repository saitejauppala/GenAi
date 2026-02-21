export const jwtSecret = process.env.JWT_SECRET || 'devai-secret-change-in-prod';
export const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'saitejauppala07@gmail.com';
export const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMePlease!123';
export const stripeSecret = process.env.STRIPE_SECRET || '';
export const openAiKey = process.env.OPENAI_API_KEY || '';
export const ollamaApiUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434/api/generate';
export const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';
export const maxPromptChars = parseInt(process.env.MAX_PROMPT_CHARS || '12000', 10);
