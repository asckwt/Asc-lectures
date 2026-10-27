// يبني "معلومات المساعد" من بيانات الموقع عشان مساعد الذكاء الاصطناعي يعرف الجامعة العربية المفتوحة الكويت:
//   ai/kb/general.md  = المواد والخطط الدراسية والمتطلبات وتقويم الفصل ومواعيد الاختبارات والقروبات
//   ai/kb/<المادة>.md = تفاصيل كل مادة: مواعيدها، نماذجها السابقة، محاضراتها، متطلباتها، وبأي خطة
//   ai/config.js     = رابط المساعد وعدد الأسئلة اليومي (لصفحات بنك الأسئلة)
// المساعد يقرا هالملفات من الموقع مباشرة، فأي تعديل في CONFIG أو plans.js يوصله بعد ما ينبني.
// التشغيل من جذر المستودع:  node tools/build-ai.js  (ويشتغل تلقائياً مع build-courses على GitHub)
const path = require("path"), fs = require("fs"), vm = require("vm");

const root = path.resolve(__dirname, "..");
const SITE = "https://www.asckwt.com/";
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const grab = (src, start, end) => {
  const i = src.indexOf(start), j = src.indexOf(end, i);
  if (i < 0 || j < 0) throw new Error("ما لقيت " + start);
  return vm.runInNewContext("(" + src.slice(i + start.length, j + end.length - 1) + ")");
};
const CONFIG = grab(html, "const CONFIG = ", "\n};");
const COURSES = grab(html, "const COURSES = ", "\n];");
const GRADES = grab(html, "const GRADES = ", "];");
const pjs = fs.readFileSync(path.join(root, "plans.js"), "utf8");
const {C, PLANS, KIND} = vm.runInNewContext(pjs.slice(pjs.indexOf("const C = {"), pjs.indexOf("/* ===== ترتيب الخريطة")) + "\n({C, PLANS, KIND})");

const MON = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const DAY = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const fmt = s => { const d = new Date(s + "T00:00:00Z"); return `${DAY[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()} (${s})`; };
const to12 = t => { let [h, m] = t.split(":").map(Number); const pm = h >= 12; h = h % 12 || 12; return `${h}:${String(m).padStart(2, "0")} ${pm ? "م" : "ص"}`; };
const EXT = {final: "فاينل", mta: "ميد", makeup: "ميد تعويضي"};
const SEMN = {"1": "الفصل الأول", "2": "الفصل الثاني", summer: "الفصل الصيفي"};
const pre = p => p ? p.split("+").map(g => g.split("|").join(" أو ")).join(" و ") : "لا يوجد";
const title = c => C[c] ? `${C[c][0]} / ${C[c][1]}` : (COURSES.find(x => x[0] === c) || [])[2] || "";

// مواعيد الاختبارات لكل مادة
const slots = {};
for (const [type, x] of Object.entries(CONFIG.examSchedule || {})) {
  Object.entries(x.days).forEach(([date, cols]) => cols.forEach((list, i) => list.split(" ").filter(Boolean).forEach(c => (slots[c] ??= []).push(`${x.title}: ${fmt(date)} من ${to12(x.times[i][0])} إلى ${to12(x.times[i][1])}`))));
  Object.entries(x.online || {}).forEach(([date, list]) => list.split(" ").forEach(c => (slots[c] ??= []).push(`${x.title} (محوسب): ${fmt(date)}، الوقت يتعلن بعدين`)));
}
const exams = Object.fromEntries(CONFIG.exams.map(e => [e.code, e]));
const lectures = {};
CONFIG.lectures.forEach(l => (lectures[l.code] ??= []).push(l));
const chats = {};
CONFIG.courseChats.forEach(g => g.items.forEach(([code, k]) => code.split(" / ").forEach(x => chats[x] ??= "https://chat.whatsapp.com/" + k)));
const plansOf = c => PLANS.filter(p => [...p.map, ...p.fe.list, ...p.ue].some(r => r[0] === c) || p.free.includes(c));

