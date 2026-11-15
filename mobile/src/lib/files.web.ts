// ملفات المادة بالمتصفح: نسخة الطالب (عليها اسمه ورقمه) تنجاب مرة وحدة وتنحفظ بالذاكرة لين يسكّر الصفحة
import { bytes } from './api';

const safe = (t: string) => t.replace(/[\\/:*?"<>|]/g, '-').slice(0, 80) || 'file';
const got = new Map<string, { url: string; file: File }>();
async function pdf(id: string, title: string) {
  let p = got.get(id);
  if (!p) {
    const b = await bytes(`file?id=${encodeURIComponent(id)}`);
    const file = new File([b as BlobPart], `${safe(title)}.pdf`, { type: 'application/pdf' });
    p = { url: URL.createObjectURL(file), file };
    got.set(id, p);
  }
  return p;
}
export async function openFile(id: string, title: string) {
  const p = await pdf(id, title);
  const a = document.createElement('a');
  a.href = p.url; a.target = '_blank'; a.rel = 'noopener';
  a.click();
}
// الطباعة من إطار مخفي، وإذا المتصفح ما يسمح (مثل آيفون) نفتح الملف ويطبع من هناك
export async function printFile(id: string, title: string) {
  const p = await pdf(id, title);
  await new Promise<void>(ok => {
    const fr = document.createElement('iframe');
    fr.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0';
    fr.src = p.url;
    fr.onload = () => {
      try { fr.contentWindow?.focus(); fr.contentWindow?.print(); } catch { openFile(id, title); }
      setTimeout(() => fr.remove(), 60000);
      ok();
    };
    document.body.append(fr);
  });
}
// مشاركة إذا المتصفح يدعمها (الجوال)، وإلا تنزيل
export const canShare = () => typeof navigator !== 'undefined' && !!navigator.canShare;
export async function shareFile(id: string, title: string) {
  const p = await pdf(id, title);
  if (navigator.canShare?.({ files: [p.file] })) {
    try { await navigator.share({ files: [p.file], title }); } catch (e) { if ((e as Error).name !== 'AbortError') throw e; }
    return;
  }
  const a = document.createElement('a');
  a.href = p.url; a.download = p.file.name;
  document.body.append(a); a.click(); a.remove();
}
// بالمتصفح الصورة المصغّرة رابط blob أو data
export const readLocal = async (uri: string) => new Uint8Array(await (await fetch(uri)).arrayBuffer());
