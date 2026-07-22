import { NextResponse } from 'next/server';
import { createBrowseTask, pollTaskUntilDone } from '@/lib/actionlayer';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { eventUrl } = await request.json();

  if (typeof eventUrl !== 'string' || !eventUrl.trim()) {
    return NextResponse.json({ error: 'eventUrl is required.' }, { status: 400 });
  }

  try {
    const task = await createBrowseTask({
      url: eventUrl,
      goal:
        'Open this Luma event page and report only the name of the first host listed. ' +
        'Do not contact anyone, send any message, or take any action other than reading the page.',
    });

    const finished = await pollTaskUntilDone(task.id);

    if (finished.status === 'failed') {
      throw new Error('ActionLayer task failed.');
    }

    const result = finished.result as { hostName?: string } | string | undefined;
    const hostName =
      typeof result === 'string'
        ? result
        : result?.hostName || 'Unable to parse host name from ActionLayer result.';

    return NextResponse.json({
      hostName,
      taskId: finished.id,
      status: finished.status,
      mode: 'live',
      provenanceTrail: [
        `[ActionLayer] Task ${finished.id} created to browse ${eventUrl}.`,
        '[ActionLayer] Browsed the event page (read-only, no contact made).',
        `[ActionLayer] Reported first host listed: ${hostName}.`,
      ],
    });
  } catch (err) {
    console.log('ActionLayer host lookup skipped or failed, using local fallback.', err);
    return NextResponse.json({
      hostName: 'Host Name Unavailable',
      taskId: null,
      status: 'fallback',
      mode: 'fallback',
      warning: 'Using offline fallback (ACTIONLAYER_API_KEY is not configured, or the ActionLayer task failed).',
      provenanceTrail: [
        `[ActionLayer] Attempted to browse ${eventUrl}.`,
        '[ActionLayer] Live lookup unavailable; returning fallback placeholder.',
      ],
    });
  }
}
