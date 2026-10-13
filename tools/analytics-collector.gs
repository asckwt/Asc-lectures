/**
 * مستقبِل إحصائيات موقع الطالب الأكاديمي (Google Apps Script).
 *
 * طريقة التركيب (مرة وحدة):
 * 1. افتح script.google.com/create (أو من Google Sheet: Extensions ← Apps Script).
 * 2. امسح الموجود، والصق هذا الملف كامل، وغيّر KEY تحت لكلمة سر من عندك.
 * 3. فوق المحرر اختار الدالة setup واضغط Run مرة وحدة: يسوي الجدول ويطلب الصلاحيات.
 * 4. Deploy ← New deployment ← النوع Web app.
 *    Execute as: Me   ·   Who has access: Anyone
 * 5. انسخ رابط الـ Web app وحطه في analytics.js (ASC_ANALYTICS_URL) وفي stats.html (ENDPOINT).
 *
 * كل زيارة أو نقرة تنضاف سطر في ورقة "events". صفحة stats.html تطلب الملخص بكلمة السر.
 */
const KEY = "غيّر-كلمة-السر-هذي";
const SHEET = "events";
const TZ = "Asia/Kuwait";
const TYPES = ["visit", "view", "lecture", "group", "contact", "platform", "plan_download", "calendar_add", "gpa_use", "form", "outbound"];

function sheet_() {
  // يشتغل من داخل جدول (Extensions ← Apps Script) أو كمشروع مستقل من script.google.com:
  // في الحالة الثانية يسوي جدول "إحصائيات الطالب الأكاديمي" في Google Drive أول مرة.
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    const props = PropertiesService.getScriptProperties();
    const id = props.getProperty("SHEET_ID");
    if (id) ss = SpreadsheetApp.openById(id);
    else { ss = SpreadsheetApp.create("إحصائيات الطالب الأكاديمي"); props.setProperty("SHEET_ID", ss.getId()); }
  }
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(["time", "visitor", "session", "type", "label", "section", "device", "source"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function setup() { Logger.log(sheet_().getParent().getUrl()); }

const clip_ = (v, n) => String(v == null ? "" : v).replace(/[\r\n\t]/g, " ").slice(0, n);

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (TYPES.indexOf(d.type) < 0) return out_({ok: false});
    // سطر يبدأ بـ = أو + أو - أو @ ينحفظ كنص عشان ما يصير معادلة
    const safe = v => /^[=+\-@]/.test(v) ? "'" + v : v;
    sheet_().appendRow([new Date(), clip_(d.visitor, 20), clip_(d.session, 20), d.type,
      safe(clip_(d.label, 80)), safe(clip_(d.section, 30)), clip_(d.device, 12), safe(clip_(d.source, 40))]);
    return out_({ok: true});
  } catch (err) {
    return out_({ok: false});
  }
}

function doGet(e) {
  if (!e.parameter.key || e.parameter.key !== KEY) return out_({error: "key"});
  const days = Math.min(Math.max(parseInt(e.parameter.days, 10) || 30, 7), 180);
  const sh = sheet_();
  const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 8).getValues() : [];
  const fmt = (d, f) => Utilities.formatDate(d, TZ, f);
  const today = fmt(new Date(), "yyyy-MM-dd");

  const dayKeys = [];
  for (let i = days - 1; i >= 0; i--) dayKeys.push(fmt(new Date(Date.now() - i * 864e5), "yyyy-MM-dd"));
  const byDay = {};
  dayKeys.forEach(k => byDay[k] = {d: k, visits: 0, visitors: {}, clicks: 0});

  const count = {}, top = {}, hours = Array(24).fill(0), weekdays = Array(7).fill(0);
  const devices = {}, sources = {}, allVisitors = {}, platformVisitors = {};
  const bump = (o, k) => o[k] = (o[k] || 0) + 1;

  rows.forEach(r => {
    const t = r[0] instanceof Date ? r[0] : new Date(r[0]);
    if (isNaN(t)) return;
    const k = fmt(t, "yyyy-MM-dd");
    const day = byDay[k];
    if (!day) return;
    const [, visitor, , type, label] = r;
    bump(count, type);
    (top[type] = top[type] || {})[label] = (top[type][label] || 0) + 1;
    if (type === "visit") {
      day.visits++;
      day.visitors[visitor] = 1;
      allVisitors[visitor] = 1;
      hours[+fmt(t, "H")]++;
      weekdays[+fmt(t, "u") % 7]++; // 0 = الأحد
      bump(devices, r[6] || "؟");
      bump(sources, r[7] || "مباشر");
    } else if (type !== "view") {
      day.clicks++;
    }
    if (type === "platform") platformVisitors[visitor] = 1;
  });

  const sortTop = o => Object.keys(o || {}).map(k => [k, o[k]]).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const topOut = {};
  Object.keys(top).forEach(t => topOut[t] = sortTop(top[t]));

  return out_({
    generated: new Date().toISOString(), today, days,
    daily: dayKeys.map(k => ({d: k, visits: byDay[k].visits, visitors: Object.keys(byDay[k].visitors).length, clicks: byDay[k].clicks})),
    totals: {visits: count.visit || 0, visitors: Object.keys(allVisitors).length, platformVisitors: Object.keys(platformVisitors).length},
    count, top: topOut, hours, weekdays, devices: sortTop(devices), sources: sortTop(sources)
  });
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
