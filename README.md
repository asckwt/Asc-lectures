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