// ===== المعلومات العامة =====
const g = [];
g.push(`# معلومات الجامعة العربية المفتوحة - فرع الكويت (من موقع الطالب الأكاديمي asckwt.com)

## روابط الموقع
- الصفحة الرئيسية: ${SITE}
- المحاضرات المجانية: ${SITE}#lectures
- نماذج الاختبارات السابقة: ${SITE}#exams
- الخطط الدراسية وخريطة المتطلبات وصانع الخطة: ${SITE}#plans
- تقويم الفصل ومواعيد الاختبارات وجدول اختباراتي: ${SITE}#calendar
- حاسبة المعدل: ${SITE}#gpa
- قروبات الواتساب: ${SITE}#chats
- صفحة كل مادة: ${SITE}c/<رمز المادة بحروف صغيرة>/ مثل ${SITE}c/acc204/
- الاشتراك في شرح المواد مع الطالب الأكاديمي: واتساب ${CONFIG.whatsapp.map(w => w.number).join(" أو ")}، أو منصة https://app.academic-student.com
`);
g.push("## تقويم الفصل الحالي");
CONFIG.calendar.forEach(s => { g.push(`### ${s.title}`); s.items.forEach(e => g.push(`- ${e.name}: ${e.from ? fmt(e.from) : ""}${e.to && e.to !== e.from ? `${e.from ? " إلى " : "آخر موعد "}${fmt(e.to)}` : ""}${e.note ? ` (${e.note})` : ""}`)); });
g.push("\n## جدول اختبارات الفصل الحالي (حسب اليوم)");
for (const [, x] of Object.entries(CONFIG.examSchedule || {})) {
  g.push(`### ${x.title}`);
  Object.entries(x.days).forEach(([date, cols]) => g.push(`- ${fmt(date)}: ` + cols.map((l, i) => `[${to12(x.times[i][0])}-${to12(x.times[i][1])}] ${l}`).join(" | ")));
  Object.entries(x.online || {}).forEach(([date, l]) => g.push(`- ${fmt(date)} محوسب: ${l}`));
}
g.push("\n## دليل المواد (الرمز: العنوان الإنجليزي / العربي، الساعات)");
const all = new Set([...Object.keys(C), ...COURSES.map(c => c[0])]);
[...all].sort().forEach(c => g.push(`- ${c}: ${title(c)}، ${C[c]?.[2] ?? (COURSES.find(x => x[0] === c) || [])[1] ?? "?"} ساعات`));
g.push("\n## الخطط الدراسية");
g.push("الرموز: UE = اختياري جامعة، FE = اختياري كلية. المتطلب السابق بين قوسين.");
PLANS.forEach(p => {
  g.push(`### ${p.title} (${p.en}) - ${p.hrs} ساعة - ${p.srcNote}`);
  const byKind = {};
  p.map.forEach(([c, pr, k]) => (byKind[k] ??= []).push(`${c} (${pre(pr)})`));
  Object.entries(byKind).forEach(([k, l]) => g.push(`- ${KIND[k]}: ${l.join("، ")}`));
  g.push(`- متطلبات جامعة إجبارية بدون متطلب: ${p.free.join("، ")}`);
  g.push(`- اختياري جامعة (UE) تختار منها: ${p.ue.map(([c, pr]) => c + (pr ? ` (${pre(pr)})` : "")).join("، ")}`);
  g.push(`- اختياري كلية (FE) ${p.fe.hrs} ساعات: ${p.fe.list.map(([c, pr]) => `${c} (${pre(pr)})`).join("، ") || "-"}${p.fe.note ? `. ${p.fe.note}` : ""}`);
  if (p.note) g.push(`- ملاحظة: ${p.note}`);
  g.push(`- الخطة المقترحة فصل بفصل (${p.semNote}): ` + p.sem.map((s, i) => `الفصل ${i + 1}: ${s.join(" ")}`).join(" | "));
  g.push(`- المصدر الرسمي: ${p.src}`);
});
g.push("\n## قروبات الواتساب العامة");
CONFIG.chats.forEach(c => g.push(`- ${c.title}${c.note ? ` (${c.note})` : ""}: ${c.url}`));
g.push("\n## قروبات واتساب المواد");
g.push(Object.entries(chats).map(([c, u]) => `${c}: ${u}`).join("\n"));
g.push(`\n## سلم الدرجات وحساب المعدل
${GRADES.map(([l, pt, r]) => `- ${l}: ${r}، ${pt} نقاط`).join("\n")}
- أقل تقدير للنجاح D، والـ F يدخل في المعدل.
- تصنيف المعدل: ممتاز 3.67 فأعلى، جيد جداً 3.00، جيد 2.33، مقبول 2.00.
- المعدل = مجموع (نقاط التقدير × ساعات المادة) ÷ مجموع الساعات، ويتقرّب لأقرب منزلتين.
- المواد التمهيدية (EL097 إلى EL099) والمواد المعفاة والمعادلة وأي مادة خارج الخطة ما تدخل في المعدل.
- حاسبة المعدل بالموقع: ${SITE}#gpa (للتقدير، والمعدل الرسمي من بوابة الجامعة).`);
g.push("\n## المواد اللي لها نماذج اختبارات سابقة في الموقع (يفتحها الطالب من صفحة المادة، ومن قائمة النماذج فوق محادثة المساعد يقدر يحلها معاك)");
g.push(CONFIG.exams.map(e => `${e.code} (${e.items.length})`).join("، "));
g.push("\n## المواد اللي لها محاضرات مجانية مسجلة");
g.push(Object.keys(lectures).join("، "));

