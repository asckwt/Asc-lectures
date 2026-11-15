// صفحة الأستاذ: نبذة، وموادّه، وآراء الطلاب
"use strict";
(async () => {
  const {el, $, call, ago, stars} = ASC;
  ASC.header("");
  let p;
  try { p = await call("doctor?id=" + Number(ASC.qs("id"))); }
  catch (e) { $("err").textContent = e.status === 404 ? "الأستاذ مو موجود." : e.message; $("title").textContent = "ما لقيناه"; return; }
  const d = p.doctor;
  document.title = `${d.name} | الطالب الأكاديمي`;
  $("title").textContent = d.name;
  $("lead").replaceChildren(p.rating.count ? el("span", {}, stars(p.rating.avg), ` ${p.rating.avg} من ${p.rating.count} تقييم · `) : "", `${p.courses.length} مادة · ${p.lectures} محاضرة`);
  $("about").hidden = false;
  $("about").replaceChildren(el("div", {className: "pro"},
    el("span", {className: "av", "aria-hidden": "true"}, d.photo ? el("img", {src: d.photo, alt: "", onerror: e => e.target.replaceWith(d.name.replace(/^(د|أ)\.\s*/, "").charAt(0))}) : d.name.replace(/^(د|أ)\.\s*/, "").charAt(0)),
    el("div", {style: "flex:1;min-width:220px"}, el("h2", {style: "margin:0"}, d.name), d.bio ? el("p", {style: "margin:6px 0 0;white-space:pre-wrap"}, d.bio) : null)),
    d.sample ? el("p", {style: "margin:14px 0 0"}, el("a", {className: "btn y", href: `../course/?id=${encodeURIComponent(p.courses[0]?.id || "")}`}, `▶ شوف محاضرة تجريبية: ${d.sample.title}`)) : null);
  if (p.courses.length) {
    $("cs").hidden = false;
    $("clist").replaceChildren(...p.courses.map(c => el("a", {className: "item", href: `../course/?id=${encodeURIComponent(c.id)}`},
      el("bdi", {dir: "ltr", style: "font-family:var(--display);font-weight:700"}, c.code), el("span", {dir: "ltr"}, c.title),
      el("span", {className: "end"}, c.ratings ? `★ ${c.rating} · ` : "", `${c.lectures} محاضرة`))));
  }
  if (p.ratings.length) {
    $("rs").hidden = false;
    $("rlist").replaceChildren(...p.ratings.map(r => el("article", {className: "rev"},
      el("div", {className: "row", style: "justify-content:space-between"}, el("b", {}, r.name, el("bdi", {dir: "ltr", className: "muted", style: "font-weight:500"}, " · " + r.course)), stars(r.stars)),
      r.comment ? el("p", {style: "margin:0"}, r.comment) : null,
      el("small", {className: "muted"}, ago(r.created)),
      r.reply ? el("div", {className: "reply"}, el("b", {}, "رد: "), r.reply) : null)));
  }
})();
