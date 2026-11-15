// خادم المحاضرات المحمية على Cloudflare Workers.
// - الطالب يسجّل من asckwt.com/watch، وحسابه يكون "بانتظار التفعيل" لين تفعّله من لوحة الإدارة وتحدد له مواده وتاريخ انتهاء اشتراكه.
// - الفيديوهات على Cloudflare Stream (مو عامة): تنرفع من لوحة الإدارة على طول لـ Cloudflare، وتشتغل بجودة تتغير حسب نت الطالب.
// - كل مشاهدة تاخذ رابط موقّع خاص يشتغل 4 ساعات بس، ويتجدد بروحه.
// - كل حساب يشتغل على جهازين بالكثير، عشان ما ينشر الطالب حسابه.
// الأسرار في Cloudflare: ADMIN_PASSWORD (كلمة سر لوحة الإدارة)، CF_API_TOKEN و CF_ACCOUNT_ID (للكلام مع Stream)،
// و STREAM_KEY_ID و STREAM_KEY_JWK (مفتاح توقيع روابط المشاهدة). كلها تنحط تلقائياً من GitHub.

const ORIGINS = ["https://www.asckwt.com", "https://asckwt.com"];
const MAX_DEVICES = 2;
const LINK_MINUTES = 30; // رابط المشاهدة قصير عشان لو أحد نسخه ما يفيده، والمشغّل يجدده بروحه
const ADMIN_HOURS = 12;
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
// رمز المادة مع الجامعة، مثل AOU-B326
const cleanCourse = c => String(c || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 24);
const cleanCode = c => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);

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

    const json = (data, status = 200, cache = "no-store") => new Response(JSON.stringify(data), {status, headers: {...h, "Content-Type": "application/json; charset=utf-8", "Cache-Control": cache}});
    try {
      const path = url.pathname.slice(5);
      if (path.startsWith("admin/")) {
        const r = await admin(req, env, url, path.slice(6));
        return r instanceof Response ? new Response(r.body, {status: r.status, headers: {...h, ...Object.fromEntries(r.headers)}}) : json(r);
      }
      // الكتالوج عام ونفس الشي للكل، فيتخزن دقيقة بالمتصفح وبالذاكرة
      if (path === "catalog" && req.method === "GET") return json(await catalog(env), 200, "public, max-age=60");
      if (path === "course" && req.method === "GET") return json(await coursePage(env, cleanCourse(url.searchParams.get("id"))), 200, "public, max-age=60");
      if (path === "doctor" && req.method === "GET") return json(await doctorPage(env, Number(url.searchParams.get("id"))), 200, "public, max-age=60");
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
  const chaps = await chaptersFor(env, vids.map(v => v.id));
  return access.map(a => ({code: a.course, until: a.until, videos: vids.filter(v => v.course === a.course).map(v => ({id: v.id, title: v.title, duration: v.duration || 0, pos: v.pos || 0, chapters: chaps[v.id] || []}))}));
}
async function chaptersFor(env, ids) {
  const out = {};
  for (let i = 0; i < ids.length; i += 50) {
    const part = ids.slice(i, i + 50);
    if (!part.length) break;
    const {results} = await env.DB.prepare(`SELECT video_id, t, title FROM chapters WHERE video_id IN (${part.map(() => "?").join(",")}) ORDER BY t`).bind(...part).all();
    results.forEach(c => (out[c.video_id] ||= []).push({t: c.t, title: c.title}));
  }
  return out;
}

