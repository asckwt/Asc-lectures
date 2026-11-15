-- جداول خادم المحاضرات. آمن تشغيله كل مرة (ما يمسح شي).
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
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
