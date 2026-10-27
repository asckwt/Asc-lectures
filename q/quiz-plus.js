/* إضافات صفحات الأسئلة: شريط التقدّم، إعادة الأسئلة الغلط، واختبار بوقت.
   يشتغل مع أي صفحة أسئلة فيها DATA و picks و save و render و tally، وينضاف بسطر واحد بعد سكربت الصفحة:
   <script src="../quiz-plus.js"></script> */
(() => {
const STORE = typeof KEY !== "undefined" ? KEY : location.pathname.split("/").filter(Boolean).pop().split("-")[0] + "q";
const $ = s => document.querySelector(s);
const qOf = id => { const [c, i] = id.split("-"); return DATA[c].qs[i]; };
const all = DATA.flatMap((c, ci) => c.qs.map((q, qi) => ({id: ci + "-" + qi, q, c})));
const wrongIds = () => Object.entries(picks).filter(([id, k]) => qOf(id).k !== k).map(([id]) => id);
const idOf = d => d.closest("section").dataset.c + "-" + (d.dataset.i ?? [...d.closest("section").querySelectorAll(".q")].indexOf(d));

document.head.insertAdjacentHTML("beforeend", `<style>
.prog{height:6px;border-radius:99px;background:var(--line);overflow:hidden;flex-basis:100%}
.prog i{display:block;height:100%;width:0;background:var(--ok);transition:width .3s}
.btn.hl{background:var(--navy);color:#fff}
.only{margin:14px 0 0;padding:10px 14px;border-radius:12px;background:var(--badbg);font-family:var(--display);font-weight:600;font-size:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.only button{margin-inline-start:auto}
.tq{position:fixed;inset:0;z-index:20;background:var(--bg);overflow:auto}
.tq .top{position:sticky;top:0;background:var(--navy);color:#fff;z-index:1}
.tq .top .wrap{display:flex;align-items:center;gap:12px;padding-block:12px;font-family:var(--display);font-weight:700}
.tq .clock{margin-inline-start:auto;background:var(--yellow);color:var(--navy);border-radius:99px;padding:2px 14px;font-variant-numeric:tabular-nums;direction:ltr}
.tq .clock.low{background:var(--bad);color:#fff}
.tq .x{border:0;background:none;color:#fff;font-size:24px;cursor:pointer;line-height:1}
.tq .body{padding-block:22px 40px}
.tq h2{font-family:var(--display);font-weight:800;font-size:24px;margin:0 0 6px}
.tq .pick{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}
.tq .pick .btn{font-size:16px;padding:12px 20px}
.tq .o.sel{border-color:var(--navy);background:var(--surface);font-weight:600}
.tq .o.sel .l{background:var(--navy);color:#fff}
.tq .nav{display:flex;gap:8px;margin-top:18px}
.tq .nav .btn{flex:1;padding:12px}
.tq .dots{display:flex;flex-wrap:wrap;gap:6px;margin-top:18px}
.tq .dots button{width:30px;height:30px;border-radius:8px;border:1.5px solid var(--line);background:var(--surface);color:var(--fg);font-size:12px;cursor:pointer}
.tq .dots .a{background:var(--opt);border-color:var(--muted)}
.tq .dots .cur{border-color:var(--navy);box-shadow:0 0 0 2px var(--navy)}
.tq .big{font-family:var(--display);font-weight:800;font-size:56px;line-height:1.1;color:var(--ok)}
.tq .big.low{color:var(--bad)}
.tq .rv{margin-top:14px;padding:12px 14px;border-radius:12px;background:var(--surface);border:1px solid var(--line)}
.tq .rv p{margin:4px 0 0;font-size:14px}
</style>`);

/* شريط التقدّم */
const prog = document.createElement("div");
prog.className = "prog"; prog.innerHTML = "<i></i>";
$(".bar .wrap").append(prog);
const baseTally = tally;
tally = function () { baseTally(); prog.firstChild.style.width = (Object.keys(picks).length / all.length * 100) + "%"; };

/* إعادة الأسئلة الغلط */
const tools = $(".tools");
const redo = Object.assign(document.createElement("button"), {className: "btn", id: "redo"});
const timed = Object.assign(document.createElement("button"), {className: "btn hl", textContent: "⏱ اختبار بوقت"});
tools.prepend(timed); tools.append(redo);
const only = document.createElement("div"); only.className = "only"; only.hidden = true;
tools.after(only);
const paintRedo = () => { const n = wrongIds().length; redo.textContent = `عيد اللي غلطت فيه (${n})`; redo.disabled = !n; redo.style.opacity = n ? 1 : .5; };
function showOnly(ids) {
  only.hidden = !ids;
  document.querySelectorAll(".q").forEach(d => d.hidden = !!ids && !ids.includes(idOf(d)));
  document.querySelectorAll("section").forEach(s => {
    s.hidden = false;
    s.querySelectorAll("h3.sub").forEach(h => { let n = h.nextElementSibling, any = false; while (n && n.matches(".q")) { any ||= !n.hidden; n = n.nextElementSibling; } h.hidden = !any; });
    s.querySelector(".ch").hidden = ![...s.querySelectorAll(".q")].some(d => !d.hidden);
  });
  if (ids) {
    document.querySelectorAll(".tab").forEach(x => x.setAttribute("aria-pressed", x.dataset.c === "all"));
    only.innerHTML = `<span>تحل الحين ${ids.length} سؤال غلطت فيهم قبل</span><button class="btn" type="button">اعرض كل الأسئلة</button>`;
    only.querySelector("button").onclick = () => showOnly(null);
  }
}
redo.onclick = () => {
  const ids = wrongIds(); if (!ids.length) return;
  ids.forEach(id => delete picks[id]); save(); render(); showOnly(ids); scrollTo({top: tools.offsetTop - 60});
};
const baseRender = render;
render = function () { baseRender(); only.hidden = true; };
const tally2 = tally;
tally = function () { tally2(); paintRedo(); };
tally();

/* اختبار بوقت: أسئلة عشوائية بدون ما تشوف الحل لين تخلص */
const L = "ABCDEFGHIJ";
const pool = all.filter(x => x.q.t !== "m" && x.q.o);
const best = () => { try { return JSON.parse(localStorage.getItem(STORE + "-best")); } catch { return null; } };
let box, timer;
function close() { clearInterval(timer); box?.remove(); box = null; document.body.style.overflow = ""; }
function shell(inner, clock = "") {
  if (!box) { box = document.createElement("div"); box.className = "tq"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "اختبار بوقت"); document.body.append(box); document.body.style.overflow = "hidden"; }
  box.innerHTML = `<div class="top"><div class="wrap"><button class="x" aria-label="اطلع">×</button><span>اختبار بوقت</span>${clock}</div></div><div class="wrap body">${inner}</div>`;
  box.querySelector(".x").onclick = close;
}
function start() {
  const b = best();
  const sizes = [10, 20, 30].filter(n => n < pool.length).concat(pool.length <= 30 ? [pool.length] : []);
  shell(`<h2>جاهز تختبر نفسك؟</h2><p style="color:var(--muted);margin:0">أسئلة عشوائية من كل الفصول، دقيقة لكل سؤال، والنتيجة والحل يطلعون بالنهاية مثل الاختبار الحقيقي.</p>
    <div class="pick">${sizes.map(n => `<button class="btn hl" data-n="${n}">${n} سؤال · ${n} دقيقة</button>`).join("")}</div>
    ${b ? `<p style="color:var(--muted)">أحسن نتيجة لك: <b style="color:var(--ok)">${b.ok} / ${b.n}</b></p>` : ""}`);
  box.querySelectorAll("[data-n]").forEach(x => x.onclick = () => run(+x.dataset.n));
}
function run(n) {
  const qs = [...pool].sort(() => Math.random() - .5).slice(0, n), ans = Array(n).fill(null);
  const end = Date.now() + n * 6e4;
  let i = 0;
  const left = () => Math.max(0, Math.round((end - Date.now()) / 1e3));
  const clockTxt = () => { const s = left(); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  function draw() {
    const {q} = qs[i];
    shell(`<p style="color:var(--muted);margin:0 0 8px;font-family:var(--display);font-weight:600">سؤال ${i + 1} من ${n}</p>
      <div class="q"><div class="qe"><span class="n">Q${i + 1}</span><div></div></div><div class="qa"></div><div class="os">${q.o.map((t, k) => `<button class="o${ans[i] === k ? " sel" : ""}" data-k="${k}"><span class="l">${L[k]}</span><span></span></button>`).join("")}</div></div>
      <div class="nav"><button class="btn" id="tq-p"${i ? "" : " disabled"}>السابق</button>${i < n - 1 ? `<button class="btn hl" id="tq-n">التالي</button>` : `<button class="btn hl" id="tq-f">سلّم الاختبار</button>`}</div>
      <div class="dots">${qs.map((_, j) => `<button class="${ans[j] !== null ? "a" : ""}${j === i ? " cur" : ""}" data-j="${j}">${j + 1}</button>`).join("")}</div>`,
      `<span class="clock${left() < 60 ? " low" : ""}" aria-live="off">${clockTxt()}</span>`);
    box.querySelector(".qe div").textContent = q.en; box.querySelector(".qa").textContent = q.ar || "";
    box.querySelectorAll(".o").forEach((b, k) => { b.lastChild.textContent = q.o[k]; b.onclick = () => { ans[i] = k; if (i < n - 1) { i++; } draw(); }; });
    box.querySelector("#tq-p").onclick = () => { i--; draw(); };
    box.querySelector("#tq-n")?.addEventListener("click", () => { i++; draw(); });
    box.querySelector("#tq-f")?.addEventListener("click", () => { const miss = ans.filter(a => a === null).length; if (!miss || confirmMiss(miss)) finish(); });
    box.querySelectorAll("[data-j]").forEach(b => b.onclick = () => { i = +b.dataset.j; draw(); });
  }
  let warned = false;
  const confirmMiss = m => { if (warned) return true; warned = true; const p = box.querySelector(".nav"); p.insertAdjacentHTML("afterend", `<p style="color:var(--bad);font-weight:600">باقي ${m} سؤال ما جاوبت عليهم، اضغط «سلّم الاختبار» مرة ثانية لو تبي تسلّم.</p>`); return false; };
  function finish() {
    clearInterval(timer);
    const ok = qs.filter((x, j) => ans[j] === x.q.k).length, pct = Math.round(ok / n * 100);
    const b = best(); if (!b || ok / n > b.ok / b.n) try { localStorage.setItem(STORE + "-best", JSON.stringify({ok, n})); } catch {}
    const wrong = qs.map((x, j) => ({...x, a: ans[j]})).filter(x => x.a !== x.q.k);
    shell(`<div class="big${pct < 50 ? " low" : ""}">${ok} / ${n}</div>
      <h2>${pct >= 90 ? "ممتاز، جاهز للاختبار 🔥" : pct >= 70 ? "زين، راجع الغلط وبتكون جاهز 👌" : pct >= 50 ? "ناجح، بس تحتاج مراجعة أكثر 💪" : "لا تشيل هم، راجع الفصول وعيد المحاولة 📚"}</h2>
      <p style="color:var(--muted);margin:0">نسبتك ${pct}%${left() ? "" : " · خلص الوقت"}</p>
      <div class="pick"><button class="btn hl" id="tq-again">اختبار جديد</button><button class="btn" id="tq-close">رجوع للأسئلة</button></div>
      ${wrong.length ? `<h2 style="font-size:19px;margin-top:10px">الأسئلة اللي غلطت فيها</h2>` + wrong.map(x => `<div class="rv"><b dir="ltr" style="display:block;text-align:left"></b><p style="color:var(--bad)">${x.a === null ? "ما جاوبت" : "جوابك: <bdi></bdi>"}</p><p style="color:var(--ok)">الصح: <bdi></bdi></p></div>`).join("") : ""}`);
    box.querySelectorAll(".rv").forEach((r, j) => {
      const x = wrong[j], bd = r.querySelectorAll("bdi");
      r.querySelector("b").textContent = x.q.en;
      if (x.a !== null) bd[0].textContent = x.q.o[x.a];
      bd[bd.length - 1].textContent = x.q.o[x.q.k] + (x.q.ans ? ` (${x.q.ans})` : "");
    });
    box.querySelector("#tq-again").onclick = start; box.querySelector("#tq-close").onclick = close;
    window.gtag?.("event", "quiz_timed", {page: STORE, score: ok, total: n});
  }
  timer = setInterval(() => { const c = box?.querySelector(".clock"); if (!c) return; c.textContent = clockTxt(); c.classList.toggle("low", left() < 60); if (!left()) finish(); }, 1e3);
  draw();
}
timed.onclick = start;
addEventListener("keydown", e => { if (e.key === "Escape" && box) close(); });
})();

