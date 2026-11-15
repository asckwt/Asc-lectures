// القروبات: العامة من الكتالوج (حسب الجامعة)، والخاصة للمشترك من حسابه
"use strict";
(async () => {
  const {el, $, call} = ASC;
  ASC.header("groups");
  let cat, me = null;
  try { cat = await call("catalog"); if (ASC.token()) me = await call("me").catch(() => null); }
  catch (e) { $("err").textContent = e.message; return; }
  if (me) $("unread").textContent = me.unread || "";
  const row = (g, sub) => el("a", {className: "g", href: g.url, target: "_blank", rel: "noopener"}, el("span", {className: "ic", "aria-hidden": "true"}, "💬"), el("div", {}, el("b", {}, g.title), sub ? el("small", {}, sub) : null), el("span", {className: "btn w sm"}, "انضم"));
  if (me?.groups.length) { $("priv").hidden = false; $("plist").replaceChildren(...me.groups.map(g => row(g, g.course))); }
  const pub = cat.groups.filter(g => g.url);
  const unis = cat.universities.filter(u => pub.some(g => g.uni === u.id));
  let cur = (me?.user.uni && unis.some(u => u.id === me.user.uni)) ? me.user.uni : unis[0]?.id;
  const major = id => cat.majors.find(m => m.id === Number(id))?.name;
  const course = id => cat.courses.find(c => c.id === id);
  function draw() {
    $("unis").replaceChildren(...unis.map(u => el("button", {type: "button", "aria-pressed": String(u.id === cur), onclick: () => { cur = u.id; draw(); }}, u.name)));
    const list = pub.filter(g => g.uni === cur);
    const sec = (title, items, sub) => items.length ? el("section", {className: "card"}, el("h2", {}, title), el("div", {style: "display:grid;gap:8px"}, ...items.map(g => row(g, sub(g))))) : null;
    $("pub").replaceChildren(...[
      sec("الجامعة", list.filter(g => g.scope === "uni"), () => ""),
      sec("التخصصات", list.filter(g => g.scope === "major"), g => major(g.ref) || ""),
      sec("المواد", list.filter(g => g.scope === "course"), g => { const c = course(g.ref); return c ? `${c.code} · ${c.title}` : g.ref; }),
    ].filter(Boolean));
    if (!list.length) $("pub").replaceChildren(el("p", {className: "muted"}, "ما فيه قروبات للحين."));
  }
  draw();
})();