// معلومات مكتوبة باليد عن الجامعة (رسوم، أنظمة، أرقام تواصل...) في ai/facts.md
const facts = path.join(root, "ai", "facts.md");
if (fs.existsSync(facts)) g.push("\n" + fs.readFileSync(facts, "utf8").trim());

const dir = path.join(root, "ai", "kb");
fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir, {recursive: true});
fs.writeFileSync(path.join(dir, "general.md"), g.join("\n") + "\n");

// ===== ملف لكل مادة =====
const codes = new Set([...all, ...Object.keys(exams), ...Object.keys(lectures), ...Object.keys(slots)]);
let n = 0;
for (const c of codes) {
  if (!/^[A-Z0-9-]+$/.test(c)) continue;
  const L = [`# ${c}: ${title(c) || exams[c]?.name || ""}`];
  if (C[c]) L.push(`الساعات: ${C[c][2]}`);
  L.push(`صفحة المادة: ${SITE}c/${c.toLowerCase()}/`);
  const ps = plansOf(c);
  if (ps.length) {
    L.push("\n## في أي خطة ومتطلباتها");
    ps.forEach(p => { const r = [...p.map, ...p.fe.list, ...p.ue].find(r => r[0] === c); const opens = p.map.filter(([, pr]) => pr.split(/[+|]/).includes(c)).map(r => r[0]);
      L.push(`- ${p.title}: ${r ? `المتطلب السابق ${pre(r[1])}` : "بدون متطلب"}${r?.[2] ? `، النوع: ${KIND[r[2]]}` : p.fe.list.some(x => x[0] === c) ? "، اختياري كلية" : ""}${opens.length ? `، وتفتح: ${opens.join("، ")}` : ""}`); });
  }
  if (slots[c]) { L.push("\n## مواعيد اختبارات الفصل الحالي"); slots[c].forEach(s => L.push("- " + s)); }
  if (exams[c]) {
    L.push("\n## النماذج السابقة الموجودة في الموقع (PDF)");
    exams[c].items.forEach(e => L.push(`- ${EXT[e.type]} ${SEMN[e.sem]} ${e.year}، نسخة ${e.ver}، ${e.pages} صفحات: ${SITE}exams/${c}/${e.file}.pdf`));
  }
  if (lectures[c]) { L.push("\n## محاضرات مجانية مسجلة"); lectures[c].forEach(l => L.push(`- ${l.title}: ${l.url}${l.pass ? ` (الباسكود ${l.pass})` : ""}`)); }
  if (chats[c]) L.push(`\nقروب واتساب المادة: ${chats[c]}`);
  // كتاب المادة وفهرسه (اسم الكتاب والطبعة والشباتر) في ai/books/<المادة>.md
  const book = path.join(root, "ai", "books", c + ".md");
  if (fs.existsSync(book)) L.push("\n## كتاب المادة\n" + fs.readFileSync(book, "utf8").trim());
  fs.writeFileSync(path.join(dir, c + ".md"), L.join("\n") + "\n"); n++;
}

const ai = CONFIG.ai || {};
fs.writeFileSync(path.join(root, "ai", "config.js"), `// ينبني تلقائياً من CONFIG.ai في index.html، لا تعدله هني\nwindow.ASC_AI = ${JSON.stringify({endpoint: ai.endpoint || "", daily: +ai.daily || 15})};\n`);
console.log(`بنيت معلومات المساعد: general.md (${fs.statSync(path.join(dir, "general.md")).size} بايت) و ${n} ملف مادة`);
