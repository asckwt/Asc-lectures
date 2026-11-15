// صفحة المادة: عامة للكل، والمشترك يشوف زر الشات والتقييم
"use strict";
(async () => {
  const {el, $, call, kwd, mins, ago, stars, wa} = ASC;
  ASC.header("");
  const id = (ASC.qs("id") || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 24);
  let page, cat, me = null;
  try {
    [page, cat] = await Promise.all([call("course?id=" + encodeURIComponent(id)), call("catalog")]);
    if (ASC.token()) me = await call("me").catch(() => null);
  } catch (e) { $("err").textContent = e.status === 404 ? "المادة مو موجودة." : e.message; $("title").textContent = "ما لقينا المادة"; return; }
  const c = page.course, uni = cat.universities.find(u => u.id === c.uni);
  const mine = me?.courses.find(x => x.code === c.id);
  document.title = `${c.code} ${c.title} | الطالب الأكاديمي`;
  $("uni").textContent = uni?.name || c.uni;
  $("code").textContent = c.code;
  $("title").textContent = c.title;
  const total = page.lectures.reduce((a, l) => a + (l.duration || 0), 0);
  $("facts").replaceChildren(
    page.rating.count ? el("span", {}, stars(page.rating.avg), ` ${page.rating.avg} (${page.rating.count} تقييم)`) : null,
    el("span", {}, `${page.lectures.length} محاضرة${total ? " · " + mins(total) : ""}`),
    page.files.length ? el("span", {}, `${page.files.length} ملف`) : null);
  if (page.doctor) {
    const d = page.doctor;
    $("doc").hidden = false; $("doc").href = `../doctor/?id=${d.id}`;
    $("doc").replaceChildren(el("span", {className: "av", "aria-hidden": "true"}, d.photo ? el("img", {src: d.photo, alt: "", onerror: e => e.target.replaceWith(d.name.replace(/^(د|أ)\.\s*/, "").charAt(0))}) : d.name.replace(/^(د|أ)\.\s*/, "").charAt(0)), el("span", {}, el("small", {}, "يشرحها"), el("b", {}, d.name), el("small", {}, "شوف ملفه ←")));
  }
  $("cols").hidden = false;

  // المحاضرات: المجانية تشتغل هني على طول
  const p = ASC.player($("stage"), {getLink: v => call("preview", {video: v}), onTime: t => mark(t)});
  let mark = () => {};
  $("lecs").replaceChildren(...page.lectures.map((l, i) => el("li", {}, el(l.free ? "button" : "div", {className: "item", type: l.free ? "button" : null, onclick: l.free ? () => playFree(l) : null},
    el("span", {className: "n"}, i + 1), el("span", {}, l.title, l.questions ? el("small", {className: "muted", style: "display:block;font-weight:400"}, `${l.questions} سؤال محلول`) : null),
    l.free ? el("span", {className: "free"}, "▶ مجانية") : el("span", {className: "lock", "aria-label": "للمشتركين"}, "🔒"),
    el("span", {className: "end"}, mins(l.duration))))));
  if (!page.lectures.length) $("lecs").replaceChildren(el("li", {className: "muted"}, "المحاضرات بتنزل قريب."));
  async function playFree(l) {
    $("prev").hidden = false; $("prev-t").textContent = l.title; $("prev-msg").textContent = "";
    $("prev").scrollIntoView({behavior: "smooth", block: "start"});
    try { const r = await p.start(l.id); mark = ASC.chapters($("chaps"), r.chapters || [], p); }
    catch (e) { $("prev-msg").textContent = e.message; }
  }

  if (page.files.length) {
    $("files-c").hidden = false;
    $("files").replaceChildren(...page.files.map(f => el("li", {className: "item"}, el("span", {}, "📄"), el("span", {}, f.title), el("span", {className: "end"}, `${f.pages} صفحة`))));
  }

  // التقييمات
  const s = page.rating;
  $("sum").replaceChildren(s.count ? el("div", {style: "text-align:center"}, el("b", {style: "font:800 36px var(--display);display:block"}, s.avg), stars(s.avg), el("small", {className: "muted", style: "display:block"}, `${s.count} تقييم`)) : el("p", {className: "muted", style: "margin:0"}, "ما فيه تقييمات للحين."),
    s.count ? el("div", {className: "dist"}, ...[5, 4, 3, 2, 1].map(n => el("div", {}, el("span", {}, n), el("span", {className: "bar"}, el("i", {style: `width:${Math.round(s.dist[n - 1] / s.count * 100)}%`}))))) : null);
  $("revs").replaceChildren(...page.ratings.map(r => el("article", {className: "rev"},
    el("div", {className: "row", style: "justify-content:space-between"}, el("b", {}, r.name), stars(r.stars)),
    r.tags.length ? el("div", {className: "row", style: "gap:4px"}, ...r.tags.map(t => el("span", {className: "chip t"}, t))) : null,
    r.comment ? el("p", {style: "margin:0"}, r.comment) : null,
    el("small", {className: "muted"}, `✓ مشترك بالمادة · ${ago(r.created)}`),
    r.reply ? el("div", {className: "reply"}, el("b", {}, "رد: "), r.reply) : null)));

  // الاشتراك
  const plans = [["mid", "ميدتيرم", c.price_mid, c.mid_until], ["final", "فاينل", c.price_final, c.final_until], ["full", "الفصل كامل", c.price_full, c.final_until]].filter(x => x[2] > 0 && !(x[3] && x[3] * 1000 < Date.now()));
  $("plans").replaceChildren(...plans.map(([k, name, price]) => el("div", {className: "plan"}, el("span", {}, el("b", {}, name), k === "full" && c.installments ? el("small", {}, "أو على قسطين") : null), el("b", {className: "p"}, kwd(price)))));
  if (!plans.length) $("plans").replaceChildren(el("p", {className: "muted", style: "margin:0"}, "الاشتراك مسكّر الحين."));
  $("buy-b").hidden = !plans.length;
  $("buy-b").href = wa(`السلام عليكم، أبي أشترك بمادة ${c.code} ${c.title}.`);
  if (mine) {
    $("buy").hidden = true; $("mine").hidden = false;
    $("chat-b").href = `../chat/?course=${encodeURIComponent(c.id)}`;
  }
  const groups = page.groups.concat(me?.groups.filter(g => g.course === c.id).map(g => ({...g, title: "🔒 " + g.title})) || []);
  if (groups.length) { $("groups-c").hidden = false; $("groups").replaceChildren(...groups.map(g => el("a", {className: "btn w sm", href: g.url, target: "_blank", rel: "noopener"}, g.title))); }

  // التقييم: للي اشترك بالمادة (حتى لو خلص اشتراكه، السيرفر يتأكد)
  $("rate-b").hidden = !mine;
  let pick = 0;
  $("starpick").replaceChildren(...[1, 2, 3, 4, 5].map(n => el("button", {type: "button", "aria-label": `${n} من 5`, onclick: () => { pick = n; [...$("starpick").children].forEach((b, i) => b.classList.toggle("on", i < n)); }}, "★")));
  $("tagpick").replaceChildren(...page.tags.map(t => el("label", {}, el("input", {type: "checkbox", value: t}), t)));
  $("rate-b").onclick = () => $("rate").showModal();
  $("rate-x").onclick = () => $("rate").close();
  $("rate-f").onsubmit = async e => {
    e.preventDefault();
    const m = $("rate-msg"); m.className = "msg"; m.textContent = "";
    if (!pick) { m.textContent = "اختار عدد النجوم."; return; }
    const btn = e.target.querySelector("[type=submit]"); btn.disabled = true;
    try {
      const r = await call("rate", {course: c.id, stars: pick, tags: [...$("tagpick").querySelectorAll("input:checked")].map(i => i.value), comment: e.target.comment.value});
      m.className = "msg ok"; m.textContent = r.status === "pending" ? "وصلنا تقييمك، نراجعه ونتواصل معاك لو احتجت شي." : "شكراً! تقييمك انشر.";
      setTimeout(() => $("rate").close(), 1800);
    } catch (err) { m.textContent = err.message; }
    btn.disabled = false;
  };
  $("unread").textContent = me?.unread || "";
})();
