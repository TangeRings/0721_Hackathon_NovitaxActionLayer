import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const LUMA_EVENT_GET_URL = 'https://api.lu.ma/event/get';

/**
 * Extracts the event slug/api_id from a lu.ma event URL, e.g.
 * "https://lu.ma/my-event-slug" -> "my-event-slug".
 */
function extractSlug(eventUrl: string): string | null {
  try {
    const url = new URL(eventUrl);
    const segments = url.pathname.split('/').filter(Boolean);
    return segments[0] || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const { eventUrl } = await request.json();

  const slug = typeof eventUrl === 'string' ? extractSlug(eventUrl) : null;
  if (!slug) {
    return NextResponse.json({ error: 'A valid lu.ma event URL is required.' }, { status: 400 });
  }

  try {
    // Public discovery endpoint, no API key required.
    const response = await fetch(
      `${LUMA_EVENT_GET_URL}?event_api_id=${encodeURIComponent(slug)}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`Luma public API returned status ${response.status}`);
    }

    const data = await response.json();
    const event = data.event || {};

    return NextResponse.json({
      name: event.name || null,
      description: event.description || null,
      startAt: event.start_at || null,
      endAt: event.end_at || null,
      url: eventUrl,
      coverUrl: event.cover_url || null,
      mode: 'live',
    });
  } catch (err) {
    console.log('Luma public event lookup failed, using local fallback.', err);
    return NextResponse.json({
      name: null,
      description: 'Event context unavailable (public Luma lookup failed or event is private).',
      startAt: null,
      endAt: null,
      url: eventUrl,
      coverUrl: null,
      mode: 'fallback',
    });
  }
}
