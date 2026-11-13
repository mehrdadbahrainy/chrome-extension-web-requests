/**
 * Pure filtering helpers for the popup. These functions never alter captured data.
 */
const REGEX_MAX_LENGTH = 256;

export function getRegexError(value, enabled) {
  const query = value.trim();
  if (!enabled || !query) return null;
  if (query.length > REGEX_MAX_LENGTH) return 'Regex must be 256 characters or fewer.';
  try {
    new RegExp(query, 'i');
    return null;
  } catch {
    return 'Invalid regular expression. Check the pattern.';
  }
}

function matchesHostname(url, input) {
  const domain = input.trim().toLowerCase().replace(/^\*\./, '').replace(/\.$/, '');
  if (!domain) return true;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === domain || hostname.endsWith('.' + domain);
  } catch {
    return false;
  }
}

function matchesStatus(record, filter) {
  if (filter === 'ALL') return true;
  if (filter === 'pending' || filter === 'failed') return record.status === filter;
  if (filter === 'errors') {
    return record.status === 'failed' || (record.statusCode !== null && record.statusCode >= 400);
  }
  const match = /^([1-5])xx$/.exec(filter);
  return Boolean(match && record.statusCode !== null &&
    Math.floor(record.statusCode / 100) === Number(match[1]));
}

export function filterRequests(records, filters) {
  const query = filters.search.trim();
  if (getRegexError(query, filters.regex)) return [];

  const pattern = filters.regex && query ? new RegExp(query, 'i') : null;
  const plainQuery = query.toLowerCase();

  return records.filter(record => {
    if (filters.method !== 'ALL' && record.method !== filters.method) return false;
    if (filters.resourceType !== 'ALL' && record.type !== filters.resourceType) return false;
    if (!matchesStatus(record, filters.statusFilter)) return false;
    if (!matchesHostname(record.url, filters.domain)) return false;
    if (!query) return true;

    const searchable = [
      record.url,
      record.method,
      record.type,
      record.status,
      String(record.statusCode ?? '')
    ];
    return pattern
      ? searchable.some(field => pattern.test(field))
      : searchable.some(field => field.toLowerCase().includes(plainQuery));
  });
}
