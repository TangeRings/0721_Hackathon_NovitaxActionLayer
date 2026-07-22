import { NextResponse } from 'next/server';
import { getGemini, parseModelJson, Type } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { selectedOption, requestingDepartments, initiators, relationshipOwner, targetPerson } =
    await request.json();

  try {
    const ai = getGemini();
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `
You compose internal authorization requests for BlueQ.

You do not approve decisions.
You do not contact external speakers.
You only create a clear request for the appropriate institutional
authority to review overlapping actions.
Return JSON only.
        `,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            to: { type: Type.STRING },
            cc: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
            status: { type: Type.STRING },
            awaitingResponseFrom: { type: Type.STRING },
          },
          required: ['to', 'cc', 'subject', 'body', 'status', 'awaitingResponseFrom'],
        },
      },
    });

    const data = parseModelJson(response.text);

    return NextResponse.json({
      ...data,
      mode: 'live',
      sentAt: new Date().toISOString(),
    });
  } catch {
    console.log('Authorization request generation skipped or failed, using local fallback.');

    return NextResponse.json({
      to: 'Alumni Relations',
      cc: ['Sarah Lee — Career Services', 'Alex Martinez — Innovation Lab'],
      subject: 'Review requested: overlapping outreach to Maya Chen',
      body: `Career Services and Innovation Lab are independently preparing outreach to Maya Chen for two upcoming programs.

Neither draft has been sent.

Because Alumni Relations is the institutional relationship owner, please review the overlap and determine whether the invitations should be combined, sequenced, or approved separately.

Both departments will keep their current drafts paused until your response.`,
      status: 'sent',
      awaitingResponseFrom: 'Alumni Relations',
      mode: 'fallback',
      sentAt: new Date().toISOString(),
    });
  }
}
