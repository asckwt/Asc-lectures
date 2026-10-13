/* إحصائيات الموقع: يرسل الزيارات والنقرات لجدول Google Sheet عن طريق Apps Script.
   ما يجمع أي بيانات شخصية: رقم عشوائي للزائر، ونوع الجهاز، ومصدر الزيارة فقط.
   ضع رابط الـ Web App بعد ما تنشر tools/analytics-collector.gs، ولين ما تحطه ما يرسل شي. */
window.ASC_ANALYTICS_URL = "";

(() => {
  const URL = window.ASC_ANALYTICS_URL;
  if (!URL || /\/stats(\.html)?$/.test(location.pathname)) return;

  const store = (k, make) => {
    try { let v = localStorage.getItem(k); if (!v) { v = make(); localStorage.setItem(k, v); } return v; }
    catch { return make(); }
  };
  const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const visitor = store("asc_vid", rid);
  const session = rid();
  const device = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? "iPhone"
    : /Android/i.test(navigator.userAgent) ? "Android" : "كمبيوتر";
  const source = (() => {
    const q = (new URLSearchParams(location.search).get("utm_source") || "").toLowerCase();
    let h = q;
    if (!h) try { h = document.referrer ? new URL(document.referrer).hostname : ""; } catch {}
    if (!h || h === location.hostname) return "مباشر";
    if (/whatsapp/.test(h)) return "واتساب";
    if (/instagram/.test(h)) return "إنستغرام";
    if (/google/.test(h)) return "قوقل";
    if (/tiktok/.test(h)) return "تيك توك";
    if (/(^|\.)(t\.co|x\.com|twitter\.com)$/.test(h)) return "إكس";
    if (/snapchat/.test(h)) return "سناب";
    return h.replace(/^www\./, "").slice(0, 40);
  })();
  const section = () => location.hash.slice(1).split("/")[0] || "home";

  const send = (type, label = "") => {
    const body = JSON.stringify({type, label: String(label).trim().slice(0, 80), section: section(), visitor, session, device, source});
    try { fetch(URL, {method: "POST", mode: "no-cors", keepalive: true, headers: {"Content-Type": "text/plain"}, body}); } catch {}
  };
  window.ascTrack = send;

  send("visit", location.pathname);
  let lastView = "";
  const view = () => { const h = location.hash.slice(1) || "home"; if (h !== lastView && h !== "subscribe") { lastView = h; send("view", h); } };
  view();
  addEventListener("hashchange", view);

  // اسم المادة أو القروب من البطاقة اللي فيها الرابط
  const labelOf = a => {
    const box = a.closest("li, .card, .chat, article") || a.parentElement;
    const code = box?.querySelector(".code")?.textContent;
    const title = box?.querySelector("h3, b, strong")?.textContent;
    return (code || title || a.textContent || "").replace(/\s+/g, " ").trim();
  };

  document.addEventListener("click", e => {
    const a = e.target.closest("a[href]");
    if (!a) return;
    const href = a.getAttribute("href");
    if (href.startsWith("#")) return;
    if (/zoom\.us/.test(href)) return send("lecture", labelOf(a));
    if (/chat\.whatsapp\.com/.test(href)) return send("group", labelOf(a));
    if (/wa\.me/.test(href)) return send("contact", section());
    if (/academic-student\.com/.test(href)) return send("platform", section());
    if (/^data:text\/calendar/.test(href)) return send("calendar_add", "تقويم الجوال");
    const plan = href.match(/plans\/(\w+)\.(png|pdf)$/);
    if (plan) return send("plan_download", `${plan[1]} · ${plan[2].toUpperCase()}`);
    try { const u = new URL(href, location.href); if (u.hostname !== location.hostname) send("outbound", u.hostname.replace(/^www\./, "")); } catch {}
  }, true);

  // استخدام حاسبة المعدل: مرة وحدة لكل زيارة
  let gpaUsed = false;
  document.addEventListener("input", e => {
    if (!gpaUsed && e.target.closest("#gpa")) { gpaUsed = true; send("gpa_use", "حاسبة المعدل"); }
  }, true);
  document.addEventListener("submit", e => send("form", e.target.id || section()), true);
})();
