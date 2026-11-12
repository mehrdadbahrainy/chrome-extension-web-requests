/**
 * Shared, side-effect-free helpers. Raw request bodies and headers are never stored.
 * Common credential-bearing query parameters are masked before recording URLs.
 */
const SECRET_KEYS = /^(?:access[_-]?token|refresh[_-]?token|id[_-]?token|token|api[_-]?key|apikey|password|passwd|secret|authorization|auth|session|sessionid|code|signature|sig)$/i;

export const MAX_REQUESTS_PER_TAB = 200;
export const MAX_TABS = 12;

export function sanitizeUrl(value) {
  try {
    const parsed = new URL(value);
    if (parsed.username) parsed.username = '[redacted]';
    if (parsed.password) parsed.password = '[redacted]';
    for (const key of [...parsed.searchParams.keys()]) {
      if (SECRET_KEYS.test(key)) parsed.searchParams.set(key, '[redacted]');
    }
    return parsed.toString();
  } catch {
    return '[invalid URL]';
  }
}

export function createRequest(details) {
  return {
    id: String(details.requestId),
    tabId: details.tabId,
    url: sanitizeUrl(details.url),
    method: details.method,
    type: details.type,
    initiator: details.initiator ? sanitizeUrl(details.initiator) : null,
    startedAt: details.timeStamp ?? Date.now(),
    durationMs: null,
    status: 'pending',
    statusCode: null,
    error: null
  };
}

export function finalizeRequest(record, details, failed = false) {
  return {
    ...record,
    status: failed ? 'failed' : 'completed',
    statusCode: typeof details.statusCode === 'number' ? details.statusCode : record.statusCode,
    durationMs: Math.max(0, Math.round((details.timeStamp ?? Date.now()) - record.startedAt)),
    error: failed ? String(details.error || 'Network error') : null
  };
}
