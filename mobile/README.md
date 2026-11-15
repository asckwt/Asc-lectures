# تطبيق الأكاديمي (The Academic)، مبني بـ Expo

نفس الكود يطلع منه تطبيق آيفون وأندرويد **وموقع الطالب** (asckwt.com/watch): الدخول، الأخبار، المحاضرات (مع العلامة المائية ومنع تصوير الشاشة)، الملفات، الشات مع الأستاذ، التقييم، الشكاوي، القروبات.

## التشغيل

```bash
npm ci
npx expo start            # على الجوال عن طريق Expo Go أو development build
npx tsc --noEmit && npx expo lint
```

السيرفر الافتراضي هو `asc-videos` على Cloudflare. للتجربة محلياً:

```bash
EXPO_PUBLIC_API=http://localhost:8799 npx expo start
```

## الموقع

```bash
node scripts/build-web.mjs          # يبني الموقع بـ ../watch (لوحة الإدارة watch/admin ما تنلمس)
```

- كل صفحة ملف ثابت (course/index.html …) والروابط بالـ query مثل `course/?id=AOU-B326`، فالمواد الجديدة ما تحتاج بناء جديد.
- الفيديو بالمتصفح عن طريق hls.js (`src/components/Player.web.tsx`)، والملفات بـ `src/lib/files.web.ts`.
- الخطوط woff2 من `public/fonts` (رخصة OFL)، وسياسة الأمان (CSP) تنحط وقت البناء مع بصمة السكربت المدموج.
- بعد الدمج بـ main، GitHub يبني الموقع بروحه (`.github/workflows/build-watch.yml`).

## ملاحظات

- اسم التطبيق «الأكاديمي» بالعربي و«The Academic» بالإنجليزي (حسب لغة الجهاز)، من `locales/`.
- معرّف التطبيق `com.asckwt.student` (آيفون وأندرويد).
- منع تصوير الشاشة يشتغل على الجوال بس، مو على الويب.
- مجلدات `ios` و `android` تنولد بـ `npx expo prebuild` وما تنحفظ بالمستودع.