async function student(req, env, url, path) {
  if (path === "signup" && req.method === "POST") {
    await limit(env, req, "signup");
    const b = await body(req);
    const clean = t => String(t || "").trim().replace(/\s+/g, " ").slice(0, 40);
    // الاسم الأول واسم العائلة (والصفحة القديمة ترسل الاسم كامل)
    const name = (b.first !== undefined ? `${clean(b.first)} ${clean(b.family)}` : clean(String(b.name || "").slice(0, 80))).trim();
    const phone = cleanPhone(b.phone);
    const email = String(b.email || "").trim().toLowerCase().slice(0, 120);
    const password = String(b.password || "");
    if (b.first !== undefined ? clean(b.first).length < 2 || clean(b.family).length < 2 : name.length < 3) throw new Fail(400, "name", "اكتب اسمك الأول واسم العائلة.");
    if (!phone) throw new Fail(400, "phone", "رقم الجوال مو صحيح.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Fail(400, "email", "اكتب إيميل صحيح، عليه توصلك الفواتير واسترجاع كلمة السر.");
    let uni = null, major = null;
    if (b.uni) {
      uni = (await env.DB.prepare("SELECT id FROM universities WHERE id = ? AND visible = 1").bind(String(b.uni)).first())?.id;
      if (!uni) throw new Fail(400, "uni", "اختار جامعتك.");
      if (b.major) {
        major = (await env.DB.prepare("SELECT id FROM majors WHERE id = ? AND uni = ?").bind(Number(b.major), uni).first())?.id;
        if (!major) throw new Fail(400, "major", "اختار تخصصك.");
      }
    }
    if (password.length < 6) throw new Fail(400, "password", "كلمة السر لازم تكون 6 حروف أو أرقام بالأقل.");
    if (await env.DB.prepare("SELECT 1 FROM users WHERE phone = ?").bind(phone).first()) throw new Fail(409, "exists", "هالرقم مسجّل من قبل، سجّل دخولك.");
    await env.DB.prepare("INSERT INTO users (name, phone, email, uni, major, pass, status, created) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)").bind(name, phone, email, uni, major, await hashPass(password), now()).run();
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
    const courses = s.status === "active" ? await myCourses(env, s.user_id) : [];
    // روابط القروبات الخاصة تطلع بس للمشترك بالمادة
    let groups = [];
    if (courses.length && (await growth(env)).privateGroups.on) {
      const ids = courses.map(c => c.code);
      groups = (await env.DB.prepare(`SELECT ref AS course, title, url FROM wa_groups WHERE private = 1 AND scope = 'course' AND ref IN (${ids.map(() => "?").join(",")}) ORDER BY sort`).bind(...ids).all()).results;
    }
    return {user: {name: s.name, phone: s.phone, status: s.status}, courses, groups};
  }
  if (path === "play" && req.method === "POST") {
    const s = await session(req, env);
    if (s.status !== "active") throw new Fail(403, "pending", "حسابك للحين مو مفعّل.");
    const {video, renew} = await body(req);
    const v = await env.DB.prepare("SELECT v.id, v.host FROM videos v JOIN access a ON a.course = v.course WHERE v.id = ? AND v.ready = 1 AND a.user_id = ? AND a.until > ?").bind(String(video || ""), s.user_id, now()).first();
    if (!v) throw new Fail(403, "noaccess", "هالمحاضرة مو ضمن اشتراكك.");
    await env.DB.batch([
      // تجديد الرابط مو مشاهدة جديدة
      renew ? env.DB.prepare("SELECT 1") : env.DB.prepare("INSERT INTO views (user_id, video_id, at) VALUES (?, ?, ?)").bind(s.user_id, v.id, now()),
      // فيديو واحد بنفس الوقت: هالجهاز صار هو اللي يشغّل، وأي جهاز ثاني يوقف
      env.DB.prepare("INSERT INTO active (user_id, token, at) VALUES (?, ?, ?) ON CONFLICT (user_id) DO UPDATE SET token = excluded.token, at = excluded.at").bind(s.user_id, s.token, now()),
    ]);
    const token = await streamToken(env, v.id, now() + LINK_MINUTES * 60);
    return {url: `${v.host}/${token}/manifest/video.m3u8`, mark: `${s.name} · ${s.phone}`, ttl: LINK_MINUTES * 60};
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
  // المحاضرة المجانية (أول محاضرة بكل مادة، أو المحاضرة التجريبية للدكتور): تشتغل بدون اشتراك ولا حساب
  if (path === "preview" && req.method === "POST") {
    await limit(env, req, "preview");
    const {video} = await body(req);
    const v = await env.DB.prepare("SELECT id, host, course FROM videos WHERE id = ? AND ready = 1").bind(String(video || "")).first();
    if (!v || !(await isFree(env, v))) throw new Fail(403, "noaccess", "هالمحاضرة للمشتركين بس.");
    const token = await streamToken(env, v.id, now() + LINK_MINUTES * 60);
    return {url: `${v.host}/${token}/manifest/video.m3u8`, mark: "asckwt.com", ttl: LINK_MINUTES * 60, chapters: (await chaptersFor(env, [v.id]))[v.id] || []};
  }
  // التقييم: للطالب اللي اشترك بالمادة (حتى لو خلص اشتراكه). نجمتين أو أقل يتراجع قبل لا ينشر
  if (path === "rate" && req.method === "POST") {
    const s = await session(req, env);
    await limit(env, req, "rate");
    const b = await body(req);
    const course = cleanCourse(b.course), stars = Math.round(Number(b.stars));
    if (!(stars >= 1 && stars <= 5)) throw new Fail(400, "stars", "اختار عدد النجوم.");
    if (!(await env.DB.prepare("SELECT 1 FROM access WHERE user_id = ? AND course = ?").bind(s.user_id, course).first())) throw new Fail(403, "noaccess", "التقييم للمشتركين بالمادة بس.");
    const tags = (Array.isArray(b.tags) ? b.tags : []).filter(t => TAGS.includes(t)).slice(0, 6);
    const comment = String(b.comment || "").trim().replace(/\s+/g, " ").slice(0, 500) || null;
    const status = stars <= 2 ? "pending" : "published";
    await env.DB.prepare("INSERT INTO ratings (user_id, course, stars, tags, comment, status, created) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (user_id, course) DO UPDATE SET stars = excluded.stars, tags = excluded.tags, comment = excluded.comment, status = excluded.status, reply = NULL, created = excluded.created").bind(s.user_id, course, stars, JSON.stringify(tags), comment, status, now()).run();
    return {ok: true, status};
  }
  if (path === "ticket" && req.method === "POST") {
    const s = await session(req, env);
    await limit(env, req, "ticket");
    const b = await body(req);
    const kind = String(b.kind || ""), message = String(b.message || "").trim().slice(0, 2000);
    if (!KINDS.includes(kind)) throw new Fail(400, "kind", "اختار نوع الرسالة.");
    if (message.length < 5) throw new Fail(400, "message", "اكتب رسالتك.");
    const course = b.course ? cleanCourse(b.course) : null;
    const {n} = await env.DB.prepare("SELECT COUNT(*) AS n FROM tickets WHERE user_id = ? AND status != 'solved'").bind(s.user_id).first();
    if (n >= 5) throw new Fail(429, "many", "عندك 5 رسائل للحين ما انحلت، انتظر نرد عليهم.");
    const {id} = await env.DB.prepare("INSERT INTO tickets (user_id, kind, course, message, created, updated) VALUES (?, ?, ?, ?, ?, ?) RETURNING id").bind(s.user_id, kind, course, message, now(), now()).first();
    return {ok: true, id};
  }
  if (path === "tickets" && req.method === "GET") {
    const s = await session(req, env);
    const {results} = await env.DB.prepare("SELECT id, kind, course, message, status, reply, created, updated FROM tickets WHERE user_id = ? ORDER BY created DESC LIMIT 30").bind(s.user_id).all();
    const {results: mine} = await env.DB.prepare("SELECT course, stars, tags, comment, status, reply FROM ratings WHERE user_id = ?").bind(s.user_id).all();
    return {tickets: results, ratings: mine.map(r => ({...r, tags: JSON.parse(r.tags || "[]")}))};
  }
  // السعر النهائي مع خصم المواد وكود الخصم. الحساب كله هني بالسيرفر، مو بالمتصفح
  if (path === "quote" && req.method === "POST") {
    await limit(env, req, "quote", "ADMIN_LIMITER");
    const b = await body(req);
    return quote(env, b.items, b.code);
  }
  throw new Fail(404, "none", "مو موجود.");
}

async function login(env, req, phone, password, device) {
  device = String(device || "").slice(0, 64);
  if (!phone || !password || device.length < 8) throw new Fail(400, "bad", "اكتب رقم جوالك وكلمة السر.");
  const u = await env.DB.prepare("SELECT id, name, phone, pass, status FROM users WHERE phone = ?").bind(phone).first();
  // نحسب الهاش حتى لو الرقم مو موجود، عشان ما يعرف أحد من سرعة الرد إذا الرقم مسجّل أو لا
  if (!u) { await hashPass(password); throw new Fail(401, "wrong", "رقم الجوال أو كلمة السر غلط."); }
  if (!(await checkPass(password, u.pass))) throw new Fail(401, "wrong", "رقم الجوال أو كلمة السر غلط.");
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

// ===== الكتالوج والأسعار =====

// إعدادات التسويق (تنحفظ في settings كـ JSON). المبالغ بالفلس
const GROWTH = {
  referral: {on: true, friend: 2000, reward: 2000},
  bundle: {on: true, two: 10, three: 15},
  examReminder: {on: true, days: 7},
  installmentReminder: {on: true, days: 5},
  review: {on: true, days: 2},
  freeFirst: {on: true},
  privateGroups: {on: true},
};
async function growth(env) {
  let saved = {};
  try { saved = JSON.parse(await setting(env, "growth") || "{}"); } catch {}
  return Object.fromEntries(Object.entries(GROWTH).map(([k, v]) => [k, {...v, ...(saved[k] || {})}]));
}

// نسخة بالذاكرة لدقيقة، عشان ليلة الامتحان آلاف الطلاب ما يضربون قاعدة البيانات كل مرة
let catCache = null;
async function catalog(env) {
  if (catCache && catCache.at > Date.now() - 60000) return catCache.data;
  const all = q => env.DB.prepare(q).all().then(r => r.results);
  const [unis, majors, courses, links, doctors, groups, g] = await Promise.all([
    all("SELECT id, name FROM universities WHERE visible = 1 ORDER BY sort, name"),
    all("SELECT id, uni, name FROM majors ORDER BY sort, name"),
    all("SELECT c.id, c.uni, c.code, c.title, c.doctor, c.price_mid, c.price_final, c.price_full, c.installments, c.mid_until, c.final_until, (SELECT COUNT(*) FROM videos v WHERE v.course = c.id AND v.ready = 1) AS lectures FROM courses c WHERE c.visible = 1 ORDER BY c.sort, c.code"),
    all("SELECT course, major FROM course_majors"),
    all("SELECT id, name, bio, photo, sample FROM doctors WHERE visible = 1 ORDER BY sort, name"),
    all("SELECT id, uni, scope, ref, title, url, private FROM wa_groups ORDER BY sort, id"),
    growth(env),
  ]);
  const data = {
    universities: unis,
    majors,
    courses: courses.map(c => ({...c, majors: links.filter(l => l.course === c.id).map(l => l.major)})),
    doctors,
    // رابط القروب الخاص ما يطلع هني، بس للمشترك من /me
    groups: groups.filter(x => !x.private || g.privateGroups.on).map(x => x.private ? {...x, url: null} : x),
    offers: {bundle: g.bundle.on ? {two: g.bundle.two, three: g.bundle.three} : null, referral: g.referral.on ? {friend: g.referral.friend} : null, freeFirst: g.freeFirst.on},
  };
  catCache = {at: Date.now(), data};
  return data;
}

const TAGS = ["شرح واضح", "أمثلة كثيرة", "يركّز على الامتحان", "الصوت يبيله تحسين", "سريع شوي", "بطيء شوي"];
const KINDS = ["suggestion", "complaint", "tech", "payment"];
const firstName = n => String(n || "").split(" ")[0];

// أول محاضرة بالمادة (أقل ترتيب) مجانية إذا الميزة شغالة، والمحاضرة التجريبية لأي دكتور ظاهر
async function isFree(env, v) {
  if (await env.DB.prepare("SELECT 1 FROM doctors WHERE sample = ? AND visible = 1").bind(v.id).first()) return true;
  if (!(await growth(env)).freeFirst.on) return false;
  const first = await env.DB.prepare("SELECT v.id FROM videos v JOIN courses c ON c.id = v.course AND c.visible = 1 WHERE v.course = ? AND v.ready = 1 ORDER BY v.sort, v.created LIMIT 1").bind(v.course).first();
  return first?.id === v.id;
}

async function ratingSummary(env, courses) {
  if (!courses.length) return {avg: 0, count: 0, dist: [0, 0, 0, 0, 0]};
  const {results} = await env.DB.prepare(`SELECT stars, COUNT(*) AS n FROM ratings WHERE status = 'published' AND course IN (${courses.map(() => "?").join(",")}) GROUP BY stars`).bind(...courses).all();
  const dist = [1, 2, 3, 4, 5].map(st => results.find(r => r.stars === st)?.n || 0);
  const count = dist.reduce((a, b) => a + b, 0);
  return {avg: count ? Math.round(dist.reduce((a, n, i) => a + n * (i + 1), 0) / count * 10) / 10 : 0, count, dist};
}
async function ratingList(env, courses, n = 20) {
  if (!courses.length) return [];
  const {results} = await env.DB.prepare(`SELECT r.course, r.stars, r.tags, r.comment, r.reply, r.created, u.name FROM ratings r JOIN users u ON u.id = r.user_id WHERE r.status = 'published' AND r.course IN (${courses.map(() => "?").join(",")}) ORDER BY (r.comment IS NULL), r.created DESC LIMIT ${n}`).bind(...courses).all();
  // الاسم الأول بس، عشان خصوصية الطالب
  return results.map(r => ({course: r.course, name: firstName(r.name), stars: r.stars, tags: JSON.parse(r.tags || "[]"), comment: r.comment, reply: r.reply, created: r.created}));
}

async function coursePage(env, id) {
  const c = (await catalog(env)).courses.find(x => x.id === id);
  if (!c) throw new Fail(404, "none", "المادة مو موجودة.");
  const [doc, vids, summary, ratings, groups, g] = await Promise.all([
    c.doctor ? env.DB.prepare("SELECT id, name, bio, photo FROM doctors WHERE id = ? AND visible = 1").bind(c.doctor).first() : null,
    env.DB.prepare("SELECT id, title, duration FROM videos WHERE course = ? AND ready = 1 ORDER BY sort, created").bind(id).all().then(r => r.results),
    ratingSummary(env, [id]), ratingList(env, [id]),
    env.DB.prepare("SELECT title, url FROM wa_groups WHERE scope = 'course' AND ref = ? AND private = 0 ORDER BY sort").bind(id).all().then(r => r.results),
    growth(env),
  ]);
  const chaps = await chaptersFor(env, vids.map(v => v.id));
  return {course: c, doctor: doc, lectures: vids.map((v, i) => ({...v, free: i === 0 && g.freeFirst.on, questions: (chaps[v.id] || []).length})), rating: summary, ratings, groups};
}

async function doctorPage(env, id) {
  const d = await env.DB.prepare("SELECT id, name, bio, photo, sample FROM doctors WHERE id = ? AND visible = 1").bind(id).first();
  if (!d) throw new Fail(404, "none", "الدكتور مو موجود.");
  const courses = (await catalog(env)).courses.filter(c => c.doctor === id);
  const ids = courses.map(c => c.id);
  const per = await Promise.all(ids.map(c => ratingSummary(env, [c])));
  const sample = d.sample ? await env.DB.prepare("SELECT id, title, duration FROM videos WHERE id = ? AND ready = 1").bind(d.sample).first() : null;
  return {doctor: {...d, sample}, courses: courses.map((c, i) => ({id: c.id, code: c.code, title: c.title, lectures: c.lectures, rating: per[i].avg, ratings: per[i].count})), rating: await ratingSummary(env, ids), ratings: await ratingList(env, ids, 10), lectures: courses.reduce((a, c) => a + c.lectures, 0)};
}

const PLANS = {mid: "price_mid", final: "price_final", full: "price_full"};
async function quote(env, items, code) {
  if (!Array.isArray(items) || !items.length || items.length > 10) throw new Fail(400, "bad", "اختار باقة.");
  const seen = new Set(), lines = [];
  for (const it of items) {
    const id = cleanCourse(it?.course), plan = String(it?.plan || "");
    if (!PLANS[plan] || seen.has(id)) throw new Fail(400, "bad", "الباقة مو صحيحة.");
    seen.add(id);
    const c = await env.DB.prepare("SELECT * FROM courses WHERE id = ? AND visible = 1").bind(id).first();
    if (!c || !(c[PLANS[plan]] > 0)) throw new Fail(400, "closed", "هالباقة مو متوفرة الحين.");
    const until = plan === "mid" ? c.mid_until : c.final_until;
    if (until && until < now()) throw new Fail(400, "closed", "هالباقة خلص وقتها.");
    lines.push({course: c.id, code: c.code, title: c.title, plan, price: c[PLANS[plan]], until, installments: plan === "full" && !!c.installments});
  }
  const g = await growth(env);
  const subtotal = lines.reduce((a, l) => a + l.price, 0);
  // خصم المواد: مادتين أو أكثر بنفس الطلب
  const pct = !g.bundle.on || lines.length < 2 ? 0 : lines.length >= 3 ? g.bundle.three : g.bundle.two;
  const bundle = Math.round(subtotal * pct / 100);
  let promo = null;
  if (code) {
    const p = await env.DB.prepare("SELECT * FROM promos WHERE code = ?").bind(cleanCode(code)).first();
    if (!p || !p.active) throw new Fail(400, "promo", "كود الخصم مو صحيح.");
    if (p.until && p.until < now()) throw new Fail(400, "promo", "كود الخصم انتهى.");
    if (p.max_uses && p.used >= p.max_uses) throw new Fail(400, "promo", "كود الخصم خلص عدده.");
    const base = p.course ? lines.filter(l => l.course === p.course).reduce((a, l) => a + l.price, 0) : subtotal;
    if (!base) throw new Fail(400, "promo", "هالكود لمادة ثانية.");
    // الكود ينطبق بعد خصم المواد
    const after = Math.round(base * (100 - pct) / 100);
    const amount = Math.min(after, p.kind === "pct" ? Math.round(after * p.value / 100) : p.value);
    promo = {code: p.code, kind: p.kind, value: p.value, amount};
  }
  const total = Math.max(0, subtotal - bundle - (promo?.amount || 0));
  // قسطين: بس لما يكون الطلب الفصل كامل لمادة وحدة تسمح بالأقساط
  const split = lines.length === 1 && lines[0].installments ? {first: Math.ceil(total / 2 / 10) * 10, second: total - Math.ceil(total / 2 / 10) * 10} : null;
  return {lines, subtotal, bundle: pct ? {pct, amount: bundle} : null, promo, total, split};
}

// ===== لوحة الإدارة =====

// ===== التحقق بخطوتين للإدارة (TOTP، مثل Google Authenticator) =====

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function b32decode(s) {
  let bits = 0, val = 0; const out = [];
  for (const c of s.replace(/=+$/, "").toUpperCase()) { val = (val << 5) | B32.indexOf(c); bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } }
  return new Uint8Array(out);
}
function b32encode(bytes) {
  let bits = 0, val = 0, out = "";
  for (const b of bytes) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } }
  return bits ? out + B32[(val << (5 - bits)) & 31] : out;
}
async function totp(secret, step) {
  const key = await crypto.subtle.importKey("raw", b32decode(secret), {name: "HMAC", hash: "SHA-1"}, false, ["sign"]);
  const msg = new ArrayBuffer(8); new DataView(msg).setUint32(4, step);
  const h = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));
  const o = h[19] & 15;
  return String((((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6).padStart(6, "0");
}
async function checkCode(secret, code) {
  code = String(code || "").replace(/\D/g, "");
  if (code.length !== 6) return false;
  const step = Math.floor(now() / 30);
  for (const d of [-1, 0, 1]) if (sameText(await totp(secret, step + d), code)) return true;
  return false;
}
const setting = async (env, k) => (await env.DB.prepare("SELECT v FROM settings WHERE k = ?").bind(k).first())?.v || null;
const setSetting = (env, k, v) => env.DB.prepare("INSERT INTO settings (k, v) VALUES (?, ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v").bind(k, v).run();

// دخول الإدارة: كلمة السر + رمز من التطبيق، ويعطي جلسة تشتغل 12 ساعة
async function adminLogin(req, env) {
  await limit(env, req, "admin-login");
  const b = await body(req);
  if (!env.ADMIN_PASSWORD || !sameText(String(b.password || ""), env.ADMIN_PASSWORD)) throw new Fail(401, "admin", "كلمة سر الإدارة غلط.");
  let secret = await setting(env, "totp");
  if (!secret) {
    // أول مرة: نجهّز مفتاح ويربطه المدير بتطبيق المصادقة، وما يتفعّل إلا لما يدخل رمز صح
    let pending = await setting(env, "totp_pending");
    if (!pending) { pending = b32encode(crypto.getRandomValues(new Uint8Array(20))); await setSetting(env, "totp_pending", pending); }
    if (!b.code) return {setup: true, secret: pending, uri: `otpauth://totp/${encodeURIComponent("الطالب الأكاديمي:الإدارة")}?secret=${pending}&issuer=${encodeURIComponent("الطالب الأكاديمي")}`};
    if (!(await checkCode(pending, b.code))) throw new Fail(401, "code", "الرمز غلط. تأكد إن وقت جوالك مضبوط وجرّب الرمز الجديد.");
    await setSetting(env, "totp", pending);
    await env.DB.prepare("DELETE FROM settings WHERE k = 'totp_pending'").run();
  } else {
    if (!b.code) return {need: "code"};
    if (!(await checkCode(secret, b.code))) throw new Fail(401, "code", "الرمز غلط أو انتهى، جرّب الرمز الجديد.");
  }
  const token = rand(32);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM admin_sessions WHERE exp < ?").bind(now()),
    env.DB.prepare("INSERT INTO admin_sessions (token, exp, ua) VALUES (?, ?, ?)").bind(await sha256(token), now() + ADMIN_HOURS * 3600, (req.headers.get("User-Agent") || "").slice(0, 200)),
  ]);
  return {token};
}

