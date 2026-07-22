import { NextResponse } from 'next/server';
import { generateJson } from '@/lib/novita';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { lectureTitle } = await request.json();
  try {
    const prompt = `
You are the Policy and Authority Resolver for BlueQ.
The "AI Research Center" has published an approved public lecture on "${lectureTitle || 'AI Governance & Ethics'}".
Our Course Agents observe this event and translate its institutional meaning into course policy. Remember, BlueQ does NOT assign grades or create course policy. It only sends a verified institutional participation record to teacher-controlled course domains.

Please generate a JSON structure translating this event for each of the following courses:
- AI for Business
- Product Management
- Marketing Analytics

Return a strict JSON response with these keys:
- event: string
- translation: array of objects containing:
  - course: string
  - agentName: string
  - rule: string
  - outcome: string
  - reason: string
`;

    const data = await generateJson({
      prompt,
      schemaName: 'meaning_translation',
      schema: {
        type: 'object',
        properties: {
          event: { type: 'string' },
          translation: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                course: { type: 'string' },
                agentName: { type: 'string' },
                rule: { type: 'string' },
                outcome: { type: 'string' },
                reason: { type: 'string' },
              },
              required: ['course', 'agentName', 'rule', 'outcome', 'reason'],
            },
          },
        },
        required: ['event', 'translation'],
      },
    });

    return NextResponse.json({ ...data, mode: 'live' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Novita API error (translate-meaning):', message);
    return NextResponse.json(
      { error: true, message: `AI connection error: ${message}` },
      { status: 503 }
    );
  }
}
