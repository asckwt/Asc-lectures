// الشكاوي والاقتراحات: يرسل ويشوف الرد، ويشوف تقييماته والرد عليها
"use strict";
(async () => {
  const {el, $, call, ago, stars} = ASC;
  ASC.header("support");
  if (!ASC.token()) { $("login").hidden = false; return; }
  const KIND = {suggestion: "💡 اقتراح", complaint: "😕 شكوى", tech: "🛠️ مشكلة تقنية", payment: "💳 الدفع والاشتراك"};
  const ST = {open: "وصلتنا", working: "نشتغل عليها", solved: "انحلت ✓"};
  let me;
  try { me = await call("me"); } catch (e) { $("login").hidden = false; return; }
  $("unread").textContent = me.unread || "";
  $("f").hidden = false;
  $("f").course.append(...me.courses.map(c => el("option", {value: c.code}, c.code)));
  async function load() {
    const r = await call("tickets");
    $("mine").hidden = !r.tickets.length;
    $("list").replaceChildren(...r.tickets.map(t => el("article", {className: "tk"},
      el("div", {className: "row", style: "justify-content:space-between"}, el("b", {}, KIND[t.kind] || t.kind, t.course ? el("bdi", {dir: "ltr", className: "muted", style: "font-weight:500"}, " · " + t.course) : null), el("span", {className: "st " + t.status}, ST[t.status])),
      el("p", {style: "margin:0;white-space:pre-wrap"}, t.message),
      t.reply ? el("div", {className: "reply"}, el("b", {}, "ردنا: "), t.reply) : null,
      el("small", {className: "muted"}, ago(t.created)))));
    $("rates").hidden = !r.ratings.length;
    $("rlist").replaceChildren(...r.ratings.map(x => el("article", {className: "tk"},
      el("div", {className: "row", style: "justify-content:space-between"}, el("a", {href: `../course/?id=${encodeURIComponent(x.course)}`}, el("bdi", {dir: "ltr"}, x.course)), stars(x.stars)),
      x.comment ? el("p", {style: "margin:0"}, x.comment) : null,
      el("small", {className: "muted"}, x.status === "pending" ? "قيد المراجعة" : x.status === "hidden" ? "مخفي" : "منشور"),
      x.reply ? el("div", {className: "reply"}, el("b", {}, "الرد: "), x.reply) : null)));
  }
  $("f").onsubmit = async e => {
    e.preventDefault();
    const f = e.target, m = $("msg"), b = f.querySelector("[type=submit]");
    m.className = "msg"; m.textContent = "";
    if (f.message.value.trim().length < 5) { m.textContent = "اكتب رسالتك."; return; }
    b.disabled = true;
    try {
      await call("ticket", {kind: f.kind.value, course: f.course.value || null, message: f.message.value});
      m.className = "msg ok"; m.textContent = "وصلتنا ✓ بنرد عليك هني."; f.message.value = "";
      await load();
    } catch (err) { m.textContent = err.message; }
    b.disabled = false;
  };
  load().catch(e => { $("msg").textContent = e.message; });
})();
