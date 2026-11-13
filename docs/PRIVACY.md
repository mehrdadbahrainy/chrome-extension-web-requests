# Reqlyst — Privacy information / اطلاعات حریم خصوصی

## English

**Product:** Reqlyst — Web Request Inspector (version 2.1.1)

Reqlyst observes HTTP(S) request metadata associated with browser tabs for the purpose of displaying and filtering it locally in the extension popup. The recorded fields include the sanitized request URL, HTTP method, resource type, tab identifier, initiator when available, start time, status, HTTP response code, duration, and network error when available.

**Storage:** Captured records are saved to Chrome's `storage.session` area (up to 200 requests per tab and 12 tabs). Request history is intended to be temporary and is removed when the tab is closed or when the user clears that tab's records. The pause/resume preference is saved in `storage.local`.

**Sensitive information:** Request/response bodies, request/response headers, and cookies are not captured. Passwords in URL credentials and the values of predefined commonly sensitive URL query keys are replaced before storage. URLs might still contain application-specific secrets, so users should not assume all captured metadata is safe to share.

**Sharing and transmission:** The current source code does not send captured request data to the developer or any third-party analytics service. Data remains in browser-managed storage. Reqlyst does not require a user account and does not include advertising or trackers.

**Permissions:** The extension needs `webRequest` and HTTP(S) host access to observe request events, `tabs` to identify the inspected tab, and `storage` for its local state.

**User controls:** Users can pause capture, clear recorded requests for a tab, close tabs to discard their associated history, or uninstall the extension. Browser session data is not designed to persist across browser restarts.

**Support and privacy questions:** Use the public issue tracker at https://github.com/mehrdadbahrainy/chrome-extension-web-requests/issues. This text describes the implementation in this repository and should be reviewed if the extension's capabilities change.

## فارسی

**محصول:** Reqlyst — Web Request Inspector، نسخه ۲.۱.۱

این افزونه اطلاعات درخواست‌های HTTP و HTTPS مربوط به تب‌های مرورگر را برای نمایش و فیلترکردن در محیط محلی ثبت می‌کند. این اطلاعات شامل آدرس پاک‌سازی‌شده درخواست، متد، نوع منبع، شناسه تب، منشا درخواست در صورت وجود، زمان شروع، وضعیت، کد HTTP، مدت زمان و خطای شبکه است.

**نگهداری داده:** اطلاعات درخواست‌ها در `chrome.storage.session` به‌صورت موقت نگهداری می‌شود. محدودیت نگهداری ۲۰۰ درخواست برای هر تب و ۱۲ تب است. با پاک‌کردن تاریخچه تب یا بسته شدن آن، داده‌های همان تب حذف می‌شوند. تنظیم توقف یا فعال‌بودن ضبط در `chrome.storage.local` ذخیره می‌شود.

**اطلاعات حساس:** بدنه درخواست‌ها و پاسخ‌ها، هدرها و کوکی‌ها ثبت نمی‌شوند. مقدار بعضی پارامترهای رایج حساس در URL و نام کاربری و رمز عبور در آدرس، پیش از ثبت مخفی می‌شوند. با این حال ممکن است بعضی آدرس‌ها همچنان شامل داده‌های محرمانه اختصاصی سایت باشند.

**ارسال اطلاعات:** نسخه فعلی اطلاعات ثبت‌شده را به سرور سازنده یا سرویس تحلیل شخص ثالث ارسال نمی‌کند. داده‌ها در حافظه مرورگر باقی می‌مانند. افزونه به حساب کاربری نیاز ندارد و فاقد تبلیغات و ابزار ردیابی است.

**دسترسی‌ها:** دسترسی‌های `webRequest` و میزبان‌های HTTP و HTTPS برای مشاهده درخواست‌ها، `tabs` برای شناسایی تب و `storage` برای ذخیره محلی مورد استفاده قرار می‌گیرند.

**کنترل کاربر:** امکان توقف ضبط، پاک‌کردن تاریخچه تب و حذف افزونه وجود دارد. تاریخچه موقت برای نگهداری دائمی طراحی نشده است.

**پشتیبانی:** برای پرسش‌های مربوط به حریم خصوصی از بخش Issues مخزن پروژه استفاده کنید:
https://github.com/mehrdadbahrainy/chrome-extension-web-requests/issues
