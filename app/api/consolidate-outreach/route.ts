import { NextResponse } from 'next/server';
import { getGemini, parseModelJson, Type } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const ai = getGemini();
    const prompt = `
You are the Semantic Conflict Detector & Handshake Broker for BlueQ.
We are consolidating separate outreach intents to "Maya Chen" (Director of AI Partnerships at Google) under "Alumni Relations" in coordination with "Career Services" and "Innovation Lab".

Create a single consolidated, highly professional Gmail draft that:
1. Originates from "Alumni Relations".
2. Mentions collaborators "Career Services" and "Innovation Lab".
3. Elegantly presents BOTH participation opportunities in one message (Careers Week invitation + Business Innovation Hackathon keynote).
4. Maintains complete decision provenance in a dedicated meta-section or trail list.

Return a JSON structure:
- sender: "Alumni Relations"
- recipient: "Maya Chen (Director of AI Partnerships at Google)"
- collaborators: string[] (Career Services, Innovation Lab)
- subject: string
- body: string (the full HTML/text of the email draft, spaced professionally with salutations)
- provenanceTrail: string[] (step-by-step audit trail of how this decision was brokered)
- summary: string
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sender: { type: Type.STRING },
            recipient: { type: Type.STRING },
            collaborators: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
            provenanceTrail: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            summary: { type: Type.STRING },
          },
          required: ['sender', 'recipient', 'collaborators', 'subject', 'body', 'provenanceTrail', 'summary'],
        },
      },
    });

    const data = parseModelJson(response.text);
    return NextResponse.json({ ...data, mode: 'live' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Gemini API error (consolidate-outreach):', message);
    return NextResponse.json(
      { error: true, message: `AI connection error: ${message}` },
      { status: 503 }
    );
  }
}