async function admin(req, env, url, path) {
  if (path === "login" && req.method === "POST") return adminLogin(req, env);
  await limit(env, req, "admin", "ADMIN_LIMITER");
  const t = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const ok = t && await env.DB.prepare("SELECT 1 FROM admin_sessions WHERE token = ? AND exp > ?").bind(await sha256(t), now()).first();
  if (!ok) throw new Fail(401, "admin", "انتهت جلسة الإدارة، سجّل دخولك مرة ثانية.");
  if (path === "logout" && req.method === "POST") { await env.DB.prepare("DELETE FROM admin_sessions WHERE token = ?").bind(await sha256(t)).run(); return {ok: true}; }

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
      pendingRatings: (await one("SELECT COUNT(*) AS n FROM ratings WHERE status = 'pending'"))?.n || 0,
      openTickets: (await one("SELECT COUNT(*) AS n FROM tickets WHERE status != 'solved'"))?.n || 0,
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
      await env.DB.batch(["DELETE FROM sessions WHERE user_id = ?", "DELETE FROM devices WHERE user_id = ?", "DELETE FROM attempts WHERE user_id = ?", "DELETE FROM active WHERE user_id = ?", "DELETE FROM progress WHERE user_id = ?", "DELETE FROM access WHERE user_id = ?", "DELETE FROM views WHERE user_id = ?", "DELETE FROM ratings WHERE user_id = ?", "DELETE FROM tickets WHERE user_id = ?", "DELETE FROM users WHERE id = ?"].map(q => env.DB.prepare(q).bind(id)));
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

  if (path === "catalog" && req.method === "GET") {
    const all = q => env.DB.prepare(q).all().then(r => r.results);
    const [universities, majors, courses, links, doctors, promos, groups, g] = await Promise.all([
      all("SELECT * FROM universities ORDER BY sort, name"), all("SELECT * FROM majors ORDER BY uni, sort, name"),
      all("SELECT c.*, (SELECT COUNT(*) FROM videos v WHERE v.course = c.id) AS lectures, (SELECT COUNT(*) FROM access a WHERE a.course = c.id AND a.until > strftime('%s','now')) AS subscribers FROM courses c ORDER BY c.uni, c.sort, c.code"),
      all("SELECT * FROM course_majors"), all("SELECT * FROM doctors ORDER BY sort, name"),
      all("SELECT * FROM promos ORDER BY created DESC"), all("SELECT * FROM wa_groups ORDER BY uni, scope, sort, id"), growth(env),
    ]);
    return {universities, majors, courses: courses.map(c => ({...c, majors: links.filter(l => l.course === c.id).map(l => l.major)})), doctors, promos, groups, growth: g};
  }
  if (path === "save" && req.method === "POST") { const r = await saveRow(env, await body(req)); catCache = null; return r; }
  if (path === "growth" && req.method === "POST") {
    const b = await body(req), g = await growth(env), out = {};
    for (const [k, def] of Object.entries(GROWTH)) {
      out[k] = {};
      for (const f of Object.keys(def)) {
        const v = b?.[k]?.[f] ?? g[k][f];
        out[k][f] = f === "on" ? !!v : Math.max(0, Math.min(f === "friend" || f === "reward" ? 100000 : 100, Math.round(Number(v) || 0)));
      }
    }
    await setSetting(env, "growth", JSON.stringify(out)); catCache = null;
    return {ok: true, growth: out};
  }

  if (path === "videos" && req.method === "GET") {
    await refreshPending(env);
    const {results} = await env.DB.prepare("SELECT v.id, v.course, v.title, v.sort, v.size, v.duration, v.ready, v.created, (SELECT COUNT(*) FROM views w WHERE w.video_id = v.id) AS views FROM videos v ORDER BY v.course, v.sort, v.created").all();
    const chaps = await chaptersFor(env, results.map(v => v.id));
    return {videos: results.map(v => ({...v, chapters: chaps[v.id] || []}))};
  }

  // فهرس الأسئلة لمحاضرة: يستبدل القديم كله
  if (path === "chapters" && req.method === "POST") {
    const b = await body(req);
    const v = await env.DB.prepare("SELECT id, duration FROM videos WHERE id = ?").bind(String(b.video || "")).first();
    if (!v) throw new Fail(404, "none", "الفيديو مو موجود.");
    const items = (Array.isArray(b.items) ? b.items : []).slice(0, 100).map(x => ({t: Math.max(0, Math.round(Number(x.t))), title: String(x.title || "").trim().slice(0, 120)}));
    if (items.some(x => !x.title || !Number.isFinite(x.t))) throw new Fail(400, "bad", "كل سؤال يبيله وقت وعنوان.");
    if (v.duration && items.some(x => x.t > v.duration)) throw new Fail(400, "bad", "في وقت أطول من الفيديو نفسه.");
    if (new Set(items.map(x => x.t)).size !== items.length) throw new Fail(400, "bad", "في سؤالين بنفس الوقت.");
    await env.DB.batch([env.DB.prepare("DELETE FROM chapters WHERE video_id = ?").bind(v.id), ...items.map(x => env.DB.prepare("INSERT INTO chapters (video_id, t, title) VALUES (?, ?, ?)").bind(v.id, x.t, x.title))]);
    return {ok: true};
  }

  if (path === "ratings" && req.method === "GET") {
    const {results} = await env.DB.prepare("SELECT r.*, u.name, u.phone FROM ratings r JOIN users u ON u.id = r.user_id ORDER BY CASE r.status WHEN 'pending' THEN 0 ELSE 1 END, r.created DESC LIMIT 300").all();
    return {ratings: results.map(r => ({...r, tags: JSON.parse(r.tags || "[]")}))};
  }
  if (path === "rating" && req.method === "POST") {
    const b = await body(req);
    if (!["published", "hidden"].includes(b.status)) throw new Fail(400, "bad", "الحالة مو صحيحة.");
    const r = await env.DB.prepare("UPDATE ratings SET status = ?, reply = ? WHERE id = ?").bind(b.status, String(b.reply || "").trim().slice(0, 500) || null, Number(b.id)).run();
    if (!r.meta.changes) throw new Fail(404, "none", "التقييم مو موجود.");
    return {ok: true};
  }
  if (path === "tickets" && req.method === "GET") {
    const {results} = await env.DB.prepare("SELECT t.*, u.name, u.phone, u.email FROM tickets t JOIN users u ON u.id = t.user_id ORDER BY CASE t.status WHEN 'open' THEN 0 WHEN 'working' THEN 1 ELSE 2 END, t.created DESC LIMIT 300").all();
    return {tickets: results};
  }
  if (path === "ticket" && req.method === "POST") {
    const b = await body(req);
    if (!["open", "working", "solved"].includes(b.status)) throw new Fail(400, "bad", "الحالة مو صحيحة.");
    const r = await env.DB.prepare("UPDATE tickets SET status = ?, reply = ?, updated = ? WHERE id = ?").bind(b.status, String(b.reply || "").trim().slice(0, 2000) || null, now(), Number(b.id)).run();
    if (!r.meta.changes) throw new Fail(404, "none", "الرسالة مو موجودة.");
    return {ok: true};
  }

  if (path === "video" && req.method === "POST") {
    const b = await body(req);
    const v = await env.DB.prepare("SELECT id FROM videos WHERE id = ?").bind(String(b.id || "")).first();
    if (!v) throw new Fail(404, "none", "الفيديو مو موجود.");
    if (b.delete) {
      const r = await cf(env, `/${v.id}`, {method: "DELETE"});
      if (!r.ok && r.status !== 404) throw new Fail(502, "cf", "ما قدرنا نحذفه من Cloudflare، جرّب مرة ثانية.");
      await env.DB.batch(["DELETE FROM videos WHERE id = ?", "DELETE FROM views WHERE video_id = ?", "DELETE FROM progress WHERE video_id = ?", "DELETE FROM chapters WHERE video_id = ?"].map(q => env.DB.prepare(q).bind(v.id)));
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

// ===== حفظ الكتالوج من الداشبورد =====
// كل جدول وأعمدته المسموحة ونوع كل عمود. أي شي ثاني ينرفض.
const TABLES = {
  universities: {key: "id", cols: {id: "uniId", name: "text", sort: "int", visible: "bool"}},
  majors: {key: "id", auto: true, cols: {uni: "uni", name: "text", sort: "int"}},
  doctors: {key: "id", auto: true, cols: {name: "text", bio: "long", photo: "url", sample: "str", sort: "int", visible: "bool"}},
  courses: {key: "id", cols: {uni: "uni", code: "code", title: "text", doctor: "intn", price_mid: "fils", price_final: "fils", price_full: "fils", installments: "bool", mid_until: "date", final_until: "date", visible: "bool", sort: "int"}},
  promos: {key: "code", cols: {code: "code", kind: "kind", value: "int", course: "courseRef", max_uses: "intn", until: "date", active: "bool"}},
  wa_groups: {key: "id", auto: true, cols: {uni: "uni", scope: "scope", ref: "str", title: "text", url: "wa", private: "bool", sort: "int"}},
};
async function saveRow(env, b) {
  const t = TABLES[b?.table];
  if (!t) throw new Fail(400, "bad", "الجدول مو معروف.");
  const db = env.DB, table = b.table;
  if (b.delete) {
    const key = t.auto ? Number(b.key) : String(b.key || "");
    if (table === "courses" && (await db.prepare("SELECT 1 FROM videos WHERE course = ? UNION SELECT 1 FROM access WHERE course = ? LIMIT 1").bind(key, key).first())) throw new Fail(409, "used", "المادة فيها محاضرات أو مشتركين، خلها مخفية بدال الحذف.");
    if (table === "universities" && (await db.prepare("SELECT 1 FROM courses WHERE uni = ? LIMIT 1").bind(key).first())) throw new Fail(409, "used", "الجامعة فيها مواد، احذف المواد أول أو خلها مخفية.");
    const q = [db.prepare(`DELETE FROM ${table} WHERE ${t.key} = ?`).bind(key)];
    if (table === "courses") q.push(db.prepare("DELETE FROM course_majors WHERE course = ?").bind(key));
    if (table === "majors") q.push(db.prepare("DELETE FROM course_majors WHERE major = ?").bind(key));
    await db.batch(q);
    return {ok: true};
  }
  const r = b.row || {}, v = {};
  const bad = m => { throw new Fail(400, "bad", m); };
  for (const [c, type] of Object.entries(t.cols)) {
    const x = r[c], empty = x === undefined || x === null || x === "";
    if (type === "text") { v[c] = String(x || "").trim().slice(0, 150); if (!v[c]) bad("في خانة ناقصة."); }
    else if (type === "long") v[c] = empty ? null : String(x).trim().slice(0, 2000);
    else if (type === "str") v[c] = empty ? null : String(x).trim().slice(0, 100);
    else if (type === "int") v[c] = Math.round(Number(x) || 0);
    else if (type === "intn") v[c] = empty ? null : Math.round(Number(x));
    else if (type === "bool") v[c] = x ? 1 : 0;
    else if (type === "fils") { const n = Number(x || 0); if (!(n >= 0 && n < 10000)) bad("السعر مو صحيح."); v[c] = Math.round(n * 1000); }
    else if (type === "date") v[c] = empty ? null : Number(x) || bad("التاريخ مو صحيح.");
    else if (type === "uniId") { v[c] = String(x || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10); if (!v[c]) bad("اكتب رمز الجامعة بالإنجليزي، مثل AOU."); }
    else if (type === "uni") { if (!(await db.prepare("SELECT 1 FROM universities WHERE id = ?").bind(String(x || "")).first())) bad("اختار الجامعة."); v[c] = String(x); }
    else if (type === "code") { v[c] = cleanCode(x); if (!v[c]) bad("اكتب الرمز بالإنجليزي."); }
    else if (type === "kind") { if (!["pct", "amt"].includes(x)) bad("نوع الخصم مو صحيح."); v[c] = x; }
    else if (type === "scope") { if (!["uni", "major", "course"].includes(x)) bad("نوع القروب مو صحيح."); v[c] = x; }
    else if (type === "courseRef") { v[c] = empty ? null : cleanCourse(x); if (v[c] && !(await db.prepare("SELECT 1 FROM courses WHERE id = ?").bind(v[c]).first())) bad("المادة مو موجودة."); }
    else if (type === "url") { v[c] = empty ? null : String(x).trim(); if (v[c] && !/^https:\/\/[^\s"'<>]+$/.test(v[c])) bad("الرابط لازم يبدأ بـ https://"); }
    else if (type === "wa") { v[c] = String(x || "").trim(); if (!/^https:\/\/(chat\.whatsapp\.com|wa\.me|whatsapp\.com\/channel)\/[A-Za-z0-9_\/-]+$/.test(v[c])) bad("حط رابط قروب واتساب صحيح (https://chat.whatsapp.com/...)."); }
  }
  if (table === "promos") {
    if (v.kind === "pct" && !(v.value > 0 && v.value <= 100)) bad("النسبة لازم بين 1 و 100.");
    if (v.kind === "amt") { const n = Number(r.value); if (!(n > 0 && n < 10000)) bad("المبلغ مو صحيح."); v.value = Math.round(n * 1000); }
  }
  if (table === "courses") {
    v.id = `${v.uni}-${v.code}`;
    if (b.key && b.key !== v.id) bad("ما تقدر تغيّر رمز المادة أو جامعتها بعد ما تنضاف. سوّ مادة جديدة.");
    if (v.doctor && !(await db.prepare("SELECT 1 FROM doctors WHERE id = ?").bind(v.doctor).first())) bad("الدكتور مو موجود.");
  }
  if (table === "wa_groups" && v.scope !== "uni" && !v.ref) bad("اختار التخصص أو المادة حق القروب.");
  if (table === "wa_groups" && v.private && v.scope !== "course") bad("القروب الخاص لازم يكون لمادة.");
  if (table === "promos" && b.key && b.key !== v.code) bad("ما تقدر تغيّر الكود نفسه، سوّ كود جديد.");
  if (table === "universities" && b.key && b.key !== v.id) bad("ما تقدر تغيّر رمز الجامعة.");

  const cols = Object.keys(v);
  let key;
  if (t.auto && b.key) {
    key = Number(b.key);
    const res = await db.prepare(`UPDATE ${table} SET ${cols.map(c => `${c} = ?`).join(", ")} WHERE id = ?`).bind(...cols.map(c => v[c]), key).run();
    if (!res.meta.changes) throw new Fail(404, "none", "مو موجود.");
  } else if (t.auto) {
    key = (await db.prepare(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")}) RETURNING id`).bind(...cols.map(c => v[c])).first()).id;
  } else {
    if (table === "promos") { cols.push("created"); v.created = now(); }
    const upd = cols.filter(c => c !== t.key && c !== "created");
    if (!b.key && (await db.prepare(`SELECT 1 FROM ${table} WHERE ${t.key} = ?`).bind(v[t.key]).first())) bad("هالرمز موجود من قبل.");
    await db.prepare(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")}) ON CONFLICT (${t.key}) DO UPDATE SET ${upd.map(c => `${c} = excluded.${c}`).join(", ")}`).bind(...cols.map(c => v[c])).run();
    key = v[t.key];
  }
  if (table === "courses" && Array.isArray(r.majors)) {
    const ok = (await db.prepare("SELECT id FROM majors WHERE uni = ?").bind(v.uni).all()).results.map(m => m.id);
    await db.batch([db.prepare("DELETE FROM course_majors WHERE course = ?").bind(key), ...r.majors.map(Number).filter(m => ok.includes(m)).map(m => db.prepare("INSERT OR IGNORE INTO course_majors (course, major) VALUES (?, ?)").bind(key, m))]);
  }
  return {ok: true, key};
}
