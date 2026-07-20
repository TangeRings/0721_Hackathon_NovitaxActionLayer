/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

let aiInstance: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
    throw new Error('GEMINI_API_KEY is not set or holds a placeholder value.');
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API 1: Semantic Identity & Conflict Resolution (Maya Chen relationship collision)
  app.post('/api/resolve-identity', async (req, res) => {
    const { target, intents } = req.body;
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

      const data = JSON.parse(response.text || '{}');
      res.json({ ...data, mode: 'live' });
    } catch (error: any) {
      console.log('Gemini API resolution skipped or failed, using local fallback.');
      // Fallback response with exact structural requirements
      res.json({
        isSameIndividual: true,
        explanation: 'Each action is independently valid. Together, they create an incoherent institutional relationship.',
        relationshipOwner: 'Alumni Relations',
        conflictsDetected: [
          'Duplicate speaker invitations for separate events (AI Careers Week vs. Business Innovation Hackathon) scheduled in close proximity.',
          'Bypassing Alumni Relations, who acts as the primary relationship owner for Maya Chen.'
        ],
        historicalContext: 'Maya Chen spoke at an AI Research Center seminar 8 days ago, meaning immediate repeat outreach feels uncoordinated.',
        mode: 'fallback',
        warning: 'Using offline resolver fallback (GEMINI_API_KEY is not configured in secrets).'
      });
    }
  });

  // API 2: Consolidate Outreach (Create coordinated Gmail draft)
  app.post('/api/consolidate-outreach', async (req, res) => {
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

      const data = JSON.parse(response.text || '{}');
      res.json({ ...data, mode: 'live' });
    } catch (error: any) {
      console.log('Gemini API outreach consolidation skipped or failed, using local fallback.');
      res.json({
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
          '09:42:26 - BlueQ Handshake Broker consolidated intents into a single Alumni Relations unified draft.'
        ],
        summary: 'Merged independent invitations into a single coordinated communication channel from Alumni Relations.',
        mode: 'fallback'
      });
    }
  });

  // API: BlueQ Coordination Layer — detect institutional intersections
app.post('/api/gemma-coordination-scan', async (req, res) => {
  const { secretaryTask, hackathonTask, historicalContext } = req.body;

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
          required: [
            'logs',
            'conflictAnalysis',
            'solution1',
            'solution2',
          ],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json({ ...data, mode: 'live' });
  } catch (error: any) {
    console.log('BlueQ coordination scan skipped or failed, using local fallback.');

    res.json({
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
});


// API: Create authorization request for relationship-owner review
app.post('/api/request-authorization', async (req, res) => {
  const {
    selectedOption,
    requestingDepartments,
    initiators,
    relationshipOwner,
    targetPerson,
  } = req.body;

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
          required: [
            'to',
            'cc',
            'subject',
            'body',
            'status',
            'awaitingResponseFrom',
          ],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');

    res.json({
      ...data,
      mode: 'live',
      sentAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.log('Authorization request generation skipped or failed, using local fallback.');

    res.json({
      to: 'Alumni Relations',
      cc: [
        'Sarah Lee — Career Services',
        'Alex Martinez — Innovation Lab',
      ],
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
});


  // API 3: Cross-course resource authorization (ShelfSense access)
  app.post('/api/evaluate-policy', async (req, res) => {
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

      const data = JSON.parse(response.text || '{}');
      res.json({ ...data, mode: 'live' });
    } catch (error: any) {
      console.log('Gemini API policy evaluation skipped or failed, using local fallback.');
      res.json({
        automaticShared: [
          'Project Title (ShelfSense)',
          'Abstract',
          'Topic Tags (Consumer Insights, Retail AI)',
          'Research Methodology Summary',
          'Demo Video'
        ],
        approvalRequired: [
          'Unpublished Prototype Access'
        ],
        privateRestricted: [
          'Raw Interview Transcripts',
          'Source Files',
          'Student Personal Data'
        ],
        policyExplanation: 'Research methodology, abstract, and demo video can be shared automatically under course collaboration guidelines. However, the unpublished prototype requires project-team approval, and raw transcripts or personal details are strictly private under institutional FERPA regulations.',
        scopedAccessGrant: {
          viewOnly: true,
          duration72h: true,
          noDownload: true,
          noRawData: true,
          noContactDisclosure: true,
          authorityApproving: 'Marketing Analytics Project Team (Pending Student Handshake)'
        },
        provenanceTrail: [
          'AI for Business Student Discovery Agent requested research assets.',
          'BlueQ Policy Resolver evaluated Marketing Analytics policy schema.',
          'Determined mixed sharing permission tier (Auto, Handshake, Private).',
          'Broker generated a granular 72-hour view-only handshake card.'
        ],
        mode: 'fallback'
      });
    }
  });

  // API 4: Course Recognition and Meaning Translation
  app.post('/api/translate-meaning', async (req, res) => {
    const { lectureTitle } = req.body;
    try {
      const ai = getGemini();
      const prompt = `
You are the Policy and Authority Resolver for BlueQ.
The "AI Research Center" has published an approved public lecture on "${lectureTitle || 'AI Governance & Ethics'}".
Our Course Agents observe this event and translate its institutional meaning into course policy. Remember, BlueQ does NOT assign grades or create course policy. It only sends a verified institutional participation record to teacher-controlled course domains.

Please generate a JSON structure translating this event for each of the following courses:
- AI for Business
- Product Management
- Marketing Analytics

Return a strict JSON response with these keys:
- event: string
- translation: array of objects containing:
  - course: string
  - agentName: string
  - rule: string
  - outcome: string
  - reason: string
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              event: { type: Type.STRING },
              translation: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    course: { type: Type.STRING },
                    agentName: { type: Type.STRING },
                    rule: { type: Type.STRING },
                    outcome: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                  required: ['course', 'agentName', 'rule', 'outcome', 'reason'],
                },
              },
            },
            required: ['event', 'translation'],
          },
        },
      });

      const data = JSON.parse(response.text || '{}');
      res.json({ ...data, mode: 'live' });
    } catch (error: any) {
      console.log('Gemini API meaning translation skipped or failed, using local fallback.');
      res.json({
        event: lectureTitle || 'AI Governance & Ethics Lecture',
        translation: [
          {
            course: 'AI for Business',
            agentName: 'AI for Business Course Agent',
            rule: 'Attendance plus reflection may receive points.',
            outcome: '2 participation points',
            reason: 'Directly maps to AI business ethics syllabus module.'
          },
          {
            course: 'Product Management',
            agentName: 'Product Management Course Agent',
            rule: 'Attendance counts as external learning activity.',
            outcome: '1 external learning activity (no direct points)',
            reason: 'Categorized under optional professional enrichment activity.'
          },
          {
            course: 'Marketing Analytics',
            agentName: 'Marketing Analytics Course Agent',
            rule: 'No matching rule.',
            outcome: 'No action',
            reason: 'Lecture topic is outside current analytics curriculum constraints.'
          }
        ],
        mode: 'fallback'
      });
    }
  });


  // Vite middleware or production static files serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for all other paths to support SPA client-side routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
