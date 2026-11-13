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
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  course TEXT NOT NULL,
  title TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  r2key TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'video/mp4',
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
