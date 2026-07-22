import { NextResponse } from 'next/server';
import { generateJson } from '@/lib/novita';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const prompt = `
You are the Policy and Authority Resolver for BlueQ.
An access handshake is being requested:
Requester: "AI for Business Student Discovery Agent"
Resource Owner: "Marketing Analytics Project Agent"
Resource: "ShelfSense" (Marketing Analytics student project)
Declared Purpose: "Course research and inspiration"
Requested Scope: "Prototype demo and research methodology"

Evaluate this request according to institutional policy rules:
1. Research methodology can be shared automatically.
2. Prototype requires project-team approval.
3. Raw interviews and student personal data are strictly private and cannot be shared.

Generate a JSON structure explaining this policy decision, defining the automatic versus restricted scopes, and crafting an explanation:
`;

    const data = await generateJson({
      prompt,
      schemaName: 'policy_evaluation',
      schema: {
        type: 'object',
        properties: {
          automaticShared: {
            type: 'array',
            items: { type: 'string' },
          },
          approvalRequired: {
            type: 'array',
            items: { type: 'string' },
          },
          privateRestricted: {
            type: 'array',
            items: { type: 'string' },
          },
          policyExplanation: { type: 'string' },
          scopedAccessGrant: {
            type: 'object',
            properties: {
              viewOnly: { type: 'boolean' },
              duration72h: { type: 'boolean' },
              noDownload: { type: 'boolean' },
              noRawData: { type: 'boolean' },
              noContactDisclosure: { type: 'boolean' },
              authorityApproving: { type: 'string' },
            },
            required: [
              'viewOnly',
              'duration72h',
              'noDownload',
              'noRawData',
              'noContactDisclosure',
              'authorityApproving',
            ],
          },
          provenanceTrail: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: [
          'automaticShared',
          'approvalRequired',
          'privateRestricted',
          'policyExplanation',
          'scopedAccessGrant',
          'provenanceTrail',
        ],
      },
    });

    return NextResponse.json({ ...data, mode: 'live' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Novita API error (evaluate-policy):', message);
    return NextResponse.json(
      { error: true, message: `AI connection error: ${message}` },
      { status: 503 }
    );
  }
}
