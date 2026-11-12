# Web Requests Inspector

A small, privacy-conscious Chrome extension that shows HTTP(S) requests from the active tab. Built with **Angular 22** and **Chrome Manifest V3**.

## Features

- Capture requests in a Manifest V3 background service worker, even while the popup is closed.
- Show request URL, method, resource type, HTTP status, duration and network errors.
- Filter by URL/status/type and HTTP method, and inspect request details.
- Pause/resume recording, clear history for the inspected tab.
- Keep up to 200 requests per tab in ephemeral `chrome.storage.session` (up to 12 tabs).
- Redact commonly secret-bearing URL parameters. Request and response bodies, headers and cookies are **not** collected.

This is a **request inspector**, not an HTTP proxy, response-body sniffer or request modifier. Chrome DevTools is a better fit for full body/header analysis.

## Build and install

**Requirements:** Node.js 26+ (or a compatible Node.js version supported by Angular 22) and npm.

```bash
npm install
npm run test:unit
npm run build
node scripts/verify-build.mjs
```

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked** and choose `dist/chrome-extension`.
4. Open an HTTP(S) site and click the extension button.
5. Refresh the site or initiate an API request. Requests appear in the popup.

The extension asks for site access so Chrome's `webRequest` API can observe network metadata. No network data is sent off-device.

## Tests

```bash
npm run test:unit
npm run build
npx playwright install --with-deps --no-shell chromium
npm run test:e2e
```

End-to-end tests load the unpacked extension in Playwright's Chromium, issue real localhost HTTP requests, and verify statuses, redaction, filtering, recording controls and clearing history.

GitHub Actions runs unit tests, builds the extension, verifies its output and runs Chromium E2E on each PR and push. A successful run uploads the unpacked extension as an artifact.

## Architecture

- `src/background.js`: MV3 service worker, event listeners, message API and bounded session storage.
- `src/request-utils.js`: pure record formatting and URL sanitization.
- `src/app/`: Angular standalone popup (signals, search, filters and details).
- `tests/unit/`: Node tests for pure helpers.
- `tests/e2e/`: Playwright tests using a local HTTP fixture server.

## Limitations

- Captures only HTTP(S) requests associated with ordinary browser tabs and allowed by the declared host permissions.
- HTTP request/response **bodies**, private headers and cookies are intentionally not collected.
- Request history is session-scoped and will be cleared when the browser session ends.
- Chromium's request events, permissions, and privacy behavior still apply. Incognito requires explicit user permission.

## License

No license has been declared for the repository yet.
