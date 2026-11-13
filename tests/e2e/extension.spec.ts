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
