# تطبيق الطالب الأكاديمي (Expo)

نفس الموقع بس كتطبيق آيفون وأندرويد: الدخول، الأخبار، المحاضرات (مع العلامة المائية ومنع تصوير الشاشة)، الملفات، الشات مع الأستاذ، التقييم، الشكاوي، القروبات.

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

## ملاحظات

- معرّف التطبيق `com.asckwt.student` (آيفون وأندرويد).
- منع تصوير الشاشة يشتغل على الجوال بس، مو على الويب.
- مجلدات `ios` و `android` تنولد بـ `npx expo prebuild` وما تنحفظ بالمستودع.
