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
  } catch {
    console.log('Gemini API outreach consolidation skipped or failed, using local fallback.');
    return NextResponse.json({
      sender: 'Alumni Relations',
      recipient: 'Maya Chen (Director of AI Partnerships at Google)',
      collaborators: ['Career Services', 'Innovation Lab'],
      subject: 'Coordinated Campus Invitation: AI Careers Week & Business Innovation Hackathon',
      body: `Dear Maya,\n\nI hope this email finds you well. I am writing to you on behalf of Alumni Relations at our institution. We were absolutely thrilled by your seminar presentation on campus eight days ago.\n\nTwo of our premier student-facing organizations—Career Services and the Campus Innovation Lab—have independently identified you as an ideal partner for their upcoming flagship events. To respect your time and provide a unified channel, we have coordinated our outreach.\n\nWe would love to invite you to engage in two exciting capacities:\n1. AI Careers Week (hosted by Career Services): An invitation to participate in our AI Leadership Panel.\n2. Business Innovation Hackathon (hosted by Innovation Lab): An invitation to deliver the opening keynote speech.\n\nWe would be honored to host you for either or both of these opportunities. Please let us know if you would be open to a brief conversation with us to discuss how we can align these with your availability.\n\nWarm regards,\n\nAlumni Relations Coordinator\nIn collaboration with Career Services and the Innovation Lab`,
      provenanceTrail: [
        '09:42:15 - Career Services Agent emitted ActionIntent to invite Maya Chen to Careers Week.',
        '09:42:18 - Innovation Lab Agent emitted ActionIntent to invite Maya Chen to Keynote Hackathon.',
        '09:42:20 - BlueQ Semantic Conflict Detector intercepted overlapping outreach for Maya Chen.',
        '09:42:22 - BlueQ Identity Resolver confirmed same-individual status and identified Alumni Relations as owner.',
        '09:42:25 - User selected "Consolidate Outreach" resolution.',
        '09:42:26 - BlueQ Handshake Broker consolidated intents into a single Alumni Relations unified draft.',
      ],
      summary:
        'Merged independent invitations into a single coordinated communication channel from Alumni Relations.',
      mode: 'fallback',
    });
  }
}
