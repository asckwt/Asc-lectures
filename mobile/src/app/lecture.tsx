// المشغّل: رابط موقّع قصير يتجدد بروحه، اسم الطالب ورقمه يتحركون على الفيديو، فهرس الأسئلة، ومنع تصوير الشاشة
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chapters } from '@/components/Chapters';
import { Player, type PlayerHandle, type PlayerSource } from '@/components/Player';
import { call } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { notify } from '@/lib/dialog';
import { font, useColors } from '@/lib/theme';
import { Btn, Msg, Page, T } from '@/lib/ui';

// منع تصوير الشاشة على الجوال (الويب ما يدعمه)
const useNoCapture = Platform.OS === 'web' ? (_: string) => {} : usePreventScreenCapture;
const web = Platform.OS === 'web';

export default function Lecture() {
  useNoCapture('lecture');
  const { id, course } = useLocalSearchParams<{ id: string; course: string }>();
  const { me, refresh } = useAuth();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const v = me?.courses.find(x => x.code === course)?.videos.find(x => x.id === id);
  const player = useRef<PlayerHandle>(null);
  const [source, setSource] = useState<PlayerSource>(null);
  const [mark, setMark] = useState('');
  const [pos, setPos] = useState({ top: 20, left: 10 });
  const [now, setNow] = useState(0);
  const [err, setErr] = useState('');
  const [full, setFull] = useState(false);
  const lastSaved = useRef(0);
  const ctx = useRef<Ctx | null>(null);

  // البيانات تتحدث لما يرجع للتطبيق، فنقرا وين وقف أول مرة بس عشان ما يعيد التشغيل
  const first = useRef(v);
  const has = !!v;
  useEffect(() => {
    const v = first.current;
    if (!v) return;
    const x: Ctx = { id, stopped: false, timer: undefined, player, setMark, setErr, setSource };
    ctx.current = x;
    const resume = v.pos && v.duration && v.pos < v.duration - 30 ? Math.max(0, v.pos - 3) : 0;
    load(x, false, resume);
    const handle = player.current; // يمسح الـ ref قبل التنظيف، فنحفظه هني
    const move = setInterval(() => setPos({ top: 8 + Math.random() * 74, left: 4 + Math.random() * 56 }), 9000);
    return () => {
      x.stopped = true; clearInterval(move); clearTimeout(x.timer);
      saveProgress(handle, id, lastSaved); refresh().catch(() => {});
      if (!web) ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, [has, id, refresh]);

  const onTime = (t: number) => {
    setNow(t);
    if (Math.abs(t - lastSaved.current) >= 15) saveProgress(player.current, id, lastSaved);
  };
  const onError = () => { if (ctx.current) load(ctx.current, true, player.current?.time() || 0); };

  const toggleFull = async () => {
    const next = !full;
    setFull(next);
    // الويب: ملء الشاشة للصفحة كلها عشان العلامة تبقى فوق الفيديو (مو فيديو المتصفح لحاله)
    if (web) { if (next) document.documentElement.requestFullscreen?.().catch(() => {}); else if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); return; }
    await ScreenOrientation.lockAsync(next ? ScreenOrientation.OrientationLock.LANDSCAPE : ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
  };
  useEffect(() => {
    if (!web) return;
    const off = () => { if (!document.fullscreenElement) setFull(false); };
    document.addEventListener('fullscreenchange', off);
    return () => document.removeEventListener('fullscreenchange', off);
  }, []);

  if (!v) return <Page><Msg text="هالمحاضرة مو ضمن اشتراكك." /></Page>;
  const stage = (
    <View style={full ? StyleSheet.absoluteFill : { aspectRatio: 16 / 9, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' }}>
      <Player ref={player} source={source} onTime={onTime} onError={onError} />
      <T pointerEvents="none" style={{ position: 'absolute', top: `${pos.top}%`, left: `${pos.left}%`, color: 'rgba(255,255,255,0.55)', fontFamily: font.bodyB, fontSize: 13, textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 3, writingDirection: 'ltr', userSelect: 'none' }}>{mark}</T>
      <Pressable accessibilityRole="button" accessibilityLabel={full ? 'صغّر' : 'ملء الشاشة'} onPress={toggleFull}
        style={{ position: 'absolute', top: full ? insets.top + 8 : 8, right: full ? insets.right + 8 : 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, minHeight: 40, paddingHorizontal: 12, justifyContent: 'center' }}>
        <T style={{ color: '#fff', fontSize: 13 }}>{full ? '✕ صغّر' : '⛶ ملء الشاشة'}</T>
      </Pressable>
    </View>
  );
  if (full) return <View style={{ flex: 1, backgroundColor: '#000' }}><Stack.Screen options={{ headerShown: false }} />{stage}</View>;
  const chapters = <Chapters list={v.chapters} now={now} onPick={t => { player.current?.seek(t); player.current?.play(); }} />;
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
      <Stack.Screen options={{ headerShown: true, title: v.title }} />
      <Page wide>
        {stage}
        <Msg text={err} />
        <T kind="h3">{course} · {v.title}</T>
        {chapters}
        <Btn kind="outline" title="💬 عندك سؤال؟ اسأل الأستاذ" onPress={() => router.push({ pathname: '/chat', params: { course } })} />
        <T kind="small" style={{ textAlign: 'center' }}>المحاضرات للمشتركين بس، ونشرها أو تسجيلها ممنوع.</T>
      </Page>
    </ScrollView>
  );
}

type Ctx = {
  id: string; stopped: boolean; timer: ReturnType<typeof setTimeout> | undefined; player: RefObject<PlayerHandle | null>;
  setMark: (m: string) => void; setErr: (e: string) => void; setSource: (s: PlayerSource) => void;
};
// يطلب رابط تشغيل جديد ويشغّل من المكان المطلوب، ويجدد الرابط قبل لا ينتهي بدقيقتين
async function load(x: Ctx, renew: boolean, at: number) {
  try {
    const r = await call<{ url: string; mark: string; ttl: number }>('play', { video: x.id, renew });
    if (x.stopped) return;
    x.setMark(r.mark); x.setErr('');
    x.setSource({ url: r.url, at });
    clearTimeout(x.timer);
    x.timer = setTimeout(() => { if (!x.stopped) load(x, true, x.player.current?.time() || 0); }, Math.max(60, (r.ttl || 1800) - 120) * 1000);
  } catch (e) { x.setErr((e as Error).message); }
}

// وين وقف الطالب، عشان يكمل من نفس المكان ولو من جهاز ثاني
function saveProgress(p: PlayerHandle | null, id: string, last: { current: number }) {
  const t = Math.floor(p?.time() || 0);
  if (!t) return;
  last.current = t;
  call<{ ok: boolean; stop?: string }>('progress', { video: id, pos: t }).then(r => {
    if (!r.stop) return;
    p?.pause();
    notify('الحساب شغّال على جهاز ثاني', r.stop);
  }).catch(() => {});
}
