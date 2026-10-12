// يصدّر ملف الخطة الدراسية لكل تخصص إلى plans/<id>.png و plans/<id>.pdf
// التشغيل من جذر المستودع:  npm i --no-save playwright qrcode && node tools/export-plans.js
// شغّله كل ما تغيّرت الخطط في plans.js عشان الملفات تبقى مطابقة للموقع.
const path = require("path"), fs = require("fs"), vm = require("vm");
const { chromium } = require("playwright");
const QRCode = require("qrcode");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "plans");
const fontDir = process.env.FONT_DIR; // اختياري: مجلد خطوط محلي بدل Google Fonts (local.css + ملفات woff2)

// نقرا قائمة التخصصات من plans.js نفسه
const sandbox = { window: {}, document: { getElementById: () => null } };
vm.runInNewContext(fs.readFileSync(path.join(root, "plans.js"), "utf8"), sandbox);
const ids = sandbox.window.ASC_PLANS.PLANS.map(p => p.id);

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  for (const id of ids) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1600 }, deviceScaleFactor: 2 });
    const qr = await QRCode.toString(`https://www.asckwt.com/#plans/${id}`, { type: "svg", margin: 0, color: { dark: "#07005E", light: "#FFFFFF" } });
    await page.addInitScript(svg => { window.QR_SVG = svg; }, qr);
    if (fontDir) {
      await page.route(/fonts\.googleapis\.com/, r => r.fulfill({ contentType: "text/css", body: fs.readFileSync(path.join(fontDir, "local.css"), "utf8").replace(/url\(([^)]+)\)/g, (_, f) => `url(file://${path.join(fontDir, f)})`) }));
    }
    await page.goto("file://" + path.join(__dirname, "plan-sheet.html") + "?p=" + id);
    await page.waitForSelector("body[data-ready]");
    const height = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
    await page.setViewportSize({ width: 1080, height });
    await page.screenshot({ path: path.join(out, id + ".png"), fullPage: true });
    await page.pdf({ path: path.join(out, id + ".pdf"), width: "1080px", height: height + 2 + "px", printBackground: true, pageRanges: "1" });
    console.log(id, height + "px");
    await page.close();
  }
  await browser.close();
})();
