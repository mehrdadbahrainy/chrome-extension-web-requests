import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeUrl, createRequest, finalizeRequest, MAX_REQUESTS_PER_TAB } from '../../src/request-utils.js';

test('masks sensitive URL query values and credentials', () => {
  const url = sanitizeUrl('https://alice:hunter2@example.com/api?token=secret&access_token=abc&q=hello');
  assert.ok(!url.includes('secret'));
  assert.ok(!url.includes('hunter2'));
  assert.ok(!url.includes('alice'));
  assert.ok(!url.includes('abc'));
  assert.ok(url.includes('q=hello'));
  assert.ok(url.includes('redacted'));
});

test('normal requests preserve safe URL values and metadata', () => {
  const item = createRequest({ requestId: 'r-1', tabId: 4, url: 'https://example.org/users?page=2', method: 'GET', type: 'xmlhttprequest', timeStamp: 100 });
  assert.equal(item.id, 'r-1');
  assert.equal(item.tabId, 4);
  assert.equal(item.method, 'GET');
  assert.equal(item.status, 'pending');
  assert.equal(item.url, 'https://example.org/users?page=2');
  assert.equal(item.startedAt, 100);
  assert.ok(!('requestBody' in item));
  assert.ok(!('headers' in item));
});

test('records successful HTTP status and nonnegative duration', () => {
  const item = createRequest({ requestId: 'r-2', tabId: 1, url: 'https://example.org/', method: 'POST', type: 'fetch', timeStamp: 1000 });
  const done = finalizeRequest(item, { timeStamp: 1025.7, statusCode: 201 });
  assert.equal(done.status, 'completed');
  assert.equal(done.statusCode, 201);
  assert.equal(done.durationMs, 26);
});

test('reports network failures without storing request bodies', () => {
  const item = createRequest({ requestId: 'r-3', tabId: 1, url: 'https://example.org/', method: 'GET', type: 'fetch', timeStamp: 1000 });
  const done = finalizeRequest(item, { timeStamp: 900, error: 'net::ERR_FAILED' }, true);
  assert.equal(done.status, 'failed');
  assert.equal(done.durationMs, 0);
  assert.equal(done.error, 'net::ERR_FAILED');
});

test('caps per-tab history', () => assert.equal(MAX_REQUESTS_PER_TAB, 200));