/* مساعد الذكاء الاصطناعي: زر "ليش غلط؟" تحت كل سؤال غلطت فيه، يشرح لك السبب.
   يشتغل بس لما يكون المساعد مفعّل (ai/config.js ينبني من CONFIG.ai في index.html). */
(() => {
const course = (typeof KEY !== "undefined" ? KEY : location.pathname.split("/").filter(Boolean).pop()).replace(/q$|-.*$/, "").toUpperCase();
const add = (src, data) => new Promise(ok => { const s = Object.assign(document.createElement("script"), {src}); Object.assign(s.dataset, data || {}); s.onload = s.onerror = ok; document.body.append(s); });
add("../../ai/config.js").then(() => {
  if (!window.ASC_AI?.endpoint) return;
  add("../../ai/chat.js", {course});
  document.head.insertAdjacentHTML("beforeend", `<style>.why{margin-top:8px;border:1px solid var(--line);background:var(--surface);color:var(--fg);border-radius:99px;padding:4px 12px;font:inherit;font-size:13px;cursor:pointer}</style>`);
  const L = "ABCDEFGHIJ";
  const paint = () => document.querySelectorAll(".q.done").forEach(d => {
    const s = d.closest("section"); if (!s || d.querySelector(".why")) return;
    const ci = s.dataset.c, qi = d.dataset.i ?? [...s.querySelectorAll(".q")].indexOf(d), id = ci + "-" + qi, q = DATA[ci].qs[qi], k = picks[id];
    if (k === undefined || k === q.k) return;
    const b = Object.assign(document.createElement("button"), {className: "why", type: "button", textContent: "🤖 ليش جوابي غلط؟"});
    const opt = i => q.t === "m" ? DATA[ci].defs[i] : q.o[i];
    b.onclick = () => window.ascAI?.ask(`غلطت في هالسؤال من بنك أسئلة ${course}، وضّح لي ليش جوابي غلط وليش الصح صح:\n\nالسؤال: ${q.en}${q.ar ? `\n(${q.ar})` : ""}${q.o ? `\nالخيارات:\n${q.o.map((t, i) => `${L[i]}) ${t}`).join("\n")}` : ""}\n\nجوابي: ${opt(k)}\nالجواب الصحيح: ${opt(q.k)}${q.ans ? ` (${q.ans})` : ""}`, true);
    d.querySelector(".res").after(b);
  });
  const t = tally; tally = function () { t(); paint(); }; paint();
});
})();
