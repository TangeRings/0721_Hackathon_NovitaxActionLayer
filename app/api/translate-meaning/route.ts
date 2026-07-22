import { NextResponse } from 'next/server';
import { getGemini, parseModelJson, Type } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { lectureTitle } = await request.json();
  try {
    const ai = getGemini();
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            event: { type: Type.STRING },
            translation: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  course: { type: Type.STRING },
                  agentName: { type: Type.STRING },
                  rule: { type: Type.STRING },
                  outcome: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ['course', 'agentName', 'rule', 'outcome', 'reason'],
              },
            },
          },
          required: ['event', 'translation'],
        },
      },
    });

    const data = parseModelJson(response.text);
    return NextResponse.json({ ...data, mode: 'live' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Gemini API error (translate-meaning):', message);
    return NextResponse.json(
      { error: true, message: `AI connection error: ${message}` },
      { status: 503 }
    );
  }
}
