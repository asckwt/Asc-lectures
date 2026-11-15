// خادم المحاضرات المحمية على Cloudflare Workers.
// - الطالب يسجّل من asckwt.com/watch، وحسابه يكون "بانتظار التفعيل" لين تفعّله من لوحة الإدارة وتحدد له مواده وتاريخ انتهاء اشتراكه.
// - الفيديوهات على Cloudflare Stream (مو عامة): تنرفع من لوحة الإدارة على طول لـ Cloudflare، وتشتغل بجودة تتغير حسب نت الطالب.
// - كل مشاهدة تاخذ رابط موقّع خاص يشتغل 4 ساعات بس، ويتجدد بروحه.
// - كل حساب يشتغل على جهازين بالكثير، عشان ما ينشر الطالب حسابه.
// الأسرار في Cloudflare: ADMIN_PASSWORD (كلمة سر لوحة الإدارة)، CF_API_TOKEN و CF_ACCOUNT_ID (للكلام مع Stream)،
// و STREAM_KEY_ID و STREAM_KEY_JWK (مفتاح توقيع روابط المشاهدة). كلها تنحط تلقائياً من GitHub.

const ORIGINS = ["https://www.asckwt.com", "https://asckwt.com"];
const MAX_DEVICES = 2;
const LINK_HOURS = 4;
const SESSION_DAYS = 60;
const PBKDF2_ROUNDS = 100000;
const MAX_HOURS = 6;

const now = () => Math.floor(Date.now() / 1000);
const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const rand = n => b64u(crypto.getRandomValues(new Uint8Array(n)));
const sha256 = async s => hex(await crypto.subtle.digest("SHA-256", enc.encode(s)));

function sameText(a, b) {
  a = enc.encode(String(a)); b = enc.encode(String(b));
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

async function hashPass(password, salt = rand(16)) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: PBKDF2_ROUNDS}, key, 256);
  return `${salt}:${hex(bits)}`;
}
async function checkPass(password, stored) {
  const [salt] = String(stored).split(":");
  return sameText(await hashPass(password, salt), stored);
}


// رقم الجوال: أرقام بس، ونشيل مقدمة الكويت عشان 965xxxxxxxx و xxxxxxxx يكونون نفس الحساب
function cleanPhone(p) {
  let d = String(p || "").replace(/[٠-٩]/g, c => "٠١٢٣٤٥٦٧٨٩".indexOf(c)).replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("965")) d = d.slice(3);
  return /^\d{8,15}$/.test(d) ? d : "";
}
const cleanCourse = c => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);

class Fail extends Error { constructor(status, code, msg) { super(msg); this.status = status; this.code = code; } }

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") || "";
    const okOrigin = ORIGINS.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const h = {
      "Access-Control-Allow-Origin": okOrigin ? origin : ORIGINS[0],
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Tus-Resumable, Upload-Length, Upload-Metadata",
      "Access-Control-Expose-Headers": "Location, Tus-Resumable, stream-media-id",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
      "X-Content-Type-Options": "nosniff",
    };

    if (req.method === "OPTIONS") return new Response(null, {headers: h});
    if (!url.pathname.startsWith("/api/")) return new Response("asc-videos", {headers: h});
    if (!okOrigin) return new Response("forbidden", {status: 403});

    const json = (data, status = 200) => new Response(JSON.stringify(data), {status, headers: {...h, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store"}});
    try {
      const path = url.pathname.slice(5);
      if (path.startsWith("admin/")) {
        const r = await admin(req, env, url, path.slice(6));
        return r instanceof Response ? new Response(r.body, {status: r.status, headers: {...h, ...Object.fromEntries(r.headers)}}) : json(r);
      }
      return json(await student(req, env, url, path));
    } catch (e) {
      if (e instanceof Fail) return json({error: e.code, message: e.message}, e.status);
      console.error(e);
      return json({error: "server", message: "صار خطأ بالسيرفر، جرّب مرة ثانية بعد شوي."}, 500);
    }
  },
};

async function body(req) {
  try { return await req.json(); } catch { throw new Fail(400, "bad", "الطلب ناقص."); }
}

async function limit(env, req, what, binding = "LIMITER") {
  const lim = env[binding];
  if (!lim) return;
  const ip = req.headers.get("CF-Connecting-IP") || "local";
  const {success} = await lim.limit({key: `${what}:${ip}`});
  if (!success) throw new Fail(429, "slow", "محاولات وايد، انتظر دقيقة وجرّب مرة ثانية.");
}

// ===== الطالب =====

async function session(req, env) {
  const t = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!t) throw new Fail(401, "login", "سجّل دخولك أول.");
  const s = await env.DB.prepare("SELECT s.token, s.user_id, s.seen, u.name, u.phone, u.email, u.status FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?").bind(await sha256(t)).first();
  if (!s || s.seen < now() - SESSION_DAYS * 86400) throw new Fail(401, "login", "انتهت جلستك، سجّل دخولك مرة ثانية.");
  if (s.seen < now() - 3600) await env.DB.prepare("UPDATE sessions SET seen = ? WHERE token = ?").bind(now(), s.token).run();
  if (s.status === "blocked") throw new Fail(403, "blocked", "حسابك موقوف، تواصل معنا بالواتساب.");
  return s;
}

