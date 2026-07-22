import OpenAI from 'openai';

const NOVITA_BASE_URL = 'https://api.novita.ai/openai/v1';

let clientInstance: OpenAI | null = null;

export function getNovita(): OpenAI {
  const key = process.env.NOVITA_API_KEY;
  if (!key || key.trim() === '') {
    throw new Error('NOVITA_API_KEY is not set.');
  }

  if (!clientInstance) {
    clientInstance = new OpenAI({
      apiKey: key,
      baseURL: NOVITA_BASE_URL,
    });
  }

  return clientInstance;
}

export function getNovitaModel(): string {
  const model = process.env.NOVITA_MODEL;
  if (!model || model.trim() === '') {
    throw new Error('NOVITA_MODEL is not set.');
  }
  return model;
}

export function parseModelJson(text: string | null | undefined): Record<string, unknown> {
  return JSON.parse(text || '{}') as Record<string, unknown>;
}

/**
 * Wraps a chat completion call with JSON output via Novita's OpenAI-compatible
 * response_format. Many Novita-hosted models (e.g. deepseek-v4-flash) only
 * support `json_object` mode rather than a strict `json_schema`, so the
 * desired shape must be described in the prompt text itself; the `schema`
 * param here is only used to document/validate shape expectations for the
 * prompt writer, not sent to the API.
 *
 * These are also reasoning models: they spend part of `max_tokens` on
 * `reasoning_content` before emitting the final `content`. We keep reasoning
 * effort low and give a generous token budget so the JSON body isn't cut off.
 */
export async function generateJson(params: {
  systemInstruction?: string;
  prompt: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const ai = getNovita();
  const model = getNovitaModel();

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  const systemContent = [
    params.systemInstruction?.trim(),
    'Return strict JSON only. No markdown, no code fences, no commentary outside the JSON object.',
  ]
    .filter(Boolean)
    .join('\n\n');
  if (systemContent) {
    messages.push({ role: 'system', content: systemContent });
  }
  messages.push({ role: 'user', content: params.prompt });

  const response = await ai.chat.completions.create({
    model,
    messages,
    max_tokens: 2048,
    response_format: { type: 'json_object' },
    // @ts-expect-error -- Novita-specific extension, not part of the OpenAI SDK types.
    reasoning: { effort: 'low' },
  });

  return parseModelJson(response.choices[0]?.message?.content);
}
