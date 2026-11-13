import { test, expect, chromium, type BrowserContext, type Worker } from '@playwright/test';
import { resolve } from 'node:path';

let context: BrowserContext;
let worker: Worker;
let extensionId: string;

test.beforeAll(async () => {
  const extensionPath = resolve('dist/chrome-extension');
  context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    args: [
      '--disable-extensions-except=' + extensionPath,
      '--load-extension=' + extensionPath
    ]
  });
  worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
  extensionId = worker.url().split('/')[2];
  expect(extensionId).toBeTruthy();
});

test.afterAll(async () => {
  await context?.close();
});

test('records requests, redacts tokens, filters, pauses and clears history', async () => {
  const site = await context.newPage();
  await site.goto('http://127.0.0.1:4173/');
  const tabId = await worker.evaluate(async () => {
    const tabs = await chrome.tabs.query({});
    return tabs.find(tab => tab.url?.startsWith('http://127.0.0.1:4173/'))?.id ?? -1;
  });
  expect(tabId).toBeGreaterThan(0);

  await site.evaluate(async () => {
    await fetch('/api/ping?token=super-secret&q=ok');
    await fetch('/api/missing');
  });

  await expect.poll(async () => worker.evaluate(async id => {
    const stored = await chrome.storage.session.get('requestsByTab');
    return (stored.requestsByTab?.[String(id)] ?? []).filter((row: { url: string }) => row.url.includes('/api/')).length;
  }, tabId)).toBe(2);

  const popup = await context.newPage();
  await popup.goto('chrome-extension://' + extensionId + '/index.html?tabId=' + tabId);
  await expect(popup.getByRole('heading', { name: 'Web Requests' })).toBeVisible();
  await popup.getByTestId('search').fill('/api/');
  await expect(popup.getByTestId('request-row')).toHaveCount(2);
  await expect(popup.getByText('404', { exact: true })).toBeVisible();
  await expect(popup.locator('body')).not.toContainText('super-secret');
  await popup.getByTestId('method-filter').selectOption('GET');
  await expect(popup.getByTestId('request-row')).toHaveCount(2);
  await popup.getByTestId('request-row').first().click();
  await expect(popup.getByTestId('details')).toBeVisible();
  await expect(popup.getByTestId('request-url')).toContainText('/api/');

  await popup.getByTestId('toggle-recording').click();
  await expect(popup.getByTestId('toggle-recording')).toContainText('Paused');
  await site.evaluate(async () => { await fetch('/api/ping?new=when-paused'); });
  await expect.poll(async () => worker.evaluate(async id => {
    const stored = await chrome.storage.session.get('requestsByTab');
    return (stored.requestsByTab?.[String(id)] ?? []).filter((row: { url: string }) => row.url.includes('when-paused')).length;
  }, tabId)).toBe(0);

  await popup.getByTestId('toggle-recording').click();
  await expect(popup.getByTestId('toggle-recording')).toContainText('Recording');
  await popup.getByTestId('clear').click();
  await expect(popup.getByTestId('request-row')).toHaveCount(0);
  await site.close();
  await popup.close();
});

test('v2.1 advanced filters combine domain, HTTP status, type, method and regex', async () => {
  const site = await context.newPage();
  await site.goto('http://127.0.0.1:4173/');
  const tabId = await worker.evaluate(async () => {
    const tabs = await chrome.tabs.query({});
    return tabs.find(tab => tab.url?.startsWith('http://127.0.0.1:4173/'))?.id ?? -1;
  });
  expect(tabId).toBeGreaterThan(0);

  await site.evaluate(async () => {
    await fetch('/api/ping?token=hidden');
    await fetch('/api/missing');
    await fetch('/api/fail');
    await fetch('/api/submit', { method: 'POST' });
  });

  await expect.poll(async () => worker.evaluate(async id => {
    const stored = await chrome.storage.session.get('requestsByTab');
    return (stored.requestsByTab?.[String(id)] ?? []).filter((row: { url: string }) => row.url.includes('/api/')).length;
  }, tabId)).toBe(4);

  const popup = await context.newPage();
  await popup.goto('chrome-extension://' + extensionId + '/index.html?tabId=' + tabId);
  const rows = popup.getByTestId('request-row');
  await popup.getByTestId('search').fill('/api/');
  await expect(rows).toHaveCount(4);

  await popup.getByTestId('domain-filter').fill('example.com');
  await expect(rows).toHaveCount(0);
  await popup.getByTestId('domain-filter').fill('127.0.0.1');
  await expect(rows).toHaveCount(4);

  await popup.getByTestId('status-filter').selectOption('4xx');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('/api/missing');
  await popup.getByTestId('status-filter').selectOption('5xx');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('/api/fail');
  await popup.getByTestId('status-filter').selectOption('errors');
  await expect(rows).toHaveCount(2);
  await popup.getByTestId('status-filter').selectOption('2xx');
  await expect(rows).toHaveCount(2);

  await popup.getByTestId('status-filter').selectOption('ALL');
  await popup.getByTestId('type-filter').selectOption('xmlhttprequest');
  await expect(rows).toHaveCount(4);
  await popup.getByTestId('method-filter').selectOption('POST');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('/api/submit');

  await popup.getByTestId('method-filter').selectOption('ALL');
  await popup.getByTestId('regex-toggle').check();
  await popup.getByTestId('search').fill('/api/(missing|fail)$');
  await expect(rows).toHaveCount(2);
  await popup.getByTestId('search').fill('[');
  await expect(popup.getByTestId('regex-error')).toContainText('Invalid regular expression');
  await expect(rows).toHaveCount(0);

  await popup.getByTestId('reset-filters').click();
  await expect(popup.getByTestId('regex-error')).toHaveCount(0);
  await expect(popup.getByTestId('search')).toHaveValue('');
  await expect(popup.getByTestId('domain-filter')).toHaveValue('');
  await expect(popup.getByTestId('method-filter')).toHaveValue('ALL');
  await expect(popup.getByTestId('status-filter')).toHaveValue('ALL');
  await expect(popup.getByTestId('type-filter')).toHaveValue('ALL');
  await expect(popup.getByTestId('regex-toggle')).not.toBeChecked();
  await expect(rows).not.toHaveCount(0);
  await site.close();
  await popup.close();
});
