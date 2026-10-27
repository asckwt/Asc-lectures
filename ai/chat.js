/* مساعد الطالب الأكاديمي: زر عائم يفتح محادثة مع الذكاء الاصطناعي، يعرف الجامعة والمواد والخطط والمواعيد.
   ينضاف لما يكون CONFIG.ai.endpoint معبّى: صفحات المواد (من build-courses.js)، الصفحة الرئيسية، وصفحات بنك الأسئلة.
   <script src="../../ai/chat.js" data-endpoint="..." data-course="ACC204" data-name="..." data-daily="15" data-exams='[["ملف","اسم"]]' defer></script>
   بدون data-course = المساعد العام. وصفحات ثانية تقدر تسأله: ascAI.ask("السؤال") */
(() => {
const D = {...window.ASC_AI, ...document.currentScript.dataset};
if (!/^https:\/\//.test(D.endpoint || "") && !/^http:\/\/localhost/.test(D.endpoint || "")) return;
D.course = (D.course || "").toUpperCase();
const EXAMS = (() => { try { return JSON.parse(D.exams || "[]"); } catch { return []; } })();
const DAILY = +D.daily || 15, KEY = "ai-" + (D.course || "home"), TODAY = new Date().toISOString().slice(0, 10);
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const keep = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
let saved = load(KEY, {}), msgs = Array.isArray(saved.m) ? saved.m : [], exam = saved.e || "", used = load("ai-used", {});
if (used.d !== TODAY) used = {d: TODAY, n: 0};
let busy = false, me = load("ai-me", {}), file = null;

document.head.insertAdjacentHTML("beforeend", `<style>
.ai-fab,.ai-box button{margin:0;width:auto;transition:none}
.ai-fab{position:fixed;inset-inline-start:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:30;display:flex;align-items:center;gap:8px;border:0;cursor:pointer;
 font-family:var(--display);font-weight:700;font-size:15px;padding:12px 18px;border-radius:999px;background:var(--yellow);color:#07005E;box-shadow:0 6px 24px rgba(7,0,94,.25)}
.ai-box{position:fixed;inset-inline-start:16px;bottom:16px;z-index:31;width:min(400px,calc(100vw - 32px));height:min(600px,calc(100dvh - 32px));
 display:none;flex-direction:column;background:var(--surface);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 12px 40px rgba(7,0,94,.3)}
.ai-box.open{display:flex}
.ai-fab.ai-off{display:none}
.ai-hd{background:var(--navy);color:#fff;padding:10px 12px;display:flex;align-items:center;gap:10px}
.ai-hd b{flex:1;min-width:0;display:flex;align-items:center;gap:10px}
.ai-hd b>span:last-child{min-width:0;display:flex;flex-direction:column;gap:1px}
.ai-hd b i{font-style:normal;font-family:var(--display);font-size:16px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ai-hd b small{font-family:var(--body);font-weight:400;font-size:12px;line-height:1.2;color:#9FE8DC;white-space:nowrap}
.ai-av{flex:none;width:36px;height:36px;border-radius:50%;background:var(--yellow);display:grid;place-items:center;font-size:19px}
.ai-hd nav{flex:none;display:flex;gap:6px}
.ai-box .ai-hd button{width:36px;height:36px;padding:0;border:0;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.1);color:#fff;cursor:pointer}
.ai-box .ai-hd button:hover{background:rgba(255,255,255,.2)}
.ai-hd svg{width:18px;height:18px}
.ai-log{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
.ai-m{max-width:90%;padding:10px 14px;border-radius:16px;word-wrap:break-word;font-size:15px;line-height:1.75}
.ai-m p{margin:0 0 6px}.ai-m p:last-child{margin:0}
.ai-m ul,.ai-m ol{margin:4px 0 8px;padding-inline-start:20px}.ai-m li{margin:2px 0}
.ai-m h4{margin:8px 0 4px;font-family:var(--display);font-size:15px;color:var(--accent-ink,var(--navy))}
.ai-tb{overflow-x:auto;margin:6px 0 8px}
.ai-m table{border-collapse:collapse;font-size:14px;min-width:100%}
.ai-m th,.ai-m td{border:1px solid var(--line);padding:5px 7px;text-align:start;vertical-align:top}
.ai-m th{background:rgba(125,230,213,.15);font-weight:700}
.ai-m hr{border:0;border-top:1px solid var(--line);margin:8px 0}
.ai-m code{background:rgba(7,0,94,.07);border-radius:5px;padding:0 4px;font-size:.92em}
.ai-m a{color:#2B6CB0;font-weight:700;text-decoration:underline;word-break:break-all}
.ai-m.u a{color:#fff}
.ai-dots{display:inline-flex;gap:4px;padding:4px 0}.ai-dots i{width:7px;height:7px;border-radius:50%;background:var(--muted);animation:aib 1s infinite}
.ai-dots i:nth-child(2){animation-delay:.15s}.ai-dots i:nth-child(3){animation-delay:.3s}
@keyframes aib{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
.ai-m.u{align-self:flex-start;background:var(--navy);color:#fff;border-end-start-radius:4px}
.ai-m.a{align-self:flex-end;background:var(--bg);border:1px solid var(--line);border-end-end-radius:4px}
.ai-hint{color:var(--muted);font-size:14px;line-height:1.7;text-align:center;margin:auto 0}
.ai-sug{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:10px}
.ai-sug button{border:1px solid var(--line);background:var(--surface);color:var(--fg);border-radius:999px;padding:5px 11px;font:inherit;font-size:13px;cursor:pointer}
.ai-in{padding:10px 10px 6px;border-top:1px solid var(--line);background:var(--surface)}
.ai-row{display:flex;align-items:flex-end;gap:4px;border:1.5px solid var(--line);border-radius:22px;background:var(--bg);padding:4px;transition:border-color .15s}
.ai-row:focus-within{border-color:var(--navy)}
.ai-in textarea{flex:1;min-width:0;width:auto;margin:0;resize:none;border:0;outline:0;background:none;color:var(--fg);font:inherit;font-size:16px;line-height:1.5;padding:7px 6px;height:38px;max-height:140px}
.ai-box .ai-ic{flex:none;width:36px;height:36px;border:0;border-radius:50%;padding:0;display:grid;place-items:center;cursor:pointer;background:none;color:var(--muted);font-size:19px}
.ai-box .ai-ic svg{width:20px;height:20px}
.ai-box .ai-ic.go{background:var(--navy);color:#fff}
.ai-box .ai-ic:disabled{opacity:.45;cursor:default}
.ai-att[hidden]{display:none}
.ai-att{display:flex;align-items:center;gap:8px;margin:0 4px 8px;padding:6px 8px;border:1px solid var(--line);border-radius:12px;background:var(--bg);font-size:13px}
.ai-att img{width:38px;height:38px;object-fit:cover;border-radius:8px}
.ai-att span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ai-att button{border:0;background:none;color:var(--muted);font-size:16px;cursor:pointer;padding:0 4px}
.ai-m .ai-img{display:block;max-width:100%;max-height:160px;width:auto;border-radius:10px;margin-bottom:6px}
@media (max-width:520px){.ai-box{inset:0;width:100%;height:100dvh;border-radius:0;border:0}.ai-hd{padding-top:calc(10px + env(safe-area-inset-top,0px))}.ai-ft{padding-bottom:calc(8px + env(safe-area-inset-bottom,0px))}}
.ai-m .ai-fl{display:inline-block;background:rgba(255,255,255,.15);border-radius:8px;padding:2px 8px;margin-bottom:6px;font-size:13px}
.ai-me{background:var(--bg);border:1px solid var(--line);border-radius:14px;padding:14px;display:grid;gap:8px;font-size:14px}
.ai-me b{font-family:var(--display);font-size:15px}
.ai-me input,.ai-me select{width:100%;margin:0;border:1px solid var(--line);border-radius:10px;padding:9px 10px;font:inherit;font-size:16px;background:var(--surface);color:var(--fg)}
.ai-me .ai-bt{margin:4px 0 0;width:100%;border:0;border-radius:10px;padding:10px;background:var(--navy);color:#fff;font-family:var(--display);font-weight:700;font-size:15px;cursor:pointer}
.ai-me .ai-sk{background:none;color:var(--muted);font-weight:400;padding:4px;margin:0}
.ai-hello{font-family:var(--display);font-size:17px;color:var(--fg);margin-bottom:6px}
.ai-ex{padding:8px 10px;border-bottom:1px solid var(--line)}
.ai-ex select{width:100%;border:1px solid var(--line);border-radius:10px;padding:7px 9px;font:inherit;font-size:14px;background:var(--bg);color:var(--fg)}
.ai-top{margin:20px 0 0;max-width:560px}
.ai-top small{display:block;font-size:14px;font-weight:700;margin-bottom:6px}
.ai-top form{display:flex;gap:6px;background:#fff;border:2px solid var(--turq,#4FD1C0);border-radius:14px;padding:5px}
.ai-top input{flex:1;min-width:0;width:auto;margin:0;border:0;background:none;color:#151238;font:inherit;font-size:16px;padding:9px 10px;outline:0}
.ai-top button{flex:none;margin:0;width:auto;border:0;border-radius:10px;padding:0 18px;background:var(--navy,#07005E);color:#fff;font-family:var(--display);font-weight:700;font-size:15px;cursor:pointer}
.ai-fab.ai-up{inset-inline-start:auto;inset-inline-end:16px}
.ai-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.ai-chips button{margin:0;width:auto;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.08);color:inherit;border-radius:999px;padding:5px 12px;font:inherit;font-size:13px;cursor:pointer;transition:background .15s}
.ai-chips button:hover{background:rgba(255,255,255,.18)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .ai-m.a a{color:#9FE8DC}:root:not([data-theme="light"]) .ai-m code{background:rgba(255,255,255,.1)}}
:root[data-theme="dark"] .ai-m.a a{color:#9FE8DC}:root[data-theme="dark"] .ai-m code{background:rgba(255,255,255,.1)}
.ai-ft{font-size:11px;color:var(--muted);text-align:center;padding:2px 10px 8px;background:var(--surface)}
</style>`);

const fab = Object.assign(document.createElement("button"), {className: "ai-fab", innerHTML: "🤖 اسأل مساعد المادة"});
const box = document.createElement("div");
box.className = "ai-box";
const TITLE = D.course ? `مساعد <bdi dir="ltr">${D.course}</bdi>` : "المساعد الأكاديمي";
fab.innerHTML = D.course ? "🤖 اسأل مساعد المادة" : "🤖 اسأل المساعد";
box.innerHTML = `<div class="ai-hd"><b><span class="ai-av">🤖</span><span><i>${TITLE}</i><small>● متصل الحين</small></span></b><nav><button data-x="me" title="معلوماتي" aria-label="معلوماتي"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></button><button data-x="new" title="محادثة جديدة" aria-label="محادثة جديدة"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button><button data-x="close" title="إغلاق" aria-label="إغلاق"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></nav></div>
${EXAMS.length ? `<div class="ai-ex"><select aria-label="نموذج سابق"><option value="">📄 اسأل عن نموذج اختبار سابق…</option>${EXAMS.map(([f, t]) => `<option value="${f}">${t}</option>`).join("")}</select></div>` : ""}
<div class="ai-log"></div>
<form class="ai-in"><div class="ai-att" hidden></div><div class="ai-row">
<button type="button" class="ai-ic" data-x="clip" title="أرفق صورة أو ملف PDF" aria-label="أرفق صورة أو ملف"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5l-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9"/></svg></button>
<textarea rows="1" dir="auto" enterkeyhint="send" placeholder="${D.course ? "اكتب سؤالك عن المادة…" : "اكتب سؤالك…"}" maxlength="1500"></textarea>
<button class="ai-ic go" aria-label="إرسال"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12H5M11 5l-7 7 7 7"/></svg></button>
</div><input type="file" accept="image/*,application/pdf" hidden></form>
<div class="ai-ft">ذكاء اصطناعي وممكن يغلط، تأكد من المعلومات المهمة. <span class="ai-left"></span></div>`;
document.body.append(fab, box);
// إذا فيه زر واتساب عايم بنفس المكان، زر المساعد ينتقل للجهة الثانية
if (document.querySelector(".wafab")) fab.classList.add("ai-up");
const log = box.querySelector(".ai-log"), ta = box.querySelector("textarea"), send = box.querySelector(".ai-ic.go"), att = box.querySelector(".ai-att"), picker = box.querySelector("input[type=file]"), left = box.querySelector(".ai-left");

const esc = t => t.replace(/[&<>]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;"})[c]);
// ماركداون بسيط: عناوين، خط عريض، نقاط وأرقام، وروابط تنفتح
const inl = t => t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>")
  .replace(/https?:\/\/[^\s<)\]،"]+/g, u => { const s = u.replace(/[.,:;!?]+$/, ""); return `<a href="${s}" target="_blank" rel="noopener" dir="ltr">${s.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}${s.length > 48 ? "…" : ""}</a>${u.slice(s.length)}`; });
const fmt = t => { let h = "", list = "";
  const close = () => { if (list) { h += list === "table" ? "</table></div>" : `</${list}>`; list = ""; } };
  esc(t).split("\n").forEach(l => {
    let m;
    // جداول (القيود المحاسبية وجداول الإهلاك): الصف الأول عنوان، وسطر --- يتخطاه
    if (/^\s*\|.*\|\s*$/.test(l)) { const cells = l.trim().slice(1, -1).split("|").map(c => c.trim());
      if (cells.every(c => /^:?-{2,}:?$/.test(c))) return;
      if (list !== "table") { close(); h += '<div class="ai-tb"><table>'; list = "table"; h += `<tr>${cells.map(c => `<th>${inl(c)}</th>`).join("")}</tr>`; }
      else h += `<tr>${cells.map(c => `<td>${inl(c)}</td>`).join("")}</tr>`; }
    else if ((m = l.match(/^\s*[-•*] (.+)/))) { if (list !== "ul") { close(); h += "<ul>"; list = "ul"; } h += `<li>${inl(m[1])}</li>`; }
    else if ((m = l.match(/^\s*\d+[.)] (.+)/))) { if (list !== "ol") { close(); h += "<ol>"; list = "ol"; } h += `<li>${inl(m[1])}</li>`; }
    else { close(); if ((m = l.match(/^#{1,4} (.+)/))) h += `<h4>${inl(m[1])}</h4>`; else if (/^-{3,}$/.test(l.trim())) h += "<hr>"; else if (l.trim()) h += `<p>${inl(l)}</p>`; }
  });
  close(); return h; };
const bubble = (role, text, f) => { const d = document.createElement("div"); d.className = "ai-m " + (role === "user" ? "u" : "a");
  d.innerHTML = (f ? (f.url ? `<img class="ai-img" src="${f.url}" alt="">` : `<span class="ai-fl">📎 ${esc(f.name)}</span>`) : "") + fmt(text);
  log.append(d); log.scrollTop = log.scrollHeight; return d; };
const exSel = box.querySelector(".ai-ex select");
const exName = () => (EXAMS.find(x => x[0] === exam) || [, ""])[1];
const SUG = () => exam ? ["حل لي السؤال الأول مع الشرح", "شنو المواضيع اللي يركز عليها هالنموذج؟", "عطني سؤال مشابه أتدرب عليه"]
  : D.course ? ["متى اختبار الميد والفاينل؟", "لخّص لي أهم مواضيع المادة", "عطني سؤال تدريب مع الحل", "شنو متطلبات المادة؟"]
  : ["متى الاختبارات النهائية؟", "شنو المواد اللي آخذها الفصل الجاي في المحاسبة؟", "شنو متطلبات B207A؟", "كيف أحسب معدلي؟"];
const MAJORS = ["محاسبة", "تسويق", "إدارة", "اقتصاد", "نظم", "نظم المعلومات الإدارية (MIS)", "تقنية المعلومات (IT)", "أدب إنجليزي", "تمهيدي / ما حددت"];
function profile() {
  log.innerHTML = `<form class="ai-me"><b>👋 عرّفني عليك</b><span>عشان أعرفك وأجاوبك على حسب تخصصك ومواد فصلك. تنحفظ بجهازك بس.</span>
<input name="name" maxlength="40" placeholder="اسمك" autocomplete="given-name">
<select name="major"><option value="">تخصصك</option>${MAJORS.map(m => `<option>${m}</option>`).join("")}</select>
<input name="courses" maxlength="200" dir="auto" placeholder="مواد هالفصل، مثلاً ACC204, MKT111">
<button class="ai-bt">احفظ</button><button type="button" class="ai-bt ai-sk">مو الحين</button></form>`;
  const f = log.querySelector("form");
  ["name", "major", "courses"].forEach(k => f[k].value = me[k] || "");
  f.onsubmit = e => { e.preventDefault(); me = {name: f.name.value.trim(), major: f.major.value, courses: f.courses.value.trim(), set: 1}; keep("ai-me", me); draw(); ta.focus(); };
  f.querySelector(".ai-sk").onclick = () => { me.set = 1; keep("ai-me", me); draw(); };
}
function draw() {
  log.innerHTML = "";
  if (exSel) exSel.value = exam;
  if (!msgs.length && !me.set) return profile();
  if (!msgs.length) {
    log.innerHTML = `<div class="ai-hint"><div class="ai-hello">${me.name ? `هلا ${esc(me.name)} 👋` : "هلا 👋"}</div>${exam ? `فتحت معاك نموذج <b>${exName()}</b>، اسألني عن أي سؤال فيه.` : D.course ? `اسألني أي شي عن مادة <bdi dir="ltr">${D.course}</bdi>: شرح درس، مسألة، مواعيد الاختبار، أو نموذج سابق.` : "اسألني عن المواد، الخطط الدراسية والمتطلبات، مواعيد الاختبارات والتسجيل، أو أي درس."}<div class="ai-sug">${SUG().map(s => `<button type="button">${s}</button>`).join("")}</div></div>`;
    log.querySelectorAll(".ai-sug button").forEach(b => b.onclick = () => ask(b.textContent));
  } else msgs.forEach(m => bubble(m.role, m.content));
  left.textContent = `باقي لك اليوم ${Math.max(0, DAILY - used.n)} سؤال.`;
}

async function ask(q) {
  q = q.trim();
  if (busy || (!q && !file)) return;
  if (!q) q = file.type === "application/pdf" ? "شوف الملف المرفق وساعدني فيه." : "شوف الصورة المرفقة وساعدني فيها.";
  if (used.n >= DAILY) { bubble("assistant", `خلصت أسئلتك لليوم (${DAILY} سؤال) 🙏 ترجع تقدر تسأل بكرة.`); return; }
  if (!msgs.length) log.innerHTML = "";
  busy = send.disabled = true; ta.value = ""; grow();
  const f = file; setFile(null, true);
  msgs.push({role: "user", content: f ? `📎 ${f.name}\n${q}` : q}); bubble("user", q, f);
  const out = bubble("assistant", ""); out.innerHTML = '<span class="ai-dots"><i></i><i></i><i></i></span>';
  let text = "";
  try {
    const r = await fetch(D.endpoint, {method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({course: D.course, name: D.name, exam, student: me.name || me.major || me.courses ? {name: me.name, major: me.major, courses: me.courses} : undefined,
        file: f ? {type: f.type, data: f.data, name: f.name} : undefined, messages: msgs.slice(-11)})});
    if (!r.ok) throw new Error(await r.text());
    const rd = r.body.getReader(), dec = new TextDecoder();
    for (;;) { const {done, value} = await rd.read(); if (done) break; text += dec.decode(value, {stream: true}); out.innerHTML = fmt(text); log.scrollTop = log.scrollHeight; }
    used.n++; keep("ai-used", used);
    msgs.push({role: "assistant", content: text || "…"});
    if (typeof gtag === "function") gtag("event", "ai_question", {course: D.course});
  } catch (e) {
    msgs.pop();
    out.innerHTML = fmt(e.message && e.message.length < 200 && /[؀-ۿ]/.test(e.message) ? e.message : "ما قدرت أوصل للمساعد، تأكد من الإنترنت وجرّب مرة ثانية.");
  }
  keep(KEY, {m: msgs.slice(-21), e: exam});
  busy = send.disabled = false;
  left.textContent = `باقي لك اليوم ${Math.max(0, DAILY - used.n)} سؤال.`;
}

// المرفقات: الصور تتصغر بالجهاز قبل الإرسال (أسرع وأرخص)، والـ PDF لين 4 ميغا
const grow = () => { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 140) + "px"; };
function setFile(f, sent) {
  if (file?.url && !sent) URL.revokeObjectURL(file.url);
  file = f; att.hidden = !f;
  att.innerHTML = f ? `${f.url ? `<img src="${f.url}" alt="">` : "📄"}<span>${esc(f.name)}</span><button type="button" aria-label="شيل المرفق">✕</button>` : "";
  if (f) att.querySelector("button").onclick = () => setFile(null);
}
const b64 = blob => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result.split(",")[1]); r.onerror = no; r.readAsDataURL(blob); });
async function pick(f) {
  const warn = t => bubble("assistant", t);
  if (f.type === "application/pdf") {
    if (f.size > 4e6) return warn("الملف كبير 🙏 الحد 4 ميغا. جرّب ترسل الصفحات اللي تبيها بس، أو صورة لها.");
    return setFile({type: f.type, name: f.name, data: await b64(f)});
  }
  if (!f.type.startsWith("image/")) return warn("أقدر أقرا الصور وملفات PDF بس.");
  try {
    const img = await createImageBitmap(f), k = Math.min(1, 1568 / Math.max(img.width, img.height));
    const c = Object.assign(document.createElement("canvas"), {width: Math.round(img.width * k), height: Math.round(img.height * k)});
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise(ok => c.toBlob(ok, "image/jpeg", .85));
    setFile({type: "image/jpeg", name: f.name || "صورة", data: await b64(blob), url: URL.createObjectURL(blob)});
  } catch { warn("ما قدرت أفتح الصورة، جرّب صورة ثانية (JPG أو PNG)."); }
}
box.querySelector("[data-x=clip]").onclick = () => picker.click();
picker.onchange = () => { if (picker.files[0]) pick(picker.files[0]); picker.value = ""; ta.focus(); };
ta.oninput = grow;
ta.onpaste = e => { const f = [...(e.clipboardData?.files || [])][0]; if (f) { e.preventDefault(); pick(f); } };
box.querySelector("[data-x=me]").onclick = () => { if (!busy) profile(); };
const open = () => { box.classList.add("open"); fab.hidden = true; draw(); };
const reset = () => { msgs = []; setFile(null); keep(KEY, {m: msgs, e: exam}); draw(); };
fab.onclick = () => { open(); ta.focus(); };
if (exSel) exSel.onchange = () => { if (busy) { exSel.value = exam; return; } exam = exSel.value; reset(); };
window.ascAI = {ask(q, fresh) { open(); if (fresh && !busy) { exam = ""; reset(); } ask(q); }};
// خانة "اسأل المساعد" فوق بالصفحة: تحت بحث الرئيسية، أو آخر الهيدر بصفحات المواد
const spot = document.querySelector("[data-ai-top]") || document.querySelector(".hero-search") || document.querySelector("header .wrap");
if (spot) {
  const top = document.createElement("div");
  top.className = "ai-top";
  top.innerHTML = `<small>🤖 مساعد ذكي يعرف ${D.course ? "هالمادة ونماذجها ومواعيدها" : "موادك ومواعيدك وخططك ونماذج الاختبارات"}</small><form><input type="text" enterkeyhint="send" dir="auto" maxlength="1500" placeholder="${D.course ? "اسأل عن المادة… مثلاً متى الفاينل؟" : "اسأل أي شي عن الجامعة والمواد…"}" aria-label="اسأل المساعد"><button>اسأل</button></form><div class="ai-chips">${(D.course ? ["متى الفاينل؟", "لخص لي أهم المواضيع", "حل لي نموذج سابق"] : ["متى اختباراتي؟", "كم رسوم الساعة؟", "كيف أأجل اختبار؟", "ساعدني بالـ TMA"]).map(s => `<button type="button">${s}</button>`).join("")}</div>`;
  spot.matches(".wrap") ? spot.append(top) : spot.after(top);
  const qi = top.querySelector("input");
  top.querySelector("form").onsubmit = e => { e.preventDefault(); const q = qi.value; qi.value = ""; qi.blur(); open(); ask(q); };
  top.querySelectorAll(".ai-chips button").forEach(b => b.onclick = () => { open(); ask(b.textContent); });
  // الزر العايم يطلع بس لما تنزل وتختفي الخانة
  if ("IntersectionObserver" in window) new IntersectionObserver(([en]) => fab.classList.toggle("ai-off", en.isIntersecting)).observe(top);
}
box.querySelector("[data-x=close]").onclick = () => { box.classList.remove("open"); fab.hidden = false; };
box.querySelector("[data-x=new]").onclick = () => { if (!busy) { exam = ""; reset(); } };
box.querySelector("form").onsubmit = e => { e.preventDefault(); ask(ta.value); };
ta.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(ta.value); } };
})();
