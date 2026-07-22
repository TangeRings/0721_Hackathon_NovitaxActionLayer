/**
 * ActionLayer REST client.
 *
 * ActionLayer (https://actionlayer.io) is normally wired up as an MCP server for an
 * agent host (Claude Code, Cursor, etc). This app is itself a server, so instead of
 * spawning the `actionlayer` MCP process we call ActionLayer's hosted REST API directly.
 *
 * Endpoints confirmed live against the deployed OpenAPI spec at
 * https://api.actionlayer.io/openapi.json:
 *   POST /tasks               -> create a ticket (task), returns 202 + TicketResponse
 *   GET  /tasks/{ticket_id}   -> poll a ticket, returns TicketResponse (+ event transcript)
 *
 * Ticket lifecycle states: pending | blocked_on_user | completed | failed | cancelled.
 * Browser-driven tasks are picked up by a live operator queue and can take a couple of
 * minutes end to end, so callers should poll with a generous timeout.
 */

const DEFAULT_API_URL = 'https://api.actionlayer.io';

export type ActionLayerTicketState = 'pending' | 'blocked_on_user' | 'completed' | 'failed' | 'cancelled';

export interface ActionLayerEvent {
  id: string;
  type: string;
  from_state: string | null;
  to_state: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface ActionLayerTicket {
  id: string;
  state: ActionLayerTicketState;
  goal: string;
  flow: string | null;
  max_budget_usd: number | null;
  webhook_url: string | null;
  result: Record<string, unknown> | null;
  error: string | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  info_request: Record<string, unknown> | null;
  events?: ActionLayerEvent[];
}

function getConfig(): { apiKey: string; apiUrl: string } {
  const apiKey = process.env.ACTIONLAYER_API_KEY;
  const apiUrl = process.env.ACTIONLAYER_API_URL || DEFAULT_API_URL;

  if (!apiKey || apiKey === 'YOUR_ACTIONLAYER_API_KEY' || apiKey.trim() === '') {
    throw new Error('ACTIONLAYER_API_KEY is not set or holds a placeholder value.');
  }

  return { apiKey, apiUrl };
}

/**
 * Creates a browser-action task asking ActionLayer to visit a URL and accomplish a
 * narrow, read-only goal (e.g. "report the first host name listed"). Does not send
 * any message or perform any write action.
 */
export async function createBrowseTask(input: { url: string; goal: string }): Promise<ActionLayerTicket> {
  const { apiKey, apiUrl } = getConfig();

  const response = await fetch(`${apiUrl}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      goal: input.goal,
      target_url: input.url,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`ActionLayer createBrowseTask failed with status ${response.status}${body ? `: ${body}` : ''}`);
  }

  return (await response.json()) as ActionLayerTicket;
}

export async function getTask(ticketId: string): Promise<ActionLayerTicket> {
  const { apiKey, apiUrl } = getConfig();

  const response = await fetch(`${apiUrl}/tasks/${ticketId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`ActionLayer getTask failed with status ${response.status}${body ? `: ${body}` : ''}`);
  }

  return (await response.json()) as ActionLayerTicket;
}

/**
 * Polls a ticket until it reaches a terminal state (`completed`/`failed`/`cancelled`)
 * or `blocked_on_user`, or the timeout elapses. Browser-driven tasks go through a live
 * operator queue and can take a couple of minutes, so this defaults to a generous
 * timeout with a modest poll interval.
 */
export async function pollTaskUntilDone(
  ticketId: string,
  options: { timeoutMs?: number; intervalMs?: number } = {}
): Promise<ActionLayerTicket> {
  const timeoutMs = options.timeoutMs ?? 300000;
  const intervalMs = options.intervalMs ?? 4000;
  const startedAt = Date.now();

  let ticket = await getTask(ticketId);

  while (ticket.state === 'pending') {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`ActionLayer task ${ticketId} did not complete within ${timeoutMs}ms (last state: ${ticket.state})`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    ticket = await getTask(ticketId);
  }

  return ticket;
}
