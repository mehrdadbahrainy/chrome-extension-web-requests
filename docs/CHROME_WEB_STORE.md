# Reqlyst — Chrome Web Store publishing guide

**Status:** Packaging is automated. The extension is **not published** and no Chrome Web Store submission has been made.

**Version:** 2.1.1

## English — Store listing draft

**Name:** Reqlyst — Web Request Inspector

**Short description:** Inspect, search and filter HTTP(S) requests from the active browser tab.

**Category suggestion:** Developer Tools, if offered in the current dashboard.

**Detailed description:**

Reqlyst is a lightweight Chrome extension for inspecting HTTP(S) request metadata right from your browser toolbar. Developers and testers can view the URL, HTTP method, status code, resource type, response time, and network errors for requests associated with the active tab.

Use built-in advanced filters to narrow requests by hostname, HTTP method, resource type, HTTP status categories (1xx–5xx), network errors, or case-insensitive regex patterns. Combine filters and reset them instantly. Pause or resume capture, inspect request details, and clear the tab's history.

Requests are observed by a Manifest V3 background service worker, even when the popup is closed. Captured metadata is stored locally in session-scoped browser storage, with limits of 200 requests per tab across up to 12 tabs. No request or response bodies, headers, or cookies are captured. Commonly sensitive URL query parameters are redacted.

Reqlyst is a **metadata inspector**, not an HTTP proxy or request modification tool. It does not replay requests, intercept payloads, or send data to an external analytics service.

**Single purpose:** Display and filter HTTP(S) request metadata for developer troubleshooting.

### Permission justifications for the Privacy tab

- **webRequest:** Observe request-start, completion and network-error metadata.
- **tabs:** Identify the selected HTTP(S) browser tab and associate request records with its ID.
- **storage:** Keep bounded request history locally within the browser session and remember recording on/off state.
- **http://*/* and https://*/* host permissions:** Inspect network requests on websites the user chooses to visit, rather than restricting capture to a hardcoded domain.

The extension does not transmit captured traffic to a developer-owned server. Nevertheless, URLs can contain sensitive data, and the sanitizer does not guarantee that all custom secrets are removed. See [Privacy details](PRIVACY.md).

### First publication checklist

1. Verify the name is available and resolve trademark concerns before public release.
2. Register a Chrome Web Store developer account, pay the one-time registration fee, and enable two-step verification on the publishing account.
3. Download the **reqlyst-chrome-web-store** ZIP artifact from a successful GitHub Actions run, or build and ZIP the **contents** of `dist/chrome-extension` (not the parent directory).
4. In the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole), select **Add new item** and upload the ZIP.
5. Supply the 128×128 icon (`src/assets/icons/icon128.png`), **at least one genuine 1280×800 screenshot of the extension in use**, the listing text and other requested fields.
6. Fill in the Privacy tab, single-purpose declaration, permissions justification, distribution preferences, support details, and any required privacy-policy URL. The privacy document in this repository can be hosted at a stable, public HTTPS address.
7. Verify that the screenshots accurately reflect the current build and inspect what data is captured.
8. Submit for Google review and monitor the dashboard for approval or feedback. Approval is not guaranteed.

**Important:** The Chrome Web Store API cannot create the initial store item according to the current published V2 API reference. First upload in the Developer Dashboard is required; the API can help automate later updates. Verify current requirements in the official docs before submission.

References: [Publish an extension](https://developer.chrome.com/docs/webstore/publish), [Store listing](https://developer.chrome.com/docs/webstore/cws-dashboard-listing), [Developer registration](https://developer.chrome.com/docs/webstore/register), [API V2](https://developer.chrome.com/docs/webstore/api).

## فارسی — متن پیشنهادی معرفی در استور

**نام:** Reqlyst — Web Request Inspector

**توضیح کوتاه:** مشاهده، جست‌وجو و فیلتر درخواست‌های HTTP و HTTPS در تب فعال مرورگر.

**توضیح کامل:**

Reqlyst یک افزونه سبک برای مرورگر کروم است که اطلاعات درخواست‌های HTTP و HTTPS مربوط به تب فعال را نمایش می‌دهد. توسعه‌دهندگان و تست‌کنندگان می‌توانند URL، متد درخواست، کد وضعیت HTTP، نوع منبع، زمان پاسخ و خطاهای شبکه را بررسی کنند.

فیلترهای پیشرفته این امکان را فراهم می‌کنند که درخواست‌ها را بر اساس دامنه و زیردامنه، متد HTTP، نوع درخواست، گروه کدهای وضعیت 1xx تا 5xx، خطاهای شبکه و عبارت‌های Regex محدود کنید. همچنین می‌توانید ضبط درخواست‌ها را متوقف یا فعال کنید، جزئیات یک درخواست را ببینید و تاریخچه همان تب را پاک کنید.

دریافت اطلاعات درخواست‌ها در Service Worker انجام می‌شود و با بسته بودن پنجره افزونه هم ادامه پیدا می‌کند. اطلاعات به‌صورت محلی و موقت در مرورگر نگهداری می‌شوند. حداکثر ۲۰۰ درخواست برای هر تب و ۱۲ تب ذخیره می‌شود. بدنه درخواست و پاسخ، کوکی‌ها و هدرها جمع‌آوری نمی‌شوند. برخی پارامترهای رایج حساس در URL نیز قبل از ذخیره مخفی می‌شوند.

Reqlyst برای **مشاهده اطلاعات درخواست‌ها** طراحی شده است و Proxy یا ابزار ویرایش و اجرای مجدد درخواست‌ها نیست. اطلاعات ثبت‌شده به سرویس تحلیل خارجی ارسال نمی‌شوند.

### گام‌های انتشار

ابتدا حساب توسعه‌دهنده Chrome Web Store را فعال کنید و پرداخت ثبت‌نام و تایید دومرحله‌ای را انجام دهید. سپس فایل ZIP تولیدشده توسط GitHub Actions را در پنل توسعه‌دهندگان بارگذاری کنید. برای صفحه معرفی، آیکون ۱۲۸ پیکسل و حداقل یک اسکرین‌شات واقعی با ابعاد ۱۲۸۰ در ۸۰۰ پیکسل لازم است. بعد از تکمیل توضیحات، حریم خصوصی، سطح دسترسی‌ها و تنظیمات انتشار، افزونه برای بررسی گوگل ارسال می‌شود.

**وضعیت فعلی:** فقط بسته و محتوای معرفی آماده شده است. انتشار در استور هنوز انجام نشده و به دسترسی حساب توسعه‌دهنده نیاز دارد.
