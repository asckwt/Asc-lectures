// يبني موقع الطالب من كود التطبيق ويحطه بـ watch/ (لوحة الإدارة watch/admin تبقى مثل ما هي)
// الاستخدام: node scripts/build-web.mjs [مجلد الإخراج، الافتراضي ../watch]
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(process.argv[2] || join(app, '..', 'watch'));
const keep = new Set(['admin']); // ما ينلمس
const tmp = mkdtempSync(join(tmpdir(), 'asc-web-'));

execFileSync('npx', ['expo', 'export', '-p', 'web', '--output-dir', tmp], { cwd: app, stdio: 'inherit' });

// صفحات التطوير ما نحتاجها
for (const f of ['_sitemap.html', '+not-found.html']) rmSync(join(tmp, f), { force: true });

// course.html → course/index.html، عشان الروابط القديمة (course/?id=) تظل شغّالة
for (const f of readdirSync(tmp)) {
  if (!f.endsWith('.html') || f === 'index.html') continue;
  const dir = join(tmp, f.slice(0, -5));
  mkdirSync(dir, { recursive: true });
  renameSync(join(tmp, f), join(dir, 'index.html'));
}

// سياسة أمان: السكربتات من الموقع بس، والسكربت المدموج بالصفحة مسموح ببصمته (hash)
const api = process.env.EXPO_PUBLIC_API || 'https://asc-videos.m7mdaltalab.workers.dev';
const csp = hashes => [
  "default-src 'self'", "base-uri 'self'", "object-src 'none'", "form-action 'self'",
  `script-src 'self' ${hashes.join(' ')}`,
  "style-src 'self' 'unsafe-inline'", "font-src 'self'",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' blob: data: ${api} https://*.cloudflarestream.com http://localhost:*`,
  "media-src 'self' blob: https://*.cloudflarestream.com http://localhost:*",
  "worker-src 'self' blob:", "frame-src blob:",
].join('; ');
const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
for (const f of walk(tmp).filter(f => f.endsWith('.html'))) {
  let html = readFileSync(f, 'utf8');
  const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
  html = html.replace('<meta charSet="utf-8"/>', `<meta charSet="utf-8"/><meta http-equiv="Content-Security-Policy" content="${csp(hashes)}"/>`);
  writeFileSync(f, html);
}

// نمسح الموقع القديم (غير الإدارة) ونحط الجديد
if (existsSync(out)) for (const f of readdirSync(out)) if (!keep.has(f)) rmSync(join(out, f), { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(tmp, out, { recursive: true });
rmSync(tmp, { recursive: true, force: true });
console.log('✓ موقع الطالب انبنى في', out);
