import { NextResponse } from 'next/server';
import { generateJson } from '@/lib/novita';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { targetName } = await request.json().catch(() => ({ targetName: undefined }));
  const recipient = targetName || 'Guest';

  try {
    const prompt = `
You are the Semantic Conflict Detector & Handshake Broker for BlueQ.
We are consolidating separate outreach intents to "${recipient}" under "Alumni Relations" in coordination with "Career Services" and "Innovation Lab".
${recipient === 'Guest' ? 'The exact identity of the invitee has not been resolved yet, so address the draft generically as a valued guest/host rather than inventing a name or title.' : ''}

Create a single consolidated, highly professional Gmail draft that:
1. Originates from "Alumni Relations".
2. Mentions collaborators "Career Services" and "Innovation Lab".
3. Elegantly presents BOTH participation opportunities in one message (Careers Week invitation + Business Innovation Hackathon keynote).
4. Maintains complete decision provenance in a dedicated meta-section or trail list.

Return a JSON structure:
- sender: "Alumni Relations"
- recipient: "${recipient}"
- collaborators: string[] (Career Services, Innovation Lab)
- subject: string
- body: string (the full HTML/text of the email draft, spaced professionally with salutations)
- provenanceTrail: string[] (step-by-step audit trail of how this decision was brokered)
- summary: string
`;

    const data = await generateJson({
      prompt,
      schemaName: 'consolidated_outreach',
      schema: {
        type: 'object',
        properties: {
          sender: { type: 'string' },
          recipient: { type: 'string' },
          collaborators: {
            type: 'array',
            items: { type: 'string' },
          },
          subject: { type: 'string' },
          body: { type: 'string' },
          provenanceTrail: {
            type: 'array',
            items: { type: 'string' },
          },
          summary: { type: 'string' },
        },
        required: ['sender', 'recipient', 'collaborators', 'subject', 'body', 'provenanceTrail', 'summary'],
      },
    });

    return NextResponse.json({ ...data, mode: 'live' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Novita API error (consolidate-outreach):', message);
    return NextResponse.json(
      { error: true, message: `AI connection error: ${message}` },
      { status: 503 }
    );
  }
}
