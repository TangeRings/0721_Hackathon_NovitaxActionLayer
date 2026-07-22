import { NextResponse } from 'next/server';
import { getGemini, parseModelJson, Type } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { target, intents } = await request.json();

  try {
    const ai = getGemini();
    const prompt = `
You are the Identity and Relationship Resolver for BlueQ.
We have multiple autonomous agents emitting independent ActionIntents targeting: "${target}".
Here are the current ActionIntents:
${JSON.stringify(intents, null, 2)}

Please perform:
1. Semantic Identity Resolution: Confirm if these intents target the exact same person.
2. Semantic Conflict Detection: Explain how these independent outreach intents conflict or intersect from an institutional perspective (e.g. Maya Chen spoke on campus 8 days ago at AI Research Center's seminar, Career Services has a new proposed Careers Week outreach, Innovation Lab has a pending keynote outreach, and Alumni Relations is the official relationship owner).
3. Identify the logical relationship owner (Alumni Relations) and formulate a clear explanation: "Each action is independently valid. Together, they create an incoherent institutional relationship."

Return a strict JSON response with these keys:
- isSameIndividual: boolean
- explanation: string (keep it to 2-3 clear, impactful sentences)
- relationshipOwner: string (Alumni Relations)
- conflictsDetected: string[]
- historicalContext: string (e.g., spoke 8 days ago at AI Research Center)
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSameIndividual: { type: Type.BOOLEAN },
            explanation: { type: Type.STRING },
            relationshipOwner: { type: Type.STRING },
            conflictsDetected: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            historicalContext: { type: Type.STRING },
          },
          required: [
            'isSameIndividual',
            'explanation',
            'relationshipOwner',
            'conflictsDetected',
            'historicalContext',
          ],
        },
      },
    });

    const data = parseModelJson(response.text);
    return NextResponse.json({ ...data, mode: 'live' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Gemini API error (resolve-identity):', message);
    return NextResponse.json(
      { error: true, message: `AI connection error: ${message}` },
      { status: 503 }
    );
  }
}
