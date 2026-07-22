import { NextResponse } from 'next/server';
import { getGemini, parseModelJson, Type } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { secretaryTask, hackathonTask, historicalContext } = await request.json();

  try {
    const ai = getGemini();

    const prompt = `
Analyze two independently initiated institutional actions.

ACTION A
${JSON.stringify(secretaryTask || {}, null, 2)}

ACTION B
${JSON.stringify(hackathonTask || {}, null, 2)}

INSTITUTIONAL CONTEXT
${historicalContext || 'No additional context provided.'}

Known context for this demo:
- Both actions may target the same alumna, Maya Chen.
- Maya Chen spoke at an AI Research Center seminar 8 days ago.
- Alumni Relations is the institutional relationship owner.
- Neither outreach message has been sent.

Determine:

1. Whether both actions refer to the same person.
2. Whether they create meaningful duplicate outreach or relationship-management risk.
3. Why each local action may be individually valid while becoming institutionally incoherent together.
4. Which authority owner should review the situation.
5. The minimum necessary next step.

Rules:

- Do not call this a scheduling conflict unless dates actually overlap.
- Do not send emails.
- Do not merge or cancel either action.
- Do not claim approval has already occurred.
- Do not instruct departments to comply.
- Preserve the autonomy of Career Services and Innovation Lab.
- Recommend that both unsent drafts remain paused while the relationship owner reviews the overlap.
- Return exactly four concise observable audit steps, not private chain-of-thought.

Return strict JSON using exactly this structure:

{
  "logs": [
    "observable processing step",
    "observable processing step",
    "observable processing step",
    "observable processing step"
  ],
  "conflictAnalysis": "Concise explanation of the institutional intersection.",
  "solution1": {
    "title": "Recommended option",
    "description": "A bounded next step requiring the correct authority review."
  },
  "solution2": {
    "title": "Alternative option",
    "description": "A reasonable alternative preserving both departments' autonomy."
  }
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `
You are the BlueQ Institutional Coordination Layer.

Independent departments own their own agents, goals, data, and authority.
You do not command local agents.

Your role is to detect where independently initiated actions intersect,
explain the institutional risk, identify the relevant authority owner,
and propose bounded, reversible next steps.

Do not execute actions or claim authorization.
Return JSON only.
        `,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            logs: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            conflictAnalysis: {
              type: Type.STRING,
            },
            solution1: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ['title', 'description'],
            },
            solution2: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ['title', 'description'],
            },
          },
          required: ['logs', 'conflictAnalysis', 'solution1', 'solution2'],
        },
      },
    });

    const data = parseModelJson(response.text);
    return NextResponse.json({ ...data, mode: 'live' });
  } catch {
    console.log('BlueQ coordination scan skipped or failed, using local fallback.');

    return NextResponse.json({
      logs: [
        '[BlueQ] Matched both action intents to the same alumni identity: Maya Chen.',
        '[BlueQ] Found recent institutional context: Research Center seminar 8 days ago.',
        '[BlueQ] Identified Alumni Relations as the relationship owner.',
        '[BlueQ] Duplicate outreach risk detected; both drafts remain unsent pending review.',
      ],
      conflictAnalysis:
        'Career Services and Innovation Lab are independently preparing outreach to the same alumna shortly after a recent Research Center event. Each local action is reasonable, but separate execution may create duplicated communication, relationship fatigue, and an incoherent institutional experience.',
      solution1: {
        title: 'Request Alumni Relations Review',
        description:
          'Pause both unsent drafts and ask Alumni Relations to determine whether the opportunities should be combined, sequenced, or handled separately.',
      },
      solution2: {
        title: 'Prioritize One Invitation',
        description:
          'Ask Alumni Relations and both departments to select the more time-sensitive opportunity while the other team identifies an alternative speaker.',
      },
      mode: 'fallback',
    });
  }
}
