import { NextResponse } from 'next/server';
import { getGemini, parseModelJson, Type } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const ai = getGemini();
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            automaticShared: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            approvalRequired: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            privateRestricted: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            policyExplanation: { type: Type.STRING },
            scopedAccessGrant: {
              type: Type.OBJECT,
              properties: {
                viewOnly: { type: Type.BOOLEAN },
                duration72h: { type: Type.BOOLEAN },
                noDownload: { type: Type.BOOLEAN },
                noRawData: { type: Type.BOOLEAN },
                noContactDisclosure: { type: Type.BOOLEAN },
                authorityApproving: { type: Type.STRING },
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
              type: Type.ARRAY,
              items: { type: Type.STRING },
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
      },
    });

    const data = parseModelJson(response.text);
    return NextResponse.json({ ...data, mode: 'live' });
  } catch {
    console.log('Gemini API policy evaluation skipped or failed, using local fallback.');
    return NextResponse.json({
      automaticShared: [
        'Project Title (ShelfSense)',
        'Abstract',
        'Topic Tags (Consumer Insights, Retail AI)',
        'Research Methodology Summary',
        'Demo Video',
      ],
      approvalRequired: ['Unpublished Prototype Access'],
      privateRestricted: ['Raw Interview Transcripts', 'Source Files', 'Student Personal Data'],
      policyExplanation:
        'Research methodology, abstract, and demo video can be shared automatically under course collaboration guidelines. However, the unpublished prototype requires project-team approval, and raw transcripts or personal details are strictly private under institutional FERPA regulations.',
      scopedAccessGrant: {
        viewOnly: true,
        duration72h: true,
        noDownload: true,
        noRawData: true,
        noContactDisclosure: true,
        authorityApproving: 'Marketing Analytics Project Team (Pending Student Handshake)',
      },
      provenanceTrail: [
        'AI for Business Student Discovery Agent requested research assets.',
        'BlueQ Policy Resolver evaluated Marketing Analytics policy schema.',
        'Determined mixed sharing permission tier (Auto, Handshake, Private).',
        'Broker generated a granular 72-hour view-only handshake card.',
      ],
      mode: 'fallback',
    });
  }
}
