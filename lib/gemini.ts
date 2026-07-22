import { GoogleGenAI, Type } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export { Type };

export function getGemini(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
    throw new Error('GEMINI_API_KEY is not set or holds a placeholder value.');
  }

  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return aiInstance;
}

export function parseModelJson(text: string | undefined): Record<string, unknown> {
  return JSON.parse(text || '{}') as Record<string, unknown>;
}
