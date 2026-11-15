-- جداول خادم المحاضرات. آمن تشغيله كل مرة (ما يمسح شي).
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  uni TEXT,
  major INTEGER,
  email TEXT,
  pass TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | active | blocked
  note TEXT,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS access (
  user_id INTEGER NOT NULL,
  course TEXT NOT NULL,
  until INTEGER NOT NULL,
  PRIMARY KEY (user_id, course)
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  device TEXT NOT NULL,
  ua TEXT,
  created INTEGER NOT NULL,
  seen INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
-- id هو رقم الفيديو في Cloudflare Stream. ready: 0 يتجهز، 1 جاهز، -1 فشل
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  course TEXT NOT NULL,
  title TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  host TEXT, -- مثل https://customer-xxxx.cloudflarestream.com
  duration INTEGER NOT NULL DEFAULT 0,
  size INTEGER NOT NULL DEFAULT 0,
  ready INTEGER NOT NULL DEFAULT 0,
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS videos_course ON videos(course, sort);
CREATE TABLE IF NOT EXISTS views (
  user_id INTEGER NOT NULL,
  video_id TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS views_user ON views(user_id, at);
CREATE INDEX IF NOT EXISTS views_at ON views(at);
-- وين وقف كل طالب بكل محاضرة
CREATE TABLE IF NOT EXISTS progress (
  user_id INTEGER NOT NULL,
  video_id TEXT NOT NULL,
  pos INTEGER NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (user_id, video_id)
);
-- الأجهزة المسجّلة لكل طالب (جهازين بالكثير). تسجيل الخروج ما يمسحها، بس الإدارة
CREATE TABLE IF NOT EXISTS devices (
  user_id INTEGER NOT NULL,
  device TEXT NOT NULL,
  ua TEXT,
  first INTEGER NOT NULL,
  last INTEGER NOT NULL,
  PRIMARY KEY (user_id, device)
);
-- محاولات دخول من جهاز ثالث (علامة إن الحساب يتشارك)
CREATE TABLE IF NOT EXISTS attempts (
  user_id INTEGER NOT NULL,
  device TEXT NOT NULL,
  ua TEXT,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS attempts_at ON attempts(at);
-- الجلسة اللي تشغّل فيديو الحين (وحدة بس لكل حساب)
CREATE TABLE IF NOT EXISTS active (
  user_id INTEGER PRIMARY KEY,
  token TEXT NOT NULL,
  at INTEGER NOT NULL
);
-- إعدادات عامة (مثل مفتاح التحقق بخطوتين للإدارة)
CREATE TABLE IF NOT EXISTS settings (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);
-- جلسات الإدارة (12 ساعة)
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  exp INTEGER NOT NULL,
  ua TEXT
);

-- ===== الكتالوج: جامعة ← تخصص ← مادة، والدكاترة والأسعار =====
-- الأسعار كلها بالفلس (1 د.ك = 1000) عشان ما يصير خطأ كسور
CREATE TABLE IF NOT EXISTS universities (
  id TEXT PRIMARY KEY, -- رمز قصير مثل AOU
  name TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS majors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uni TEXT NOT NULL,
  name TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS majors_uni ON majors(uni, sort);
CREATE TABLE IF NOT EXISTS doctors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  bio TEXT,
  photo TEXT,
  sample TEXT, -- محاضرة تجريبية (رقم فيديو)
  sort INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1
);
-- id = رمز الجامعة-رمز المادة (مثل AOU-B326)، وهو اللي ينحفظ في videos.course و access.course
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  uni TEXT NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  doctor INTEGER,
  price_mid INTEGER NOT NULL DEFAULT 0,
  price_final INTEGER NOT NULL DEFAULT 0,
  price_full INTEGER NOT NULL DEFAULT 0,
  installments INTEGER NOT NULL DEFAULT 0, -- 1 = الفصل كامل يندفع قسطين
  mid_until INTEGER, -- آخر يوم لباقة الميدتيرم
  final_until INTEGER, -- آخر يوم لباقة الفاينل والكامل
  visible INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS courses_uni ON courses(uni, sort);
CREATE TABLE IF NOT EXISTS course_majors (
  course TEXT NOT NULL,
  major INTEGER NOT NULL,
  PRIMARY KEY (course, major)
);
-- أكواد الخصم: kind = pct (نسبة) أو amt (مبلغ بالفلس)
CREATE TABLE IF NOT EXISTS promos (
  code TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  value INTEGER NOT NULL,
  course TEXT, -- فاضي = كل المواد
  max_uses INTEGER, -- فاضي = بدون حد
  used INTEGER NOT NULL DEFAULT 0,
  until INTEGER, -- فاضي = بدون تاريخ
  active INTEGER NOT NULL DEFAULT 1,
  created INTEGER NOT NULL
);
-- قروبات الواتساب: scope = uni | major | course. private = 1 يعني للمشتركين بالمادة بس
CREATE TABLE IF NOT EXISTS wa_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uni TEXT NOT NULL,
  scope TEXT NOT NULL,
  ref TEXT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  private INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS wa_groups_uni ON wa_groups(uni, scope, sort);

-- ===== التقييمات والشكاوي وفهرس الأسئلة =====
-- تقييم واحد لكل طالب بكل مادة. 2 نجوم أو أقل يكون pending لين توافق الإدارة
CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  course TEXT NOT NULL,
  stars INTEGER NOT NULL,
  tags TEXT,
  comment TEXT,
  status TEXT NOT NULL, -- published | pending | hidden
  reply TEXT,
  created INTEGER NOT NULL,
  UNIQUE (user_id, course)
);
CREATE INDEX IF NOT EXISTS ratings_course ON ratings(course, status);
-- الشكاوي والاقتراحات: kind = suggestion | complaint | tech | payment
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  course TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- open | working | solved
  reply TEXT,
  created INTEGER NOT NULL,
  updated INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS tickets_user ON tickets(user_id, created);
CREATE INDEX IF NOT EXISTS tickets_status ON tickets(status, created);
-- فهرس الأسئلة داخل كل فيديو: t = الثانية اللي يبدأ فيها السؤال
CREATE TABLE IF NOT EXISTS chapters (
  video_id TEXT NOT NULL,
  t INTEGER NOT NULL,
  title TEXT NOT NULL,
  PRIMARY KEY (video_id, t)
);
