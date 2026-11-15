// ملفات المادة: ننزّل نسخة الطالب (عليها اسمه ورقمه) ونفتحها أو نطبعها أو نشاركها
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { bytes } from './api';

const safe = (t: string) => t.replace(/[\\/:*?"<>|]/g, '-').slice(0, 80) || 'file';
async function local(id: string, title: string) {
  const f = new File(Paths.cache, `${safe(title)}.pdf`);
  if (f.exists) f.delete();
  f.create();
  f.write(await bytes(`file?id=${encodeURIComponent(id)}`));
  return f;
}
export async function openFile(id: string, title: string) {
  const f = await local(id, title);
  if (await File.canPreview(f)) await File.preview(f, { title });
  else await Sharing.shareAsync(f.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
}
export async function printFile(id: string, title: string) {
  const f = await local(id, title);
  await Print.printAsync({ uri: f.uri });
}
export async function shareFile(id: string, title: string) {
  const f = await local(id, title);
  await Sharing.shareAsync(f.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
}
