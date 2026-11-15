// الكلام مع السيرفر: نفس الخادم اللي يستخدمه الموقع
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { fetch } from 'expo/fetch';
import { Platform } from 'react-native';

export const API = process.env.EXPO_PUBLIC_API || 'https://asc-videos.m7mdaltalab.workers.dev';
export const WA = '96596050709';

// الجلسة ورقم الجهاز محفوظين بالـ Keychain / Keystore (مو بملف عادي)
const KEY_TOKEN = 'asc-token';
const KEY_DEVICE = 'asc-device';
let token: string | null = null;
let device: string | null = null;

async function getItem(k: string) {
  if (Platform.OS === 'web') { try { return localStorage.getItem(k); } catch { return null; } }
  return SecureStore.getItemAsync(k);
}
async function setItem(k: string, v: string | null) {
  if (Platform.OS === 'web') { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch {} return; }
  if (v == null) await SecureStore.deleteItemAsync(k); else await SecureStore.setItemAsync(k, v);
}

export async function loadSession() {
  token = await getItem(KEY_TOKEN);
  device = await getItem(KEY_DEVICE);
  if (!device) { device = Crypto.randomUUID().replace(/-/g, ''); await setItem(KEY_DEVICE, device); }
  return token;
}
export const getToken = () => token;
export const getDevice = () => device || '';
export async function setToken(t: string | null) { token = t; await setItem(KEY_TOKEN, t); }

export class ApiError extends Error {
  constructor(public status: number, public code: string | undefined, message: string) { super(message); }
}

type Body = Record<string, unknown> | Blob | ArrayBuffer | Uint8Array | undefined;

export async function call<T = any>(path: string, data?: Body, contentType?: string): Promise<T> {
  const bin = data instanceof Uint8Array || data instanceof ArrayBuffer || (typeof Blob !== 'undefined' && data instanceof Blob);
  let r: Response;
  try {
    r = await fetch(`${API}/api/${path}`, {
      method: data === undefined ? 'GET' : 'POST',
      headers: {
        ...(bin ? { 'Content-Type': contentType || 'application/octet-stream' } : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: data === undefined ? undefined : bin ? (data as any) : JSON.stringify(data),
    }) as unknown as Response;
  } catch {
    throw new ApiError(0, 'net', 'ما قدرنا نوصل للسيرفر، تأكد من النت وجرّب مرة ثانية.');
  }
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401) await setToken(null);
    throw new ApiError(r.status, j.error, j.message || 'صار خطأ، جرّب مرة ثانية.');
  }
  return j as T;
}

// ملف أو صورة تحتاج دخول: نرجّع البايتات
export async function bytes(path: string): Promise<Uint8Array> {
  let r: any;
  try { r = await fetch(`${API}/api/${path}`, { headers: { Authorization: `Bearer ${token}` } }); }
  catch { throw new ApiError(0, 'net', 'ما قدرنا نوصل للسيرفر.'); }
  if (!r.ok) { const j: any = await r.json().catch(() => ({})); throw new ApiError(r.status, j.error, j.message || 'ما قدرنا نجيبه.'); }
  return r.bytes();
}

export const kwd = (f: number) => `${(f / 1000).toFixed(3).replace(/\.?0+$/, '')} د.ك`;
export const mins = (s: number) => !s ? '' : s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.round(s / 60) % 60).padStart(2, '0')} س` : `${Math.max(1, Math.round(s / 60))} د`;
export const clock = (t: number) => { t = Math.floor(t); const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, x = String(t % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; };
export const date = (s: number) => new Date(s * 1000).toLocaleDateString('ar-KW', { day: 'numeric', month: 'long', year: 'numeric', numberingSystem: 'latn' } as any);
export function ago(s: number) {
  const d = Math.floor(Date.now() / 1000) - s;
  if (d < 3600) return d < 120 ? 'الحين' : `قبل ${Math.floor(d / 60)} دقيقة`;
  if (d < 86400) return d < 7200 ? 'قبل ساعة' : `قبل ${Math.floor(d / 3600)} ساعات`;
  if (d < 172800) return 'أمس';
  return d < 604800 ? `قبل ${Math.floor(d / 86400)} أيام` : date(s);
}
export const waLink = (text: string) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
