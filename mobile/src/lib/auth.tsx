// حالة الطالب: الجلسة وبياناته (/me)، ونحدّثها لما يرجع للتطبيق
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { ApiError, call, getDevice, loadSession, setToken } from './api';

export type Me = {
  user: { name: string; phone: string; status: string; uni: string | null };
  courses: { code: string; until: number; files: { id: string; title: string; pages: number; size: number }[]; videos: { id: string; title: string; duration: number; pos: number; chapters: { t: number; title: string }[] }[] }[];
  groups: { course: string; title: string; url: string }[];
  news: { id: number; scope: string; ref: string | null; title: string; body: string | null; pinned: number; author: string; created: number }[];
  unread: number;
};
type Ctx = { ready: boolean; me: Me | null; error: string; refresh: () => Promise<void>; login: (phone: string, password: string) => Promise<void>; signup: (d: Record<string, unknown>) => Promise<void>; logout: () => Promise<void> };
const AuthCtx = createContext<Ctx>(null as any);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try { setMe(await call<Me>('me')); setError(''); }
    catch (e) { if (e instanceof ApiError && (e.status === 401 || e.status === 403)) { setMe(null); await setToken(null); } setError((e as Error).message); }
  }, []);
  useEffect(() => {
    (async () => { if (await loadSession()) await refresh(); setReady(true); })();
    const sub = AppState.addEventListener('change', s => { if (s === 'active') refresh().catch(() => {}); });
    return () => sub.remove();
  }, [refresh]);
  const login = async (phone: string, password: string) => {
    const r = await call<{ token: string }>('login', { phone, password, device: getDevice() });
    await setToken(r.token); await refresh();
  };
  const signup = async (d: Record<string, unknown>) => {
    const r = await call<{ token: string }>('signup', { ...d, device: getDevice() });
    await setToken(r.token); await refresh();
  };
  const logout = async () => { await call('logout', {}).catch(() => {}); await setToken(null); setMe(null); };
  return <AuthCtx.Provider value={{ ready, me, error, refresh, login, signup, logout }}>{children}</AuthCtx.Provider>;
}
