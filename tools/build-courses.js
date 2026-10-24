// يبني صفحة لكل مادة في c/<رمز المادة>/index.html ويحدّث sitemap.xml من بيانات CONFIG في index.html
// التشغيل من جذر المستودع:  node tools/build-courses.js
// يشتغل تلقائياً على GitHub (.github/workflows/build-courses.yml) كل ما تغيّر index.html، فما تحتاج تشغله بنفسك.
const path = require("path"), fs = require("fs"), vm = require("vm");

const root = path.resolve(__dirname, "..");
const SITE = "https://www.asckwt.com/";
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const grab = (start, end) => {
  const i = html.indexOf(start), j = html.indexOf(end, i);
  if (i < 0 || j < 0) throw new Error("ما لقيت " + start + " في index.html");
  return vm.runInNewContext("(" + html.slice(i + start.length, j + end.length - 1) + ")");
};
const CONFIG = grab("const CONFIG = ", "\n};");
const COURSES = grab("const COURSES = ", "\n];");

const EXT = {final: "الاختبار النهائي (فاينل)", mta: "اختبار منتصف الفصل (ميد)", makeup: "الميد التعويضي"};
const SEM = {"1": "الفصل الأول", "2": "الفصل الثاني", summer: "الفصل الصيفي"};
const esc = t => String(t).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"})[c]);
const WAG = "https://chat.whatsapp.com/";

