import test from 'node:test';
import assert from 'node:assert/strict';
import { filterRequests, getRegexError } from '../../src/request-filters.js';

const records = [
  { url: 'https://api.example.com/users', method: 'GET', type: 'xmlhttprequest', status: 'completed', statusCode: 200 },
  { url: 'https://example.com/not-found', method: 'GET', type: 'main_frame', status: 'completed', statusCode: 404 },
  { url: 'https://cdn.example.com/picture.png', method: 'GET', type: 'image', status: 'completed', statusCode: 304 },
  { url: 'https://evil-example.com/broken', method: 'POST', type: 'xmlhttprequest', status: 'completed', statusCode: 503 },
  { url: 'https://api.example.com/offline', method: 'POST', type: 'xmlhttprequest', status: 'failed', statusCode: null },
  { url: 'https://api.example.com/loading', method: 'GET', type: 'fetch', status: 'pending', statusCode: null }
];

const defaults = { search: '', regex: false, domain: '', method: 'ALL', statusFilter: 'ALL', resourceType: 'ALL' };
function run(overrides = {}) {
  return filterRequests(records, { ...defaults, ...overrides });
}

test('domain matches an exact host or its subdomains but not lookalike domains', () => {
  const result = run({ domain: 'example.com' });
  assert.equal(result.length, 5);
  assert.ok(result.every(item => !item.url.includes('evil-example.com')));
  assert.equal(run({ domain: '*.example.com' }).length, 5);
  assert.equal(run({ domain: 'API.EXAMPLE.COM' }).length, 3);
});

test('HTTP status categories and network failures are distinct', () => {
  assert.equal(run({ statusFilter: '2xx' }).length, 1);
  assert.equal(run({ statusFilter: '3xx' }).length, 1);
  assert.equal(run({ statusFilter: '4xx' }).length, 1);
  assert.equal(run({ statusFilter: '5xx' }).length, 1);
  assert.equal(run({ statusFilter: 'errors' }).length, 3);
  assert.equal(run({ statusFilter: 'failed' }).length, 1);
  assert.equal(run({ statusFilter: 'pending' }).length, 1);
});

test('request type, HTTP method and domain filters combine', () => {
  assert.equal(run({ domain: 'api.example.com', method: 'POST', resourceType: 'xmlhttprequest' }).length, 1);
  assert.equal(run({ resourceType: 'image' }).length, 1);
  assert.equal(run({ method: 'DELETE' }).length, 0);
});

test('text search checks URL, method, type, status and code without case sensitivity', () => {
  assert.equal(run({ search: 'USERS' }).length, 1);
  assert.equal(run({ search: 'POST' }).length, 2);
  assert.equal(run({ search: '404' }).length, 1);
  assert.equal(run({ search: 'failed' }).length, 1);
});

test('regular expressions work with anchors and alternatives', () => {
  assert.equal(run({ search: '^https://api\\.example\\.com/(users|offline)$', regex: true }).length, 2);
  assert.equal(run({ search: 'not-found$', regex: true }).length, 1);
  assert.equal(getRegexError('(', true), 'Invalid regular expression. Check the pattern.');
  assert.equal(run({ search: '(', regex: true }).length, 0);
  assert.equal(getRegexError('(', false), null);
  assert.equal(getRegexError('a'.repeat(257), true), 'Regex must be 256 characters or fewer.');
});
