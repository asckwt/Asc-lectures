# محاضرات المحاسبة المجانية لطلاب AOUKW

الموقع: https://www.asckwt.com

لتحديث المحاضرات أو الأرقام: عدّل قسم CONFIG في index.html.

## صفحات المواد
كل مادة لها صفحة في `c/<رمز المادة>/` تنبني تلقائياً من CONFIG (المحاضرات، النماذج، القروبات) عن طريق GitHub Actions كل ما تغيّر index.html.
لو تبي تبنيها بنفسك: `node tools/build-courses.js`

## الإعدادات الجديدة في CONFIG
- `announcements`: شريط الإعلانات فوق الموقع (يختفي بعد تاريخ `until`).
- `follow`: روابط قناة الواتساب والتلقرام والانستقرام.
- `analytics`: رقم Google Analytics 4 (G-XXXXXXXXXX) عشان تشتغل إحصائيات الزوار.

## مساعد الذكاء الاصطناعي (ai/)
مساعد يجاوب الطلاب في الصفحة الرئيسية وصفحات المواد وبنك الأسئلة، ويعرف المواد والخطط والمتطلبات والمواعيد والنماذج من بيانات الموقع نفسه.
- `ai/worker.js`: وسيط على Cloudflare Workers يكلم Claude (Haiku) ويخبي المفتاح. ينرفع تلقائياً من `.github/workflows/deploy-ai.yml`.
- `ai/chat.js`: نافذة المحادثة. `ai/kb/` و `ai/config.js` ينبنون من `node tools/build-ai.js`.
- التشغيل: حط رابط الـ Worker في `CONFIG.ai.endpoint` في index.html، وعدد الأسئلة اليومي لكل طالب في `CONFIG.ai.daily`.
- حط سقف صرف شهري في console.anthropic.com عشان الفاتورة ما تتعداه.
