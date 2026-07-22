import { NextResponse } from 'next/server';
import { createBrowseTask, pollTaskUntilDone } from '@/lib/actionlayer';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { eventUrl } = await request.json();

  if (typeof eventUrl !== 'string' || !eventUrl.trim()) {
    return NextResponse.json({ error: true, message: 'eventUrl is required.' }, { status: 400 });
  }

  try {
    const ticket = await createBrowseTask({
      url: eventUrl,
      goal:
        'Open this Luma event page and report only the full name of the first host listed on the page. ' +
        'Do not contact anyone, send any message, register, or take any action other than reading the page.',
    });

    const finished = await pollTaskUntilDone(ticket.id);

    if (finished.state === 'failed') {
      throw new Error(finished.reason || finished.error || 'ActionLayer task failed.');
    }
    if (finished.state === 'cancelled') {
      throw new Error('ActionLayer task was cancelled before completion.');
    }
    if (finished.state === 'blocked_on_user') {
      throw new Error('ActionLayer task is blocked waiting on manual input and cannot complete automatically.');
    }

    const result = finished.result as { hostName?: string; host_name?: string } | null;
    const hostName = finished.reason || result?.hostName || result?.host_name || null;

    if (!hostName) {
      throw new Error('ActionLayer completed the task but did not report a host name.');
    }

    return NextResponse.json({
      hostName,
      taskId: finished.id,
      status: finished.state,
      mode: 'live',
      provenanceTrail: [
        `[ActionLayer] Ticket ${finished.id} created to browse ${eventUrl}.`,
        '[ActionLayer] Browsed the event page (read-only, no contact made).',
        `[ActionLayer] Reported first host listed: ${hostName}.`,
      ],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('ActionLayer host lookup failed:', message);
    return NextResponse.json(
      { error: true, message: `ActionLayer connection error: ${message}` },
      { status: 503 }
    );
  }
}
