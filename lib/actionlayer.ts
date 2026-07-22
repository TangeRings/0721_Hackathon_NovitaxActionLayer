/**
 * ActionLayer REST client.
 *
 * ActionLayer (https://actionlayer.io) is normally wired up as an MCP server for an
 * agent host (Claude Code, Cursor, etc). This app is itself a server, so instead of
 * spawning the `actionlayer` MCP process we call ActionLayer's hosted REST API directly.
 *
 * IMPORTANT: The endpoint paths and field names below are PLACEHOLDERS inferred from
 * ActionLayer's public docs (task-based flow: create a task with a goal, poll
 * `get_task`/`next_action` until it completes, `reply` if it asks a question). Once you
 * share your real API key and endpoint spec, only this file should need updates —
 * every caller in `app/api/actionlayer/*` goes through the functions exported here.
 */

const DEFAULT_API_URL = 'https://api.actionlayer.io';

export interface ActionLayerTask {
  id: string;
  status: 'pending' | 'running' | 'needs_input' | 'completed' | 'failed' | string;
  goal: string;
  result?: unknown;
  infoRequest?: unknown;
  [key: string]: unknown;
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
 *
 * PLACEHOLDER endpoint: `POST {apiUrl}/v1/tasks`
 */
export async function createBrowseTask(input: { url: string; goal: string }): Promise<ActionLayerTask> {
  const { apiKey, apiUrl } = getConfig();

  const response = await fetch(`${apiUrl}/v1/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      goal: input.goal,
      context: {
        url: input.url,
      },
      // Explicit guardrails: this task must only read/observe the page.
      constraints: ['read_only', 'no_contact', 'no_payment'],
    }),
  });

  if (!response.ok) {
    throw new Error(`ActionLayer createBrowseTask failed with status ${response.status}`);
  }

  return (await response.json()) as ActionLayerTask;
}

/**
 * PLACEHOLDER endpoint: `GET {apiUrl}/v1/tasks/{taskId}`
 */
export async function getTask(taskId: string): Promise<ActionLayerTask> {
  const { apiKey, apiUrl } = getConfig();

  const response = await fetch(`${apiUrl}/v1/tasks/${taskId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`ActionLayer getTask failed with status ${response.status}`);
  }

  return (await response.json()) as ActionLayerTask;
}

/**
 * Polls a task until it reaches a terminal state (`completed`/`failed`) or the
 * timeout elapses. Browser-driven tasks can take a while, so this defaults to a
 * generous timeout with a short poll interval.
 */
export async function pollTaskUntilDone(
  taskId: string,
  options: { timeoutMs?: number; intervalMs?: number } = {}
): Promise<ActionLayerTask> {
  const timeoutMs = options.timeoutMs ?? 30000;
  const intervalMs = options.intervalMs ?? 2000;
  const startedAt = Date.now();

  let task = await getTask(taskId);

  while (task.status !== 'completed' && task.status !== 'failed' && task.status !== 'needs_input') {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`ActionLayer task ${taskId} did not complete within ${timeoutMs}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    task = await getTask(taskId);
  }

  return task;
}
