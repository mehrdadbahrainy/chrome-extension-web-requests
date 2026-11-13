import { createRequest, finalizeRequest, MAX_REQUESTS_PER_TAB, MAX_TABS } from './request-utils.js';

const REQUESTS_KEY = 'requestsByTab';
const FILTER = { urls: ['http://*/*', 'https://*/*'] };
let queue = Promise.resolve();

function serialize(work) {
  const job = queue.then(work);
  queue = job.catch(error => console.error('Web Requests Inspector:', error));
  return job;
}

async function updateTab(tabId, update) {
  const stored = await chrome.storage.session.get(REQUESTS_KEY);
  const byTab = stored[REQUESTS_KEY] || {};
  const key = String(tabId);
  const old = Array.isArray(byTab[key]) ? byTab[key] : [];
  byTab[key] = update(old).slice(0, MAX_REQUESTS_PER_TAB);
  // Bound memory even if many browser tabs are opened.
  const keys = Object.keys(byTab);
  if (keys.length > MAX_TABS) {
    for (const excess of keys.slice(0, keys.length - MAX_TABS)) delete byTab[excess];
  }
  await chrome.storage.session.set({ [REQUESTS_KEY]: byTab });
  return byTab[key];
}

async function isRecording() {
  const result = await chrome.storage.local.get('recording');
  return result.recording !== false;
}

chrome.webRequest.onBeforeRequest.addListener(details => {
  if (details.tabId < 0) return;
  void serialize(async () => {
    if (!(await isRecording())) return;
    await updateTab(details.tabId, previous => [
      createRequest(details),
      ...previous.filter(item => item.id !== String(details.requestId))
    ]);
  });
}, FILTER);

chrome.webRequest.onCompleted.addListener(details => {
  if (details.tabId < 0) return;
  void serialize(async () => {
    await updateTab(details.tabId, previous =>
      previous.map(item => item.id === String(details.requestId)
        ? finalizeRequest(item, details) : item)
    );
  });
}, FILTER);

chrome.webRequest.onErrorOccurred.addListener(details => {
  if (details.tabId < 0) return;
  void serialize(async () => {
    await updateTab(details.tabId, previous =>
      previous.map(item => item.id === String(details.requestId)
        ? finalizeRequest(item, details, true) : item)
    );
  });
}, FILTER);

chrome.tabs.onRemoved.addListener(tabId => {
  void serialize(async () => {
    const stored = await chrome.storage.session.get(REQUESTS_KEY);
    const byTab = stored[REQUESTS_KEY] || {};
    if (Object.hasOwn(byTab, String(tabId))) {
      delete byTab[String(tabId)];
      await chrome.storage.session.set({ [REQUESTS_KEY]: byTab });
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !['GET_RECORDS', 'CLEAR_RECORDS', 'SET_RECORDING'].includes(message.type)) return false;
  void serialize(async () => {
    const recording = await isRecording();
    if (message.type === 'SET_RECORDING') {
      const value = Boolean(message.recording);
      await chrome.storage.local.set({ recording: value });
      return { ok: true, recording: value };
    }
    const tabId = Number(message.tabId);
    if (!Number.isInteger(tabId) || tabId < 0) {
      return { ok: false, error: 'No inspectable browser tab selected.' };
    }
    if (message.type === 'CLEAR_RECORDS') {
      await updateTab(tabId, () => []);
      return { ok: true, recording, requests: [] };
    }
    const stored = await chrome.storage.session.get(REQUESTS_KEY);
    return {
      ok: true,
      recording,
      requests: stored[REQUESTS_KEY]?.[String(tabId)] || []
    };
  }).then(sendResponse, error => sendResponse({ ok: false, error: String(error) }));
  return true;
});
