// مشترك بين صفحات الطالب: الكلام مع السيرفر، الهيدر، والمشغّل
"use strict";
const ASC = (() => {
  const API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? "http://localhost:8799" : "https://asc-videos.m7mdaltalab.workers.dev";
  const WA = "96596050709";
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
  };
  const token = () => store.get("asc-watch-token");

  // data: undefined = GET، Blob = ملف، غيره JSON
  async function call(path, data) {
    const t = token(), blob = data instanceof Blob;
    const r = await fetch(API + "/api/" + path, {
      method: data === undefined ? "GET" : "POST",
      headers: {...(blob ? {} : {"Content-Type": "application/json"}), ...(t ? {Authorization: "Bearer " + t} : {})},
      body: data === undefined ? undefined : blob ? data : JSON.stringify(data),
    }).catch(() => null);
    if (!r) throw {message: "ما قدرنا نوصل للسيرفر، تأكد من النت وجرّب مرة ثانية."};
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (r.status === 401) store.set("asc-watch-token", null);
      throw {status: r.status, code: j.error, message: j.message || "صار خطأ، جرّب مرة ثانية."};
    }
    return j;
  }
  // ملف أو صورة تحتاج دخول: نجيبها ونرجّع رابط من الذاكرة
  const blobs = {};
  async function blobUrl(path) {
    if (blobs[path]) return blobs[path];
    const r = await fetch(API + "/api/" + path, {headers: {Authorization: "Bearer " + token()}}).catch(() => null);
    if (!r) throw {message: "ما قدرنا نوصل للسيرفر."};
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw {message: j.message || "ما قدرنا نجيبه."}; }
    const b = await r.blob();
    return blobs[path] = {blob: b, url: URL.createObjectURL(b)};
  }

  function el(tag, props = {}, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === "style" && typeof v === "string") e.style.cssText = v;
      else if (k === "data") Object.entries(v).forEach(([a, b]) => e.dataset[a] = b);
      else if (k in e && !/^aria|^role$/.test(k)) e[k] = v;
      else e.setAttribute(k, v === true ? "" : v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) e.append(c instanceof Node ? c : String(c));
    return e;
  }
  const $ = id => document.getElementById(id);
  const qs = k => new URLSearchParams(location.search).get(k);
  const wa = text => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
  const kwd = f => `${(f / 1000).toFixed(3).replace(/\.?0+$/, "")} د.ك`;
  const mins = s => !s ? "" : s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.round(s / 60) % 60).padStart(2, "0")} س` : `${Math.max(1, Math.round(s / 60))} د`;
  const clock = t => { t = Math.floor(t); const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, x = String(t % 60).padStart(2, "0"); return h ? `${h}:${String(m).padStart(2, "0")}:${x}` : `${m}:${x}`; };
  const date = s => new Date(s * 1000).toLocaleDateString("ar-KW", {day: "numeric", month: "long", year: "numeric", numberingSystem: "latn"});
  const ago = s => {
    const d = Math.floor(Date.now() / 1000) - s;
    if (d < 3600) return d < 120 ? "الحين" : `قبل ${Math.floor(d / 60)} دقيقة`;
    if (d < 86400) return d < 7200 ? "قبل ساعة" : `قبل ${Math.floor(d / 3600)} ساعات`;
    if (d < 172800) return "أمس";
    return d < 604800 ? `قبل ${Math.floor(d / 86400)} أيام` : date(s);
  };
  const stars = n => el("span", {className: "stars", "aria-label": `${n} من 5`}, "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n)));

  // الهيدر: الشعار والقائمة، و"محاضراتي" عليها عدد رسائل الأستاذ اللي ما انقرت
  function header(active) {
    const items = [["home", "../", "محاضراتي"], ["groups", "../groups/", "القروبات"], ["support", "../support/", "الشكاوي والاقتراحات"]];
    const nav = el("nav", {"aria-label": "القائمة"}, ...items.map(([k, href, label]) => el("a", {href, "aria-current": k === active ? "page" : null}, label, k === "home" ? el("span", {className: "badge", id: "unread"}) : null)));
    $("bar").replaceChildren(el("a", {href: "../../"}, el("img", {src: "../../tools/logo-horizontal-color-on-navy.svg", alt: "الطالب الأكاديمي"})), nav);
  }

  // المشغّل: HLS بجودة تتغير حسب النت، ورابط قصير يتجدد بروحه، واسم الطالب يتحرك على الفيديو
  function player(stage, {getLink, onTime} = {}) {
    const vid = stage.querySelector("video"), mark = stage.querySelector(".mark");
    let hls = null, timer = null, moveT = null, cur = null;
    const move = () => { mark.style.top = `${8 + Math.random() * 78}%`; mark.style.left = `${4 + Math.random() * 60}%`; };
    function load(url, at) {
      if (hls) { hls.destroy(); hls = null; }
      const seek = () => { if (at > 0) vid.currentTime = at; };
      if (window.Hls && Hls.isSupported()) {
        hls = new Hls({maxBufferLength: 30, capLevelToPlayerSize: true});
        hls.on(Hls.Events.MANIFEST_PARSED, () => { seek(); vid.play().catch(() => {}); });
        hls.on(Hls.Events.ERROR, (_, d) => { if (!d.fatal) return; if (d.type === Hls.ErrorTypes.NETWORK_ERROR) renew(); else if (d.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError(); });
        hls.loadSource(url); hls.attachMedia(vid);
      } else { vid.src = url; vid.addEventListener("loadedmetadata", seek, {once: true}); vid.play().catch(() => {}); }
    }
    async function start(id, at = 0) {
      cur = id; clearTimeout(timer);
      const r = await getLink(id);
      mark.textContent = r.mark; move(); clearInterval(moveT); moveT = setInterval(move, 9000);
      load(r.url, at);
      timer = setTimeout(renew, Math.max(60, (r.ttl || 1800) - 120) * 1000);
      return r;
    }
    function renew() { if (cur) start(cur, vid.currentTime || 0).catch(() => {}); }
    vid.addEventListener("contextmenu", e => e.preventDefault());
    if (onTime) vid.addEventListener("timeupdate", () => onTime(vid.currentTime));
    return {start, vid, seek: t => { vid.currentTime = t; vid.play().catch(() => {}); }};
  }
  // فهرس الأسئلة تحت الفيديو: تضغط السؤال ويروح له، والسؤال الحالي يتلوّن
  function chapters(box, list, p) {
    box.replaceChildren(...list.map(c => el("button", {type: "button", data: {t: c.t}, onclick: () => p.seek(c.t)}, el("b", {}, clock(c.t)), c.title)));
    box.hidden = !list.length;
    return t => { let on = null; for (const b of box.children) if (Number(b.dataset.t) <= t + 0.5) on = b; for (const b of box.children) b.setAttribute("aria-current", b === on); };
  }

  // نصغّر الصورة لـ 1600 بكسل JPEG قبل الرفع: أسرع، وتنشال منها بيانات الموقع
  async function shrink(file) {
    const bmp = await createImageBitmap(file).catch(() => null);
    if (!bmp) throw {message: "الصورة مو مدعومة، جرّب صورة JPG أو PNG."};
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise(ok => c.toBlob(ok, "image/jpeg", 0.85));
  }

  return {API, store, token, call, blobUrl, el, $, qs, wa, kwd, mins, clock, date, ago, stars, header, player, chapters, shrink};
})();
