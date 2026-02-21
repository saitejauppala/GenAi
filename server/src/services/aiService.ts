import OpenAI from 'openai';
import { openAiKey } from '../config';

let client: OpenAI | null = null;

type AIResponse = {
  content: string;
  tokensUsed: number;
  model: string;
};

function getClient(): OpenAI {
  if (!openAiKey) {
    throw new Error('OPENAI_API_KEY is not configured on the server');
  }
  if (!client) {
    client = new OpenAI({ apiKey: openAiKey });
  }
  return client;
}

async function callOpenAI(prompt: string, model = 'gpt-4o-mini', max_tokens = 2000): Promise<AIResponse> {
  const aiClient = getClient();
  const resp: any = await aiClient.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens
  });
  const content = resp?.choices?.[0]?.message?.content || (resp?.choices?.[0]?.text ?? '');
  const tokensUsed = resp?.usage?.total_tokens || 0;
  return { content, tokensUsed, model };
}

export async function generateApp(prompt: string) {
  return callOpenAI(prompt, 'gpt-4o-mini', 2000);
}

export async function codeAssist(prompt: string) {
  return callOpenAI(prompt, 'gpt-4o-mini', 800);
}