async function myCourses(env, userId) {
  const {results: access} = await env.DB.prepare("SELECT course, until FROM access WHERE user_id = ? AND until > ? ORDER BY course").bind(userId, now()).all();
  if (!access.length) return [];
  const codes = access.map(a => a.course);
  await refreshPending(env, codes);
  const {results: vids} = await env.DB.prepare(`SELECT v.id, v.course, v.title, v.duration, p.pos FROM videos v LEFT JOIN progress p ON p.video_id = v.id AND p.user_id = ? WHERE v.ready = 1 AND v.course IN (${codes.map(() => "?").join(",")}) ORDER BY v.course, v.sort, v.created`).bind(userId, ...codes).all();
  return access.map(a => ({code: a.course, until: a.until, videos: vids.filter(v => v.course === a.course).map(v => ({id: v.id, title: v.title, duration: v.duration || 0, pos: v.pos || 0}))}));
}

async function student(req, env, url, path) {
  if (path === "signup" && req.method === "POST") {
    await limit(env, req, "signup");
    const b = await body(req);
    const name = String(b.name || "").trim().replace(/\s+/g, " ").slice(0, 80);
    const phone = cleanPhone(b.phone);
    const email = String(b.email || "").trim().toLowerCase().slice(0, 120);
    const password = String(b.password || "");
    if (name.length < 3) throw new Fail(400, "name", "اكتب اسمك الثلاثي.");
    if (!phone) throw new Fail(400, "phone", "رقم الجوال مو صحيح.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Fail(400, "email", "الإيميل مو صحيح.");
    if (password.length < 6) throw new Fail(400, "password", "كلمة السر لازم تكون 6 حروف أو أرقام بالأقل.");
    if (await env.DB.prepare("SELECT 1 FROM users WHERE phone = ?").bind(phone).first()) throw new Fail(409, "exists", "هالرقم مسجّل من قبل، سجّل دخولك.");
    await env.DB.prepare("INSERT INTO users (name, phone, email, pass, status, created) VALUES (?, ?, ?, ?, 'pending', ?)").bind(name, phone, email || null, await hashPass(password), now()).run();
    return login(env, req, phone, password, b.device);
  }
  if (path === "login" && req.method === "POST") {
    await limit(env, req, "login");
    const b = await body(req);
    return login(env, req, cleanPhone(b.phone), String(b.password || ""), b.device);
  }
  if (path === "logout" && req.method === "POST") {
    const s = await session(req, env);
    await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(s.token).run();
    return {ok: true};
  }
  if (path === "me" && req.method === "GET") {
    const s = await session(req, env);
    return {user: {name: s.name, phone: s.phone, status: s.status}, courses: s.status === "active" ? await myCourses(env, s.user_id) : []};
  }
  if (path === "play" && req.method === "POST") {
    const s = await session(req, env);
    if (s.status !== "active") throw new Fail(403, "pending", "حسابك للحين مو مفعّل.");
    const {video} = await body(req);
    const v = await env.DB.prepare("SELECT v.id, v.host FROM videos v JOIN access a ON a.course = v.course WHERE v.id = ? AND v.ready = 1 AND a.user_id = ? AND a.until > ?").bind(String(video || ""), s.user_id, now()).first();
    if (!v) throw new Fail(403, "noaccess", "هالمحاضرة مو ضمن اشتراكك.");
    await env.DB.batch([
      env.DB.prepare("INSERT INTO views (user_id, video_id, at) VALUES (?, ?, ?)").bind(s.user_id, v.id, now()),
      // فيديو واحد بنفس الوقت: هالجهاز صار هو اللي يشغّل، وأي جهاز ثاني يوقف
      env.DB.prepare("INSERT INTO active (user_id, token, at) VALUES (?, ?, ?) ON CONFLICT (user_id) DO UPDATE SET token = excluded.token, at = excluded.at").bind(s.user_id, s.token, now()),
    ]);
    const token = await streamToken(env, v.id, now() + LINK_HOURS * 3600);
    return {url: `${v.host}/${token}/manifest/video.m3u8`, mark: `${s.name} · ${s.phone}`};
  }
  // وين وقف الطالب بكل محاضرة، عشان يكمل من نفس المكان ولو من جهاز ثاني
  if (path === "progress" && req.method === "POST") {
    const s = await session(req, env);
    const b = await body(req);
    const pos = Math.max(0, Math.floor(Number(b.pos) || 0));
    const v = await env.DB.prepare("SELECT id FROM videos WHERE id = ?").bind(String(b.video || "")).first();
    if (!v) throw new Fail(404, "none", "مو موجود.");
    await env.DB.prepare("INSERT INTO progress (user_id, video_id, pos, at) VALUES (?, ?, ?, ?) ON CONFLICT (user_id, video_id) DO UPDATE SET pos = excluded.pos, at = excluded.at").bind(s.user_id, v.id, pos, now()).run();
    const a = await env.DB.prepare("SELECT token FROM active WHERE user_id = ?").bind(s.user_id).first();
    if (a && a.token !== s.token) return {ok: true, stop: "حسابك قاعد يشغّل محاضرة على جهاز ثاني، فوقّفناها هني. اضغط تشغيل لو تبي تكمل من هالجهاز."};
    return {ok: true};
  }
  throw new Fail(404, "none", "مو موجود.");
}

async function login(env, req, phone, password, device) {
  device = String(device || "").slice(0, 64);
  if (!phone || !password || device.length < 8) throw new Fail(400, "bad", "اكتب رقم جوالك وكلمة السر.");
  const u = await env.DB.prepare("SELECT id, name, phone, pass, status FROM users WHERE phone = ?").bind(phone).first();
  if (!u || !(await checkPass(password, u.pass))) throw new Fail(401, "wrong", "رقم الجوال أو كلمة السر غلط.");
  if (u.status === "blocked") throw new Fail(403, "blocked", "حسابك موقوف، تواصل معنا بالواتساب.");
  // الأجهزة تنقفل على الحساب: تسجيل الخروج ما يفكها، بس الإدارة تصفّرها
  const ua = (req.headers.get("User-Agent") || "").slice(0, 200);
  const known = await env.DB.prepare("SELECT 1 FROM devices WHERE user_id = ? AND device = ?").bind(u.id, device).first();
  if (!known) {
    const {n} = await env.DB.prepare("SELECT COUNT(*) AS n FROM devices WHERE user_id = ?").bind(u.id).first();
    if (n >= MAX_DEVICES) {
      await env.DB.prepare("INSERT INTO attempts (user_id, device, ua, at) VALUES (?, ?, ?, ?)").bind(u.id, device, ua, now()).run();
      throw new Fail(403, "devices", `حسابك مسجّل على جهازين، وهذا أقصى شي. لو غيّرت جهازك كلمنا بالواتساب ونصفّر لك الأجهزة.`);
    }
    await env.DB.prepare("INSERT INTO devices (user_id, device, ua, first, last) VALUES (?, ?, ?, ?, ?)").bind(u.id, device, ua, now(), now()).run();
  } else {
    await env.DB.prepare("UPDATE devices SET last = ?, ua = ? WHERE user_id = ? AND device = ?").bind(now(), ua, u.id, device).run();
  }
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND (device = ? OR seen < ?)").bind(u.id, device, now() - SESSION_DAYS * 86400).run();
  const token = rand(32);
  await env.DB.prepare("INSERT INTO sessions (token, user_id, device, ua, created, seen) VALUES (?, ?, ?, ?, ?, ?)").bind(await sha256(token), u.id, device, ua, now(), now()).run();
  return {token, user: {name: u.name, phone: u.phone, status: u.status}};
}

// ===== Cloudflare Stream =====

async function cf(env, path, init = {}) {
  const r = await fetch(`${env.CF_API_BASE || "https://api.cloudflare.com/client/v4"}/accounts/${env.CF_ACCOUNT_ID}/stream${path}`, {...init, headers: {Authorization: `Bearer ${env.CF_API_TOKEN}`, ...(init.headers || {})}});
  return r;
}

// رابط مشاهدة موقّع (JWT) نسويه هني بمفتاح Stream، بدون ما نكلم Cloudflare كل مرة
let signKey = null;
async function streamToken(env, uid, exp) {
  if (!env.STREAM_KEY_ID || !env.STREAM_KEY_JWK) throw new Fail(503, "setup", "المحاضرات للحين تتجهز، جرّب بعد شوي.");
  signKey ||= await crypto.subtle.importKey("jwk", JSON.parse(atob(env.STREAM_KEY_JWK)), {name: "RSASSA-PKCS1-v1_5", hash: "SHA-256"}, false, ["sign"]);
  const part = o => b64u(enc.encode(JSON.stringify(o)));
  const head = part({alg: "RS256", kid: env.STREAM_KEY_ID}), load = part({sub: uid, kid: env.STREAM_KEY_ID, exp, nbf: now() - 60});
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", signKey, enc.encode(`${head}.${load}`));
  return `${head}.${load}.${b64u(sig)}`;
}

// الفيديو بعد الرفع ياخذ شوي وقت لين Cloudflare يجهّزه بكل الجودات، فنشيّك عليه
async function refreshPending(env, codes) {
  const q = codes ? ` AND course IN (${codes.map(() => "?").join(",")})` : "";
  const {results} = await env.DB.prepare(`SELECT id FROM videos WHERE ready = 0 AND created > ?${q} LIMIT 10`).bind(now() - 7 * 86400, ...(codes || [])).all();
  await Promise.all(results.map(async v => {
    const r = await cf(env, `/${v.id}`).catch(() => null);
    if (!r || !r.ok) return;
    const {result: x} = await r.json();
    if (x.status?.state === "error") return env.DB.prepare("UPDATE videos SET ready = -1 WHERE id = ?").bind(v.id).run();
    if (!x.readyToStream || !x.playback?.hls) return;
    await env.DB.prepare("UPDATE videos SET ready = 1, host = ?, duration = ?, size = ? WHERE id = ?").bind(new URL(x.playback.hls).origin, Math.round(x.duration || 0), x.size || 0, v.id).run();
  }));
}

// ===== لوحة الإدارة =====

async function admin(req, env, url, path) {
  const pass = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  await limit(env, req, "admin", "ADMIN_LIMITER");
  if (!env.ADMIN_PASSWORD || !pass || !sameText(pass, env.ADMIN_PASSWORD)) throw new Fail(401, "admin", "كلمة سر الإدارة غلط.");

  // ملخص الداشبورد
  if (path === "stats" && req.method === "GET") {
    const t = now(), wk = t - 7 * 86400, mo = t - 30 * 86400;
    const one = (q, ...a) => env.DB.prepare(q).bind(...a).first();
    const [st, exp, vw, vids, act] = await Promise.all([
      env.DB.prepare("SELECT status, COUNT(*) AS n FROM users GROUP BY status").all(),
      env.DB.prepare("SELECT u.id, u.name, u.phone, a.course, a.until FROM access a JOIN users u ON u.id = a.user_id WHERE u.status = 'active' AND a.until > ? AND a.until < ? ORDER BY a.until LIMIT 30").bind(t, t + 14 * 86400).all(),
      one("SELECT SUM(at > ?) AS week, SUM(at > ?) AS month, COUNT(*) AS total, COUNT(DISTINCT CASE WHEN at > ? THEN user_id END) AS watchers FROM views", wk, mo, wk),
      one("SELECT COUNT(*) AS n, SUM(ready = 0) AS processing, SUM(duration) AS secs FROM videos"),
      one("SELECT COUNT(*) AS n FROM users WHERE created > ?", wk),
    ]);
    const {results: top} = await env.DB.prepare("SELECT v.course, v.title, COUNT(w.at) AS n FROM views w JOIN videos v ON v.id = w.video_id WHERE w.at > ? GROUP BY v.id ORDER BY n DESC LIMIT 5").bind(mo).all();
    const {results: byCourse} = await env.DB.prepare("SELECT a.course, COUNT(*) AS n FROM access a JOIN users u ON u.id = a.user_id WHERE u.status = 'active' AND a.until > ? GROUP BY a.course ORDER BY n DESC").bind(t).all();
    const {results: sharing} = await env.DB.prepare("SELECT u.id, u.name, u.phone, COUNT(*) AS n, MAX(t.at) AS last FROM attempts t JOIN users u ON u.id = t.user_id WHERE t.at > ? GROUP BY u.id ORDER BY n DESC LIMIT 20").bind(t - 30 * 86400).all();
    const {results: daily} = await env.DB.prepare("SELECT (at + 10800) / 86400 AS d, COUNT(*) AS n FROM views WHERE at > ? GROUP BY d ORDER BY d").bind(t - 14 * 86400).all();
    const count = Object.fromEntries(st.results.map(r => [r.status, r.n]));
    return {
      users: {pending: count.pending || 0, active: count.active || 0, blocked: count.blocked || 0, newWeek: act?.n || 0},
      views: {week: vw?.week || 0, month: vw?.month || 0, total: vw?.total || 0, watchersWeek: vw?.watchers || 0},
      videos: {count: vids?.n || 0, processing: vids?.processing || 0, hours: Math.round((vids?.secs || 0) / 360) / 10},
      expiring: exp.results, top, byCourse, sharing,
      daily: daily.map(r => ({day: r.d * 86400, n: r.n})),
    };
  }

  if (path === "users" && req.method === "GET") {
    const {results: users} = await env.DB.prepare("SELECT id, name, phone, email, status, note, created FROM users ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created DESC").all();
    const {results: access} = await env.DB.prepare("SELECT user_id, course, until FROM access").all();
    const {results: devs} = await env.DB.prepare("SELECT user_id, COUNT(*) AS n, MAX(last) AS seen FROM devices GROUP BY user_id").all();
    const {results: tries} = await env.DB.prepare("SELECT user_id, COUNT(*) AS n FROM attempts WHERE at > ? GROUP BY user_id").bind(now() - 30 * 86400).all();
    const {results: views} = await env.DB.prepare("SELECT user_id, COUNT(*) AS n FROM views GROUP BY user_id").all();
    return {users: users.map(u => ({
      ...u,
      access: access.filter(a => a.user_id === u.id).map(a => ({course: a.course, until: a.until})),
      devices: devs.find(d => d.user_id === u.id)?.n || 0,
      seen: devs.find(d => d.user_id === u.id)?.seen || null,
      views: views.find(x => x.user_id === u.id)?.n || 0,
      attempts: tries.find(x => x.user_id === u.id)?.n || 0,
    }))};
  }

  if (path === "user" && req.method === "POST") {
    const b = await body(req);
    const id = Number(b.id);
    if (!(await env.DB.prepare("SELECT 1 FROM users WHERE id = ?").bind(id).first())) throw new Fail(404, "none", "الطالب مو موجود.");
    if (b.delete) {
      await env.DB.batch(["DELETE FROM sessions WHERE user_id = ?", "DELETE FROM devices WHERE user_id = ?", "DELETE FROM attempts WHERE user_id = ?", "DELETE FROM active WHERE user_id = ?", "DELETE FROM progress WHERE user_id = ?", "DELETE FROM access WHERE user_id = ?", "DELETE FROM views WHERE user_id = ?", "DELETE FROM users WHERE id = ?"].map(q => env.DB.prepare(q).bind(id)));
      return {ok: true};
    }
    const q = [];
    if (["pending", "active", "blocked"].includes(b.status)) q.push(env.DB.prepare("UPDATE users SET status = ? WHERE id = ?").bind(b.status, id));
    if (b.status === "blocked" || b.resetDevices) q.push(env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id));
    if (b.resetDevices) q.push(env.DB.prepare("DELETE FROM devices WHERE user_id = ?").bind(id), env.DB.prepare("DELETE FROM attempts WHERE user_id = ?").bind(id));
    if (typeof b.note === "string") q.push(env.DB.prepare("UPDATE users SET note = ? WHERE id = ?").bind(b.note.slice(0, 300), id));
    if (typeof b.password === "string" && b.password) {
      if (b.password.length < 6) throw new Fail(400, "password", "كلمة السر لازم تكون 6 بالأقل.");
      q.push(env.DB.prepare("UPDATE users SET pass = ? WHERE id = ?").bind(await hashPass(b.password), id));
      q.push(env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id));
    }
    if (Array.isArray(b.access)) {
      q.push(env.DB.prepare("DELETE FROM access WHERE user_id = ?").bind(id));
      for (const a of b.access) {
        const c = cleanCourse(a.course), until = Number(a.until);
        if (c && until > 0) q.push(env.DB.prepare("INSERT OR REPLACE INTO access (user_id, course, until) VALUES (?, ?, ?)").bind(id, c, until));
      }
    }
    if (q.length) await env.DB.batch(q);
    return {ok: true};
  }

  if (path === "videos" && req.method === "GET") {
    await refreshPending(env);
    const {results} = await env.DB.prepare("SELECT v.id, v.course, v.title, v.sort, v.size, v.duration, v.ready, v.created, (SELECT COUNT(*) FROM views w WHERE w.video_id = v.id) AS views FROM videos v ORDER BY v.course, v.sort, v.created").all();
    return {videos: results};
  }

  if (path === "video" && req.method === "POST") {
    const b = await body(req);
    const v = await env.DB.prepare("SELECT id FROM videos WHERE id = ?").bind(String(b.id || "")).first();
    if (!v) throw new Fail(404, "none", "الفيديو مو موجود.");
    if (b.delete) {
      const r = await cf(env, `/${v.id}`, {method: "DELETE"});
      if (!r.ok && r.status !== 404) throw new Fail(502, "cf", "ما قدرنا نحذفه من Cloudflare، جرّب مرة ثانية.");
      await env.DB.batch(["DELETE FROM videos WHERE id = ?", "DELETE FROM views WHERE video_id = ?", "DELETE FROM progress WHERE video_id = ?"].map(q => env.DB.prepare(q).bind(v.id)));
      return {ok: true};
    }
    const title = String(b.title || "").trim().slice(0, 150), course = cleanCourse(b.course);
    if (!title || !course) throw new Fail(400, "bad", "اكتب عنوان المحاضرة ورمز المادة.");
    await env.DB.prepare("UPDATE videos SET title = ?, course = ?, sort = ? WHERE id = ?").bind(title, course, Number(b.sort) || 0, v.id).run();
    return {ok: true};
  }

  // الرفع (tus): المتصفح يطلب هني رابط رفع، وبعدها يرفع الفيديو على طول لـ Cloudflare على أجزاء.
  // لو انقطع النت أو تسكرت الصفحة، يكمل من نفس المكان.
  if (path === "upload" && req.method === "POST") {
    const title = String(url.searchParams.get("title") || "").trim().slice(0, 150), course = cleanCourse(url.searchParams.get("course"));
    const size = Number(req.headers.get("Upload-Length") || 0);
    if (!title || !course) throw new Fail(400, "bad", "اكتب عنوان المحاضرة ورمز المادة.");
    if (!size) throw new Fail(400, "bad", "الملف فاضي.");
    const b64 = t => btoa(String.fromCharCode(...enc.encode(t)));
    const r = await cf(env, "?direct_user=true", {method: "POST", headers: {
      "Tus-Resumable": "1.0.0", "Upload-Length": String(size),
      "Upload-Metadata": `name ${b64(`${course} · ${title}`)},requiresignedurls,maxDurationSeconds ${b64(String(MAX_HOURS * 3600))}`,
    }});
    const uid = r.headers.get("stream-media-id"), loc = r.headers.get("Location");
    if (!r.ok || !uid || !loc) { console.error("stream upload", r.status, await r.text().catch(() => "")); throw new Fail(502, "cf", "Cloudflare ما رد، تأكد إن Stream مفعّل وجرّب مرة ثانية."); }
    await env.DB.prepare("INSERT INTO videos (id, course, title, sort, size, ready, created) VALUES (?, ?, ?, ?, ?, 0, ?)").bind(uid, course, title, Number(url.searchParams.get("sort")) || 0, size, now()).run();
    return new Response(null, {status: 201, headers: {"Location": loc, "Tus-Resumable": "1.0.0", "stream-media-id": uid}});
  }

  throw new Fail(404, "none", "مو موجود.");
}
