import { NextResponse } from 'next/server';
import { generateJson } from '@/lib/novita';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { selectedOption, requestingDepartments, initiators, relationshipOwner, targetPerson } =
    await request.json();

  try {
    const prompt = `
You are the BlueQ Authorization Request Composer.

Two autonomous university departments are preparing separate outreach
to the same external person.

Target person:
${targetPerson || 'Maya Chen'}

Requesting departments:
${JSON.stringify(requestingDepartments || [], null, 2)}

Initiators:
${JSON.stringify(initiators || [], null, 2)}

Relationship owner:
${relationshipOwner || 'Alumni Relations'}

Selected recommendation:
${selectedOption || 'Request relationship-owner review'}

Create a concise internal authorization-request email.

The email must:

- be addressed to the relationship owner
- explain that two independent outreach drafts target the same person
- mention that neither draft has been sent
- ask the relationship owner to choose whether to combine, sequence,
  or separately approve the outreach
- preserve both departments' autonomy
- not claim that coordination has already been approved
- not contact Maya Chen
- not create the final external invitation

Return strict JSON:

{
  "to": "recipient role or department",
  "cc": ["relevant initiators"],
  "subject": "internal authorization request subject",
  "body": "concise internal email body",
  "status": "sent",
  "awaitingResponseFrom": "authority owner"
}
`;

    const data = await generateJson({
      systemInstruction: `
You compose internal authorization requests for BlueQ.

You do not approve decisions.
You do not contact external speakers.
You only create a clear request for the appropriate institutional
authority to review overlapping actions.
Return JSON only.
      `,
      prompt,
      schemaName: 'authorization_request',
      schema: {
        type: 'object',
        properties: {
          to: { type: 'string' },
          cc: {
            type: 'array',
            items: { type: 'string' },
          },
          subject: { type: 'string' },
          body: { type: 'string' },
          status: { type: 'string' },
          awaitingResponseFrom: { type: 'string' },
        },
        required: ['to', 'cc', 'subject', 'body', 'status', 'awaitingResponseFrom'],
      },
    });

    return NextResponse.json({
      ...data,
      mode: 'live',
      sentAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Novita API error (request-authorization):', message);
    return NextResponse.json(
      { error: true, message: `AI connection error: ${message}` },
      { status: 503 }
    );
  }
}
