// المشغّل: رابط موقّع قصير يتجدد بروحه، اسم الطالب ورقمه يتحركون على الفيديو، فهرس الأسئلة، ومنع تصوير الشاشة
import { useEventListener } from 'expo';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { call, clock } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { brand, font, useColors } from '@/lib/theme';
import { Btn, Card, Msg, T } from '@/lib/ui';

// منع تصوير الشاشة على الجوال (الويب ما يدعمه)
const useNoCapture = Platform.OS === 'web' ? (_: string) => {} : usePreventScreenCapture;

export default function Lecture() {
  useNoCapture('lecture');
  const { id, course } = useLocalSearchParams<{ id: string; course: string }>();
  const { me, refresh } = useAuth();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const v = me?.courses.find(x => x.code === course)?.videos.find(x => x.id === id);
  const player = useVideoPlayer(null, p => { p.timeUpdateEventInterval = 1; });
  const [mark, setMark] = useState('');
  const [pos, setPos] = useState({ top: 20, left: 10 });
  const [now, setNow] = useState(0);
  const [err, setErr] = useState('');
  const [full, setFull] = useState(false);
  const lastSaved = useRef(0);

  // البيانات تتحدث لما يرجع للتطبيق، فنقرا وين وقف أول مرة بس عشان ما يعيد التشغيل
  const first = useRef(v);
  const has = !!v;
  useEffect(() => {
    const v = first.current;
    if (!v) return;
    const resume = v.pos && v.duration && v.pos < v.duration - 30 ? Math.max(0, v.pos - 3) : 0;
    const ctl = { stopped: false, timer: undefined as ReturnType<typeof setTimeout> | undefined };
    play(player, id, false, resume, setMark, setErr, ctl);
    const move = setInterval(() => setPos({ top: 8 + Math.random() * 74, left: 4 + Math.random() * 56 }), 9000);
    return () => { ctl.stopped = true; clearInterval(move); clearTimeout(ctl.timer); saveProgress(player, id, lastSaved); refresh().catch(() => {}); ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {}); };
  }, [has, id, player, refresh]);

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    setNow(currentTime);
    if (Math.abs(currentTime - lastSaved.current) >= 15) saveProgress(player, id, lastSaved);
  });
  useEventListener(player, 'statusChange', ({ status }) => { if (status === 'error') play(player, id, true, player.currentTime, setMark, setErr, { stopped: false, timer: undefined }); });

  const toggleFull = async () => {
    const next = !full;
    setFull(next);
    await ScreenOrientation.lockAsync(next ? ScreenOrientation.OrientationLock.LANDSCAPE : ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
  };

  if (!v) return <View style={{ flex: 1, backgroundColor: c.bg, padding: 16 }}><Msg text="هالمحاضرة مو ضمن اشتراكك." /></View>;
  const current = [...v.chapters].reverse().find(ch => ch.t <= now + 0.5);
  const stage = (
    <View style={full ? StyleSheet.absoluteFill : { aspectRatio: 16 / 9, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' }}>
      <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls fullscreenOptions={{ enable: false }} allowsPictureInPicture={false} contentFit="contain" />
      <T pointerEvents="none" style={{ position: 'absolute', top: `${pos.top}%`, left: `${pos.left}%`, color: 'rgba(255,255,255,0.55)', fontFamily: font.bodyB, fontSize: 13, textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 3, writingDirection: 'ltr' }}>{mark}</T>
      <Pressable accessibilityRole="button" accessibilityLabel={full ? 'صغّر' : 'ملء الشاشة'} onPress={toggleFull}
        style={{ position: 'absolute', top: full ? insets.top + 8 : 8, right: full ? insets.right + 8 : 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, minHeight: 40, paddingHorizontal: 12, justifyContent: 'center' }}>
        <T style={{ color: '#fff', fontSize: 13 }}>{full ? '✕ صغّر' : '⛶ ملء الشاشة'}</T>
      </Pressable>
    </View>
  );
  if (full) return <View style={{ flex: 1, backgroundColor: '#000' }}><Stack.Screen options={{ headerShown: false }} />{stage}</View>;
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: insets.bottom + 30 }}>
      <Stack.Screen options={{ headerShown: true, title: v.title }} />
      {stage}
      <Msg text={err} />
      <T kind="h3">{course} · {v.title}</T>
      {v.chapters.length > 0 && (
        <Card>
          <T kind="h2">الأسئلة بالمحاضرة</T>
          {v.chapters.map(ch => {
            const on = current?.t === ch.t;
            return (
              <Pressable key={ch.t} accessibilityRole="button" onPress={() => { player.seekBy(ch.t - player.currentTime); player.play(); }}
                style={{ flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 48, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1.5, borderColor: on ? brand.yellow : c.line, backgroundColor: on ? brand.yellow : 'transparent' }}>
                <T style={{ fontFamily: font.display, writingDirection: 'ltr', color: on ? brand.navy : c.fg }}>{clock(ch.t)}</T>
                <T style={{ flex: 1, color: on ? brand.navy : c.fg }}>{ch.title}</T>
              </Pressable>
            );
          })}
        </Card>
      )}
      <Btn kind="outline" title="💬 عندك سؤال؟ اسأل الأستاذ" onPress={() => router.push({ pathname: '/chat/[course]', params: { course } })} />
      <T kind="small" style={{ textAlign: 'center' }}>المحاضرات للمشتركين بس، ونشرها أو تسجيلها ممنوع.</T>
    </ScrollView>
  );
}

type Ctl = { stopped: boolean; timer: ReturnType<typeof setTimeout> | undefined };
// يطلب رابط تشغيل جديد ويشغّل من المكان المطلوب، ويجدد الرابط قبل لا ينتهي بدقيقتين
async function play(player: VideoPlayer, id: string, renew: boolean, at: number, setMark: (m: string) => void, setErr: (e: string) => void, ctl: Ctl) {
  try {
    const r = await call<{ url: string; mark: string; ttl: number }>('play', { video: id, renew });
    if (ctl.stopped) return;
    setMark(r.mark); setErr('');
    await player.replaceAsync({ uri: r.url, contentType: 'hls' });
    if (at > 0) player.seekBy(at);
    player.play();
    clearTimeout(ctl.timer);
    ctl.timer = setTimeout(() => { if (!ctl.stopped) play(player, id, true, player.currentTime, setMark, setErr, ctl); }, Math.max(60, (r.ttl || 1800) - 120) * 1000);
  } catch (e) { setErr((e as Error).message); }
}
// وين وقف الطالب، عشان يكمل من نفس المكان ولو من جهاز ثاني
function saveProgress(player: VideoPlayer, id: string, last: RefObject<number>) {
  const t = Math.floor(player.currentTime || 0);
  if (!t) return;
  last.current = t;
  call<{ ok: boolean; stop?: string }>('progress', { video: id, pos: t }).then(r => {
    if (r.stop) { player.pause(); Alert.alert('الحساب شغّال على جهاز ثاني', r.stop); }
  }).catch(() => {});
}
