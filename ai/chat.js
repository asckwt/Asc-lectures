/* مساعد الطالب الأكاديمي: زر عائم يفتح محادثة مع الذكاء الاصطناعي، يعرف الجامعة والمواد والخطط والمواعيد.
   ينضاف لما يكون CONFIG.ai.endpoint معبّى: صفحات المواد (من build-courses.js)، الصفحة الرئيسية، وصفحات بنك الأسئلة.
   <script src="../../ai/chat.js" data-endpoint="..." data-course="ACC204" data-name="..." data-daily="15" data-exams='[["ملف","اسم"]]' defer></script>
   بدون data-course = المساعد العام. وصفحات ثانية تقدر تسأله: ascAI.ask("السؤال") */
(() => {
const me = document.currentScript, D = {...window.ASC_AI, ...me.dataset};
if (!/^https:\/\//.test(D.endpoint || "") && !/^http:\/\/localhost/.test(D.endpoint || "")) return;
D.course = (D.course || "").toUpperCase();
const EXAMS = (() => { try { return JSON.parse(D.exams || "[]"); } catch { return []; } })();
const DAILY = +D.daily || 15, KEY = "ai-" + (D.course || "home"), TODAY = new Date().toISOString().slice(0, 10);
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const keep = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
let saved = load(KEY, {}), msgs = Array.isArray(saved.m) ? saved.m : [], exam = saved.e || "", used = load("ai-used", {});
if (used.d !== TODAY) used = {d: TODAY, n: 0};
let busy = false;

document.head.insertAdjacentHTML("beforeend", `<style>
.ai-fab{position:fixed;inset-inline-start:16px;bottom:16px;z-index:30;display:flex;align-items:center;gap:8px;border:0;cursor:pointer;
 font-family:var(--display);font-weight:700;font-size:15px;padding:12px 18px;border-radius:999px;background:var(--yellow);color:#07005E;box-shadow:0 6px 24px rgba(7,0,94,.25)}
.ai-box{position:fixed;inset-inline-start:16px;bottom:16px;z-index:31;width:min(400px,calc(100vw - 32px));height:min(600px,calc(100dvh - 32px));
 display:none;flex-direction:column;background:var(--surface);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 12px 40px rgba(7,0,94,.3)}
.ai-box.open{display:flex}
.ai-hd{background:var(--navy);color:#fff;padding:12px 14px;display:flex;align-items:center;gap:8px}
.ai-hd b{font-family:var(--display);font-size:15px;flex:1}
.ai-hd button{background:none;border:0;color:#D9D7F3;font-size:13px;cursor:pointer;font-family:inherit}
.ai-log{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
.ai-m{max-width:88%;padding:9px 13px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word;font-size:15px;line-height:1.7}
.ai-m.u{align-self:flex-start;background:var(--navy);color:#fff}
.ai-m.a{align-self:flex-end;background:var(--bg);border:1px solid var(--line)}
.ai-hint{color:var(--muted);font-size:13px;text-align:center;margin:auto 0}
.ai-sug{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:10px}
.ai-sug button{border:1px solid var(--line);background:var(--surface);color:var(--fg);border-radius:999px;padding:5px 11px;font:inherit;font-size:13px;cursor:pointer}
.ai-in{display:flex;gap:8px;padding:10px;border-top:1px solid var(--line)}
.ai-in textarea{flex:1;resize:none;border:1px solid var(--line);border-radius:12px;padding:9px 11px;font:inherit;font-size:15px;background:var(--bg);color:var(--fg);height:44px;max-height:120px}
.ai-in button{border:0;border-radius:12px;padding:0 16px;background:var(--navy);color:#fff;font-family:var(--display);font-weight:700;cursor:pointer}
.ai-in button:disabled{opacity:.5}
.ai-ex{padding:8px 10px;border-bottom:1px solid var(--line)}
.ai-ex select{width:100%;border:1px solid var(--line);border-radius:10px;padding:7px 9px;font:inherit;font-size:14px;background:var(--bg);color:var(--fg)}
.ai-ft{font-size:11px;color:var(--muted);text-align:center;padding:0 10px 8px}
</style>`);

const fab = Object.assign(document.createElement("button"), {className: "ai-fab", innerHTML: "🤖 اسأل مساعد المادة"});
const box = document.createElement("div");
box.className = "ai-box";
const TITLE = D.course ? `مساعد <bdi dir="ltr">${D.course}</bdi>` : "مساعد الطالب الأكاديمي";
fab.innerHTML = D.course ? "🤖 اسأل مساعد المادة" : "🤖 اسأل المساعد";
box.innerHTML = `<div class="ai-hd"><b>${TITLE}</b><button data-x="new">محادثة جديدة</button><button data-x="close" aria-label="إغلاق">✕</button></div>
${EXAMS.length ? `<div class="ai-ex"><select aria-label="نموذج سابق"><option value="">📄 اسأل عن نموذج اختبار سابق…</option>${EXAMS.map(([f, t]) => `<option value="${f}">${t}</option>`).join("")}</select></div>` : ""}
<div class="ai-log"></div>
<form class="ai-in"><textarea placeholder="اكتب سؤالك عن المادة…" maxlength="1500"></textarea><button>إرسال</button></form>
<div class="ai-ft">ذكاء اصطناعي وممكن يغلط، تأكد من المعلومات المهمة. <span class="ai-left"></span></div>`;
document.body.append(fab, box);
const log = box.querySelector(".ai-log"), ta = box.querySelector("textarea"), send = box.querySelector(".ai-in button"), left = box.querySelector(".ai-left");

const esc = t => t.replace(/[&<>]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;"})[c]);
const fmt = t => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/^#{1,4} (.+)$/gm, "<b>$1</b>");
const bubble = (role, text) => { const d = document.createElement("div"); d.className = "ai-m " + (role === "user" ? "u" : "a"); d.innerHTML = fmt(text); log.append(d); log.scrollTop = log.scrollHeight; return d; };
const exSel = box.querySelector(".ai-ex select");
const exName = () => (EXAMS.find(x => x[0] === exam) || [, ""])[1];
const SUG = () => exam ? ["حل لي السؤال الأول مع الشرح", "شنو المواضيع اللي يركز عليها هالنموذج؟", "عطني سؤال مشابه أتدرب عليه"]
  : D.course ? ["متى اختبار الميد والفاينل؟", "لخّص لي أهم مواضيع المادة", "عطني سؤال تدريب مع الحل", "شنو متطلبات المادة؟"]
  : ["متى الاختبارات النهائية؟", "شنو المواد اللي آخذها الفصل الجاي في المحاسبة؟", "شنو متطلبات B207A؟", "كيف أحسب معدلي؟"];
function draw() {
  log.innerHTML = "";
  if (exSel) exSel.value = exam;
  if (!msgs.length) {
    log.innerHTML = `<div class="ai-hint">${exam ? `فتحت معاك نموذج <b>${exName()}</b>، اسألني عن أي سؤال فيه.` : D.course ? `اسألني أي شي عن مادة <bdi dir="ltr">${D.course}</bdi>: شرح درس، مسألة، مواعيد الاختبار، أو نموذج سابق.` : "اسألني عن المواد، الخطط الدراسية والمتطلبات، مواعيد الاختبارات والتسجيل، أو أي درس."}<div class="ai-sug">${SUG().map(s => `<button type="button">${s}</button>`).join("")}</div></div>`;
    log.querySelectorAll(".ai-sug button").forEach(b => b.onclick = () => ask(b.textContent));
  } else msgs.forEach(m => bubble(m.role, m.content));
  left.textContent = `باقي لك اليوم ${Math.max(0, DAILY - used.n)} سؤال.`;
}

async function ask(q) {
  q = q.trim();
  if (!q || busy) return;
  if (used.n >= DAILY) { bubble("assistant", `خلصت أسئلتك لليوم (${DAILY} سؤال) 🙏 ترجع تقدر تسأل بكرة.`); return; }
  if (!msgs.length) log.innerHTML = "";
  busy = send.disabled = true; ta.value = "";
  msgs.push({role: "user", content: q}); bubble("user", q);
  const out = bubble("assistant", "…");
  let text = "";
  try {
    const r = await fetch(D.endpoint, {method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({course: D.course, name: D.name, exam, messages: msgs.slice(-11)})});
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

const open = () => { box.classList.add("open"); fab.hidden = true; draw(); };
const reset = () => { msgs = []; keep(KEY, {m: msgs, e: exam}); draw(); };
fab.onclick = () => { open(); ta.focus(); };
if (exSel) exSel.onchange = () => { if (busy) { exSel.value = exam; return; } exam = exSel.value; reset(); };
window.ascAI = {ask(q, fresh) { open(); if (fresh && !busy) { exam = ""; reset(); } ask(q); }};
box.querySelector("[data-x=close]").onclick = () => { box.classList.remove("open"); fab.hidden = false; };
box.querySelector("[data-x=new]").onclick = () => { if (!busy) { exam = ""; reset(); } };
box.querySelector("form").onsubmit = e => { e.preventDefault(); ask(ta.value); };
ta.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(ta.value); } };
})();
