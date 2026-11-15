// الشات مع أستاذ المادة: نص وصور (حل الطالب). يتحدث كل 20 ثانية والصفحة مفتوحة
"use strict";
(async () => {
  const {el, $, call, ago} = ASC;
  const course = (ASC.qs("course") || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 24);
  if (!ASC.token()) { location.replace("../"); return; }
  let page = null;
  call("course?id=" + encodeURIComponent(course)).then(p => {
    page = p;
    const d = p.doctor;
    $("who").textContent = d ? d.name : "الإدارة";
    $("av").textContent = d ? d.name.replace(/^(د|أ)\.\s*/, "").charAt(0) : "ط";
    $("sub").replaceChildren(el("bdi", {dir: "ltr"}, p.course.code), " · يرد عادة خلال يوم");
  }).catch(() => {});
  document.title = `اسأل الأستاذ · ${course} | الطالب الأكاديمي`;

  const imgs = {};
  function img(id) {
    const i = el("img", {alt: "صورة"});
    ASC.blobUrl(`chatimg?id=${id}`).then(b => { i.src = b.url; i.onclick = () => window.open(b.url, "_blank", "noopener"); }).catch(() => { i.alt = "ما قدرنا نفتح الصورة"; });
    return i;
  }
  let shown = "";
  async function load(scroll) {
    let r;
    try { r = await call("chat?course=" + encodeURIComponent(course)); }
    catch (e) { $("msgs").replaceChildren(el("p", {className: "empty"}, e.message)); $("send").hidden = true; return; }
    const sig = r.messages.map(m => m.id).join(",");
    if (sig === shown) return;
    shown = sig;
    const box = $("msgs");
    box.replaceChildren(...(r.messages.length ? r.messages.map(m => el("div", {className: "m " + (m.from_staff ? "them" : "me")},
      m.from_staff ? el("span", {className: "who"}, m.author) : null,
      m.image ? img(m.id) : null,
      m.body ? el("p", {}, m.body) : null,
      el("time", {}, ago(m.created) + (m.from_staff ? "" : " · ✓")))) : [el("p", {className: "empty"}, "اكتب سؤالك أو أرفق صورة حلّك، والأستاذ يرد عليك هني. المحادثة بينك وبينه بس.")]));
    if (scroll !== false) $("log").scrollTop = $("log").scrollHeight;
  }
  await load();
  setInterval(() => { if (!document.hidden) load(); }, 20000);

  // الصورة: نصغّرها قبل الرفع ونعرضها قبل الإرسال
  let pending = null;
  $("att").onclick = () => $("file").click();
  $("file").onchange = async () => {
    const f = $("file").files[0]; $("file").value = ""; if (!f) return;
    $("msg").textContent = "";
    try { pending = await ASC.shrink(f); } catch (e) { $("msg").textContent = e.message; return; }
    $("pv-img").src = URL.createObjectURL(pending); $("pv-name").textContent = "جاهزة ترسل"; $("pv").hidden = false;
  };
  $("pv-x").onclick = () => { pending = null; $("pv").hidden = true; };
  const t = $("text");
  t.oninput = () => { t.style.height = "auto"; t.style.height = Math.min(140, t.scrollHeight + 2) + "px"; };
  t.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey && matchMedia("(pointer:fine)").matches) { e.preventDefault(); $("send").requestSubmit(); } };
  $("send").onsubmit = async e => {
    e.preventDefault();
    const text = t.value.trim();
    if (!text && !pending) return;
    const btns = e.target.querySelectorAll("button"); btns.forEach(b => b.disabled = true);
    $("msg").textContent = "";
    try {
      if (pending) { await call("chatimg?course=" + encodeURIComponent(course), pending); pending = null; $("pv").hidden = true; }
      if (text) { await call("chat", {course, body: text}); t.value = ""; t.oninput(); }
      await load();
    } catch (err) { $("msg").textContent = err.message; }
    btns.forEach(b => b.disabled = false);
  };
})();