// كل مادة لها محاضرة أو نماذج أو قروب تطلع لها صفحة
const courses = {};
const get = code => courses[code] ??= {code, lectures: [], exams: null, chat: null};
const info = Object.fromEntries(COURSES.map(([c, h, t]) => [c, {h, t}]));
CONFIG.courseChats.forEach(g => g.items.forEach(([code, k]) => code.split(" / ").forEach(x => get(x).chat ??= WAG + k)));
CONFIG.lectures.forEach(l => { const c = get(l.code); c.lectures.push(l); if (l.chat) c.chat = l.chat; });
CONFIG.exams.forEach(e => { const c = get(e.code); c.exams = e; });
// مواعيد الاختبارات من examSchedule
const MON = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const DAY = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const fmt = s => { const d = new Date(s + "T00:00:00Z"); return `${DAY[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const to12 = t => { let [h, m] = t.split(":").map(Number); const pm = h >= 12; h = h % 12 || 12; return `${h}:${String(m).padStart(2, "0")} ${pm ? "م" : "ص"}`; };
const slots = {};
for (const [type, x] of Object.entries(CONFIG.examSchedule || {})) {
  Object.entries(x.days).forEach(([date, cols]) => cols.forEach((list, i) => list.split(" ").filter(Boolean).forEach(c => (slots[c] ??= []).push({type, date, from: x.times[i][0], to: x.times[i][1], time: `${to12(x.times[i][0])} – ${to12(x.times[i][1])}`}))));
  Object.entries(x.online || {}).forEach(([date, list]) => list.split(" ").forEach(c => (slots[c] ??= []).push({type, date, online: true, time: "محوسب، الوقت يتعلن بعدين"})));
}
const wa = (CONFIG.whatsapp.find(w => /^\d{8,15}$/.test(w.number)) || {}).number;
const ga = /^G-[A-Z0-9]+$/.test(CONFIG.analytics) ? CONFIG.analytics : "";

function page(c) {
  const name = info[c.code]?.t || c.exams?.name || "";
  const hrs = info[c.code]?.h;
  const ex = (slots[c.code] || []).sort((a, b) => a.date.localeCompare(b.date));
  const has = [ex.length && "مواعيد الاختبارات", c.lectures.length && "محاضرة مجانية مسجلة", c.exams && `${c.exams.items.length} نماذج اختبارات سابقة`, c.chat && "قروب واتساب للمادة"].filter(Boolean);
  const desc = `مادة ${c.code}${name ? ` (${name})` : ""} في الجامعة العربية المفتوحة الكويت: ${has.join("، ")}، والاشتراك في شرح المادة كامل مع الطالب الأكاديمي.`;
  const url = `${SITE}c/${c.code.toLowerCase()}/`;
  const title = `${c.code}${name ? ` ${name}` : ""} · نماذج اختبارات ومحاضرات | الطالب الأكاديمي`;
  const msg = encodeURIComponent(`السلام عليكم، شفت صفحة مادة ${c.code} في الموقع وأبي أسجل في الكورس.`);
  const years = c.exams ? [...new Set(c.exams.items.map(e => e.year))] : [];
  const ld = {"@context": "https://schema.org", "@type": "Course", name: `${c.code}${name ? " " + name : ""}`, courseCode: c.code, description: desc, url,
    provider: {"@type": "EducationalOrganization", name: "الطالب الأكاديمي", url: SITE}};
  return `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#07005E">
<link rel="icon" href="../../icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../../icons/apple-touch-icon.png">
<link rel="manifest" href="../../manifest.webmanifest">
<meta property="og:type" content="website"><meta property="og:site_name" content="الطالب الأكاديمي"><meta property="og:locale" content="ar_KW">
<meta property="og:url" content="${url}"><meta property="og:title" content="${esc(c.code + (name ? " · " + name : ""))}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE}og.png"><meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alexandria:wght@500;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap">
<style>
:root{--navy:#07005E;--yellow:#F7DC6B;--turq:#7DE6D5;--pink:#E980C2;--bg:#F6F5FB;--surface:#fff;--fg:#151238;--muted:#5B5878;--line:#E2E0EE;--accent-ink:#07005E;
 --display:"Alexandria","IBM Plex Sans Arabic",Tahoma,sans-serif;--body:"IBM Plex Sans Arabic",Tahoma,"Segoe UI",sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0B0930;--surface:#141142;--fg:#F1F0FA;--muted:#B4B1D3;--line:#2A2663;--accent-ink:#F7DC6B;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0B0930;--surface:#141142;--fg:#F1F0FA;--muted:#B4B1D3;--line:#2A2663;--accent-ink:#F7DC6B;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--body);font-size:16px;line-height:1.7}
.wrap{max-width:860px;margin:0 auto;padding-inline:16px}
header{background:var(--navy);color:#fff;padding:22px 0 34px}
header img{height:38px;display:block}
.crumb{display:inline-block;margin-top:24px;color:#D9D7F3;text-decoration:none;font-size:14px}
h1{font-family:var(--display);font-weight:800;font-size:clamp(28px,7vw,44px);line-height:1.4;margin:6px 0 4px}
h1 bdi{color:var(--yellow)}
.lead{color:#D9D7F3;margin:0}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.chips span{background:rgba(255,255,255,.1);border-radius:999px;padding:3px 12px;font-size:14px}
main{padding-block:28px 48px;display:grid;gap:28px}
h2{font-family:var(--display);font-weight:700;font-size:21px;margin:0 0 12px}
h3{font-family:var(--display);font-weight:700;font-size:16px;margin:18px 0 10px;color:var(--muted)}
.list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}
.item{display:flex;flex-direction:column;gap:6px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px}
.item b{font-family:var(--display);font-size:15px}
.item small{color:var(--muted);font-size:13px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;align-self:flex-start;font-family:var(--display);font-weight:700;font-size:15px;text-decoration:none;padding:9px 16px;border-radius:11px;background:var(--navy);color:#fff}
.btn.y{background:var(--yellow);color:#07005E}.btn.w{background:#25D366;color:#06301A}
.btn.o{background:transparent;color:var(--accent-ink);border:1.5px solid var(--line)}
.pass{font-size:13px;color:var(--muted)}.pass b{user-select:all}
.cta{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:22px;display:grid;gap:12px}
.cta p{margin:0;color:var(--muted)}
.row{display:flex;flex-wrap:wrap;gap:10px}
footer{border-top:1px solid var(--line);color:var(--muted);font-size:13px;padding:18px 0 30px}
footer a{color:inherit}
</style>${ga ? `
<script async src="https://www.googletagmanager.com/gtag/js?id=${ga}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","${ga}");</script>` : ""}
</head><body>
<header><div class="wrap">
  <a href="../../"><img src="../../tools/logo-horizontal-color-on-navy.svg" alt="الطالب الأكاديمي"></a>
  <a class="crumb" href="../../#home">→ كل المواد والأقسام</a>
  <h1><bdi dir="ltr">${c.code}</bdi>${name ? ` <span dir="ltr" style="display:block;font-size:.55em;font-weight:700">${esc(name)}</span>` : ""}</h1>
  <p class="lead">كل اللي تحتاجه لمادة <bdi dir="ltr">${c.code}</bdi> في الجامعة العربية المفتوحة الكويت، في صفحة وحدة.</p>
  <div class="chips">${hrs ? `<span>${hrs} ساعات</span>` : ""}${has.map(h => `<span>${h}</span>`).join("")}</div>
</div></header>
<main class="wrap">
${ex.length ? `<section><h2>مواعيد الاختبارات</h2><ul class="list">${ex.map(e => `<li class="item"><b>${esc(CONFIG.examSchedule[e.type].title)}</b><span>${fmt(e.date)}</span><small>${e.time}</small></li>`).join("")}</ul><p class="pass" style="margin-top:10px">التعويضي بس للي عنده عذر وقدّم طلب تأجيل من SIS. <a class="btn o" href="../../ics/${c.code}.ics" style="margin:6px 0">📅 أضف مواعيدها لتقويم جوالك</a><br>حط كل موادك في <a href="../../#calendar/${c.code}" style="color:var(--accent-ink)">جدول اختباراتي</a> وتطلع لك مواعيدك كلها مع تذكير على جوالك.</p></section>` : ""}
${c.lectures.length ? `<section><h2>المحاضرات المجانية</h2><ul class="list">${c.lectures.map(l => `<li class="item"><b>${esc(l.title)}</b><small>مسجلة على الزوم</small><a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener">شاهد المحاضرة</a>${l.pass ? `<span class="pass">الباسكود: <b dir="ltr">${esc(l.pass)}</b></span>` : ""}</li>`).join("")}</ul></section>` : ""}
${c.exams ? `<section><h2>نماذج الاختبارات السابقة</h2>${years.map(y => `<h3>${y}</h3><ul class="list">${c.exams.items.filter(e => e.year === y).map(e => `<li class="item"><b>${EXT[e.type]}</b><small>${SEM[e.sem]} ${e.year} · نسخة ${esc(e.ver)} · ${e.pages} صفحات</small><a class="btn" href="../../exams/${c.code}/${e.file}.pdf" target="_blank" rel="noopener">افتح النموذج PDF</a></li>`).join("")}</ul>`).join("")}</section>` : ""}
${c.chat ? `<section><h2>قروب المادة</h2><div class="item"><b>قروب واتساب لطلاب ${c.code}</b><small>أسئلة ومساعدة وأخبار المادة من الطلاب.</small><a class="btn w" href="${c.chat}" target="_blank" rel="noopener">انضم للقروب</a></div></section>` : ""}
<section class="cta">
  <h2 style="margin:0">تبي تكمّل <bdi dir="ltr">${c.code}</bdi> معانا؟</h2>
  <p>شرح مبسّط للمقرر كامل، قروب خاص للمشتركين، ملخصات ونماذج محلولة ومراجعة قبل الاختبار.</p>
  <div class="row">${wa ? `<a class="btn w" href="https://wa.me/${wa}?text=${msg}" target="_blank" rel="noopener">سجّل عن طريق الواتساب</a>` : ""}<a class="btn y" href="https://app.academic-student.com" target="_blank" rel="noopener">منصة الطالب الأكاديمي</a><a class="btn o" href="../../#calendar">مواعيد الاختبارات</a><a class="btn o" href="../../#gpa">حاسبة المعدل</a></div>
</section>
</main>
<footer><div class="wrap">الطالب الأكاديمي · <a href="../../">asckwt.com</a></div></footer>
<script>if("serviceWorker"in navigator&&location.protocol==="https:")navigator.serviceWorker.register("../../sw.js",{scope:"../../"});</script>
</body></html>
`;
}

const out = path.join(root, "c");
fs.rmSync(out, {recursive: true, force: true});
const list = Object.values(courses).sort((a, b) => a.code.localeCompare(b.code));
for (const c of list) {
  const dir = path.join(out, c.code.toLowerCase());
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, "index.html"), page(c));
}
fs.writeFileSync(path.join(root, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}</loc><priority>1.0</priority></url>
${list.map(c => `  <url><loc>${SITE}c/${c.code.toLowerCase()}/</loc></url>`).join("\n")}
</urlset>
`);

// ملفات تقويم (ics/) حقيقية بدل data: لأن سفاري الآيفون والآيباد ما يفتح التقويم من data:
// ics/<المادة>.ics = الميد والفاينل للمادة مع تذكير قبلها بيوم، و ics/aoukw-<الفصل>.ics = تقويم الجامعة
const utc = (d, t) => new Date(Date.parse(`${d}T${t}:00+03:00`)).toISOString().replace(/[-:]|\.\d+/g, "");
const dayAfter = d => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10).replace(/-/g, ""); };
const cal = (name, events) => ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//asckwt.com//AOUKW//AR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${name}`, ...events, "END:VCALENDAR", ""].join("\r\n");
const stamp = "20260901T000000Z"; // ثابت عشان الملفات ما تتغير كل ما انبنت
const icsDir = path.join(root, "ics");
fs.rmSync(icsDir, {recursive: true, force: true}); fs.mkdirSync(icsDir);
for (const [code, list] of Object.entries(slots)) {
  const ev = list.filter(e => e.type !== "makeup").map(e => {
    const title = `${CONFIG.examSchedule[e.type].title} ${code}`;
    return ["BEGIN:VEVENT", `UID:${code}-${e.type}-${e.date}@asckwt.com`, `DTSTAMP:${stamp}`,
      ...(e.online ? [`DTSTART;VALUE=DATE:${e.date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${dayAfter(e.date)}`] : [`DTSTART:${utc(e.date, e.from)}`, `DTEND:${utc(e.date, e.to)}`]),
      `SUMMARY:${title}`, `DESCRIPTION:${e.time} · asckwt.com`, "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${title}`, "TRIGGER:-P1D", "END:VALARM", "END:VEVENT"].join("\r\n");
  });
  if (ev.length) fs.writeFileSync(path.join(icsDir, code + ".ics"), cal(`اختبارات ${code}`, ev));
}
const calItems = CONFIG.calendar.flatMap(g => g.items);
fs.writeFileSync(path.join(icsDir, "aoukw-calendar.ics"), cal("تقويم الجامعة العربية المفتوحة", calItems.map((e, i) => {
  const a = e.from || e.to, b = e.to || e.from;
  return ["BEGIN:VEVENT", `UID:aoukw-cal-${a}-${i}@asckwt.com`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${a.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${dayAfter(b)}`, `SUMMARY:${e.name}`, "END:VEVENT"].join("\r\n");
})));
console.log(`بنيت ${list.length} صفحة مادة و sitemap.xml و ${fs.readdirSync(icsDir).length} ملف تقويم`);
