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
  } catch {
    console.log('Gemini API meaning translation skipped or failed, using local fallback.');
    return NextResponse.json({
      event: lectureTitle || 'AI Governance & Ethics Lecture',
      translation: [
        {
          course: 'AI for Business',
          agentName: 'AI for Business Course Agent',
          rule: 'Attendance plus reflection may receive points.',
          outcome: '2 participation points',
          reason: 'Directly maps to AI business ethics syllabus module.',
        },
        {
          course: 'Product Management',
          agentName: 'Product Management Course Agent',
          rule: 'Attendance counts as external learning activity.',
          outcome: '1 external learning activity (no direct points)',
          reason: 'Categorized under optional professional enrichment activity.',
        },
        {
          course: 'Marketing Analytics',
          agentName: 'Marketing Analytics Course Agent',
          rule: 'No matching rule.',
          outcome: 'No action',
          reason: 'Lecture topic is outside current analytics curriculum constraints.',
        },
      ],
      mode: 'fallback',
    });
  }
}
