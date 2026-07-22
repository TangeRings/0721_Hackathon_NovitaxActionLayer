import { NextResponse } from 'next/server';
import { generateJson } from '@/lib/novita';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { target, intents } = await request.json();

  try {
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

    const data = await generateJson({
      prompt,
      schemaName: 'identity_resolution',
      schema: {
        type: 'object',
        properties: {
          isSameIndividual: { type: 'boolean' },
          explanation: { type: 'string' },
          relationshipOwner: { type: 'string' },
          conflictsDetected: {
            type: 'array',
            items: { type: 'string' },
          },
          historicalContext: { type: 'string' },
        },
        required: [
          'isSameIndividual',
          'explanation',
          'relationshipOwner',
          'conflictsDetected',
          'historicalContext',
        ],
      },
    });

    return NextResponse.json({ ...data, mode: 'live' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Novita API error (resolve-identity):', message);
    return NextResponse.json(
      { error: true, message: `AI connection error: ${message}` },
      { status: 503 }
    );
  }
}
