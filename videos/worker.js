// خادم المحاضرات المحمية على Cloudflare Workers.
// - الطالب يسجّل من asckwt.com/watch، وحسابه يكون "بانتظار التفعيل" لين تفعّله من لوحة الإدارة وتحدد له مواده وتاريخ انتهاء اشتراكه.
// - الفيديوهات محفوظة في R2 (مو عامة)، وكل مشاهدة تاخذ رابط موقّع خاص بالطالب يشتغل 4 ساعات بس.
// - كل حساب يشتغل على جهازين بالكثير، عشان ما ينشر الطالب حسابه.
// الأسرار في Cloudflare: ADMIN_PASSWORD (كلمة سر لوحة الإدارة) و SIGNING_KEY (مفتاح توقيع الروابط).

const ORIGINS = ["https://www.asckwt.com", "https://asckwt.com"];
const MAX_DEVICES = 2;
const LINK_HOURS = 4;
const SESSION_DAYS = 60;
const PBKDF2_ROUNDS = 100000;
const MAX_PART = 95 * 1024 * 1024;

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

async function sign(env, text) {
  const key = await crypto.subtle.importKey("raw", enc.encode(env.SIGNING_KEY || env.ADMIN_PASSWORD || ""), {name: "HMAC", hash: "SHA-256"}, false, ["sign"]);
  return b64u(await crypto.subtle.sign("HMAC", key, enc.encode(text)));
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
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
      "X-Content-Type-Options": "nosniff",
    };

    // تشغيل الفيديو نفسه: رابط موقّع، يشتغل من أي مكان لين ينتهي وقته
    if (url.pathname.startsWith("/v/")) return stream(req, env, url);

    if (req.method === "OPTIONS") return new Response(null, {headers: h});
    if (!url.pathname.startsWith("/api/")) return new Response("asc-videos", {headers: h});
    if (!okOrigin) return new Response("forbidden", {status: 403});

    const json = (data, status = 200) => new Response(JSON.stringify(data), {status, headers: {...h, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store"}});
    try {
      const path = url.pathname.slice(5);
      if (path.startsWith("admin/")) return json(await admin(req, env, url, path.slice(6)));
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

async function limit(env, req, what) {
  if (!env.LIMITER) return;
  const ip = req.headers.get("CF-Connecting-IP") || "local";
  const {success} = await env.LIMITER.limit({key: `${what}:${ip}`});
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
  const {results: vids} = await env.DB.prepare(`SELECT id, course, title FROM videos WHERE ready = 1 AND course IN (${codes.map(() => "?").join(",")}) ORDER BY course, sort, created`).bind(...codes).all();
  return access.map(a => ({code: a.course, until: a.until, videos: vids.filter(v => v.course === a.course).map(v => ({id: v.id, title: v.title}))}));
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
    const v = await env.DB.prepare("SELECT v.id FROM videos v JOIN access a ON a.course = v.course WHERE v.id = ? AND v.ready = 1 AND a.user_id = ? AND a.until > ?").bind(String(video || ""), s.user_id, now()).first();
    if (!v) throw new Fail(403, "noaccess", "هالمحاضرة مو ضمن اشتراكك.");
    await env.DB.prepare("INSERT INTO views (user_id, video_id, at) VALUES (?, ?, ?)").bind(s.user_id, v.id, now()).run();
    const exp = now() + LINK_HOURS * 3600;
    const sig = await sign(env, `${v.id}|${s.user_id}|${exp}`);
    return {url: `${url.origin}/v/${v.id}?u=${s.user_id}&e=${exp}&s=${sig}`, mark: `${s.name} · ${s.phone}`};
  }
  throw new Fail(404, "none", "مو موجود.");
}

async function login(env, req, phone, password, device) {
  device = String(device || "").slice(0, 64);
  if (!phone || !password || device.length < 8) throw new Fail(400, "bad", "اكتب رقم جوالك وكلمة السر.");
  const u = await env.DB.prepare("SELECT id, name, phone, pass, status FROM users WHERE phone = ?").bind(phone).first();
  if (!u || !(await checkPass(password, u.pass))) throw new Fail(401, "wrong", "رقم الجوال أو كلمة السر غلط.");
  if (u.status === "blocked") throw new Fail(403, "blocked", "حسابك موقوف، تواصل معنا بالواتساب.");
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND (device = ? OR seen < ?)").bind(u.id, device, now() - SESSION_DAYS * 86400).run();
  const {n} = await env.DB.prepare("SELECT COUNT(DISTINCT device) AS n FROM sessions WHERE user_id = ?").bind(u.id).first();
  if (n >= MAX_DEVICES) throw new Fail(403, "devices", `حسابك مفتوح على جهازين، وهذا أقصى شي. سجّل خروج من جهاز ثاني أو تواصل معنا بالواتساب نصفّر لك الأجهزة.`);
  const token = rand(32);
  await env.DB.prepare("INSERT INTO sessions (token, user_id, device, ua, created, seen) VALUES (?, ?, ?, ?, ?, ?)").bind(await sha256(token), u.id, device, (req.headers.get("User-Agent") || "").slice(0, 200), now(), now()).run();
  return {token, user: {name: u.name, phone: u.phone, status: u.status}};
}

// ===== تشغيل الفيديو =====

async function stream(req, env, url) {
  if (req.method !== "GET" && req.method !== "HEAD") return new Response(null, {status: 405});
  const id = url.pathname.slice(3);
  const u = url.searchParams.get("u"), e = Number(url.searchParams.get("e")), s = url.searchParams.get("s") || "";
  const deny = msg => new Response(msg, {status: 403, headers: {"Cache-Control": "no-store"}});
  if (!e || e < now()) return deny("expired");
  if (!sameText(await sign(env, `${id}|${u}|${e}`), s)) return deny("bad link");
  const v = await env.DB.prepare("SELECT r2key, type FROM videos WHERE id = ? AND ready = 1").bind(id).first();
  if (!v) return new Response("not found", {status: 404});
  const obj = req.method === "HEAD" ? await env.VIDEOS.head(v.r2key) : await env.VIDEOS.get(v.r2key, {range: req.headers, onlyIf: req.headers});
  if (!obj) return new Response("not found", {status: 404});
  const h = new Headers();
  obj.writeHttpMetadata(h);
  h.set("Content-Type", v.type || "video/mp4");
  h.set("ETag", obj.httpEtag);
  h.set("Accept-Ranges", "bytes");
  h.set("Cache-Control", "private, no-store");
  h.set("Content-Disposition", "inline");
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Cross-Origin-Resource-Policy", "cross-origin");
  if (req.method === "HEAD") { h.set("Content-Length", obj.size); return new Response(null, {headers: h}); }
  if (!("body" in obj)) return new Response(null, {status: 304, headers: h});
  if (req.headers.has("Range") && obj.range) {
    const start = obj.range.offset ?? 0, len = obj.range.length ?? obj.size - start;
    h.set("Content-Range", `bytes ${start}-${start + len - 1}/${obj.size}`);
    h.set("Content-Length", len);
    return new Response(obj.body, {status: 206, headers: h});
  }
  h.set("Content-Length", obj.size);
  return new Response(obj.body, {headers: h});
}

// ===== لوحة الإدارة =====

async function admin(req, env, url, path) {
  const pass = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  await limit(env, req, "admin");
  if (!env.ADMIN_PASSWORD || !pass || !sameText(pass, env.ADMIN_PASSWORD)) throw new Fail(401, "admin", "كلمة سر الإدارة غلط.");

  if (path === "users" && req.method === "GET") {
    const {results: users} = await env.DB.prepare("SELECT id, name, phone, email, status, note, created FROM users ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created DESC").all();
    const {results: access} = await env.DB.prepare("SELECT user_id, course, until FROM access").all();
    const {results: devs} = await env.DB.prepare("SELECT user_id, COUNT(DISTINCT device) AS n, MAX(seen) AS seen FROM sessions GROUP BY user_id").all();
    const {results: views} = await env.DB.prepare("SELECT user_id, COUNT(*) AS n FROM views GROUP BY user_id").all();
    return {users: users.map(u => ({
      ...u,
      access: access.filter(a => a.user_id === u.id).map(a => ({course: a.course, until: a.until})),
      devices: devs.find(d => d.user_id === u.id)?.n || 0,
      seen: devs.find(d => d.user_id === u.id)?.seen || null,
      views: views.find(x => x.user_id === u.id)?.n || 0,
    }))};
  }

  if (path === "user" && req.method === "POST") {
    const b = await body(req);
    const id = Number(b.id);
    if (!(await env.DB.prepare("SELECT 1 FROM users WHERE id = ?").bind(id).first())) throw new Fail(404, "none", "الطالب مو موجود.");
    if (b.delete) {
      await env.DB.batch(["DELETE FROM sessions WHERE user_id = ?", "DELETE FROM access WHERE user_id = ?", "DELETE FROM views WHERE user_id = ?", "DELETE FROM users WHERE id = ?"].map(q => env.DB.prepare(q).bind(id)));
      return {ok: true};
    }
    const q = [];
    if (["pending", "active", "blocked"].includes(b.status)) q.push(env.DB.prepare("UPDATE users SET status = ? WHERE id = ?").bind(b.status, id));
    if (b.status === "blocked" || b.resetDevices) q.push(env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id));
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
    const {results} = await env.DB.prepare("SELECT v.id, v.course, v.title, v.sort, v.size, v.ready, v.created, (SELECT COUNT(*) FROM views w WHERE w.video_id = v.id) AS views FROM videos v ORDER BY v.course, v.sort, v.created").all();
    return {videos: results};
  }

  if (path === "video" && req.method === "POST") {
    const b = await body(req);
    const v = await env.DB.prepare("SELECT id, r2key FROM videos WHERE id = ?").bind(String(b.id || "")).first();
    if (!v) throw new Fail(404, "none", "الفيديو مو موجود.");
    if (b.delete) {
      await env.VIDEOS.delete(v.r2key);
      await env.DB.batch([env.DB.prepare("DELETE FROM videos WHERE id = ?").bind(v.id), env.DB.prepare("DELETE FROM views WHERE video_id = ?").bind(v.id)]);
      return {ok: true};
    }
    const title = String(b.title || "").trim().slice(0, 150), course = cleanCourse(b.course);
    if (!title || !course) throw new Fail(400, "bad", "اكتب عنوان المحاضرة ورمز المادة.");
    await env.DB.prepare("UPDATE videos SET title = ?, course = ?, sort = ? WHERE id = ?").bind(title, course, Number(b.sort) || 0, v.id).run();
    return {ok: true};
  }

  // الرفع على أجزاء (كل جزء أقل من 95 ميغا) عشان الفيديوهات الكبيرة تنرفع من المتصفح
  if (path === "upload/start" && req.method === "POST") {
    const b = await body(req);
    const title = String(b.title || "").trim().slice(0, 150), course = cleanCourse(b.course);
    const type = /^video\/[\w.+-]+$/.test(b.type || "") ? b.type : "video/mp4";
    if (!title || !course) throw new Fail(400, "bad", "اكتب عنوان المحاضرة ورمز المادة.");
    const id = rand(9);
    const r2key = `${course}/${id}`;
    const up = await env.VIDEOS.createMultipartUpload(r2key, {httpMetadata: {contentType: type}});
    await env.DB.prepare("INSERT INTO videos (id, course, title, sort, r2key, size, type, ready, created) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)").bind(id, course, title, Number(b.sort) || 0, r2key, Number(b.size) || 0, type, now()).run();
    return {id, uploadId: up.uploadId};
  }
  if (path === "upload/part" && req.method === "PUT") {
    const v = await env.DB.prepare("SELECT r2key FROM videos WHERE id = ? AND ready = 0").bind(url.searchParams.get("id") || "").first();
    if (!v) throw new Fail(404, "none", "الرفع مو موجود.");
    const n = Number(url.searchParams.get("n"));
    const size = Number(req.headers.get("Content-Length") || 0);
    if (!(n >= 1 && n <= 10000) || !size || size > MAX_PART) throw new Fail(400, "bad", "جزء غلط.");
    const part = await env.VIDEOS.resumeMultipartUpload(v.r2key, url.searchParams.get("uploadId") || "").uploadPart(n, req.body);
    return {partNumber: part.partNumber, etag: part.etag};
  }
  if (path === "upload/done" && req.method === "POST") {
    const b = await body(req);
    const v = await env.DB.prepare("SELECT r2key FROM videos WHERE id = ? AND ready = 0").bind(String(b.id || "")).first();
    if (!v) throw new Fail(404, "none", "الرفع مو موجود.");
    const up = env.VIDEOS.resumeMultipartUpload(v.r2key, String(b.uploadId || ""));
    if (b.abort) {
      await up.abort().catch(() => {});
      await env.DB.prepare("DELETE FROM videos WHERE id = ?").bind(b.id).run();
      return {ok: true};
    }
    const obj = await up.complete((b.parts || []).map(p => ({partNumber: Number(p.partNumber), etag: String(p.etag)})));
    await env.DB.prepare("UPDATE videos SET ready = 1, size = ? WHERE id = ?").bind(obj.size, b.id).run();
    return {ok: true};
  }

  throw new Fail(404, "none", "مو موجود.");
}
