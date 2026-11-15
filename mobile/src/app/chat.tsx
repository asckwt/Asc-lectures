// الشات مع أستاذ المادة: نص وصورة الحل. يتحدث كل 20 ثانية والشاشة مفتوحة
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthImage } from '@/components/AuthImage';
import { ago, call } from '@/lib/api';
import { readLocal } from '@/lib/files';
import { brand, font, useColors } from '@/lib/theme';
import { Msg, T, column } from '@/lib/ui';

type M = { id: number; from_staff: number; author: string; body: string; image: number; created: number };

export default function Chat() {
  const { course } = useLocalSearchParams<{ course: string }>();
  const c = useColors();
  const bottom = useSafeAreaInsets().bottom;
  const [msgs, setMsgs] = useState<M[] | null>(null);
  const [teacher, setTeacher] = useState('');
  const [text, setText] = useState('');
  const [pic, setPic] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  const load = useCallback(async () => {
    try { setMsgs((await call<{ messages: M[] }>(`chat?course=${encodeURIComponent(course)}`)).messages); }
    catch (e) { setErr((e as Error).message); }
  }, [course]);
  useEffect(() => {
    const first = setTimeout(load, 0);
    call<any>(`course?id=${encodeURIComponent(course)}`).then(p => setTeacher(p.doctor?.name || '')).catch(() => {});
    const t = setInterval(load, 20000);
    return () => { clearInterval(t); clearTimeout(first); };
  }, [course, load]);

  // نصغّر الصورة لـ 1600 بكسل JPEG قبل الرفع: أسرع، وتنشال منها بيانات الموقع
  const pick = async (camera: boolean) => {
    setErr('');
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, exif: false };
    if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) { setErr('اسمح للتطبيق يستخدم الكاميرا من الإعدادات.'); return; }
    const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (r.canceled) return;
    const a = r.assets[0];
    const ctx = ImageManipulator.ImageManipulator.manipulate(a.uri);
    if (Math.max(a.width, a.height) > 1600) ctx.resize(a.width >= a.height ? { width: 1600 } : { height: 1600 });
    const out = await (await ctx.renderAsync()).saveAsync({ compress: 0.85, format: ImageManipulator.SaveFormat.JPEG });
    setPic(out.uri);
  };
  const send = async () => {
    const body = text.trim();
    if (!body && !pic) return;
    setBusy(true); setErr('');
    try {
      if (pic) { await call(`chatimg?course=${encodeURIComponent(course)}`, await readLocal(pic), 'image/jpeg'); setPic(null); }
      if (body) { await call('chat', { course, body }); setText(''); }
      await load();
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0} style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen options={{ title: teacher ? `${teacher} · ${course}` : 'اسأل الأستاذ' }} />
      <ScrollView ref={scroll} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })} contentContainerStyle={{ ...column, padding: 16, gap: 10 }}>
        {msgs && msgs.length === 0 && <T style={{ textAlign: 'center', color: c.muted, marginTop: 40 }}>اكتب سؤالك أو أرفق صورة حلّك، والأستاذ يرد عليك هني. المحادثة بينك وبينه بس.</T>}
        {msgs?.map(m => {
          const mine = !m.from_staff;
          return (
            <View key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '82%', backgroundColor: mine ? c.me : c.surface, borderWidth: mine ? 0 : 1, borderColor: c.line, borderRadius: 18, padding: 10, gap: 4 }}>
              {!mine && <T style={{ fontFamily: font.display, fontSize: 12, color: c.inkP }}>{m.author}</T>}
              {m.image ? <AuthImage path={`chatimg?id=${m.id}`} style={{ width: 220, height: 220, borderRadius: 12, backgroundColor: '#fff' }} label="صورة" /> : null}
              {m.body ? <T color={mine ? '#fff' : undefined}>{m.body}</T> : null}
              <T kind="small" color={mine ? 'rgba(255,255,255,0.75)' : undefined}>{ago(m.created)}{mine ? ' · ✓' : ''}</T>
            </View>
          );
        })}
      </ScrollView>
      <View style={{ backgroundColor: c.surface, borderTopWidth: 1, borderColor: c.line, paddingBottom: bottom }}>
       <View style={{ ...column, padding: 10, gap: 8 }}>
        {pic && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.softT, borderRadius: 12, padding: 6 }}>
            <Image source={{ uri: pic }} style={{ width: 44, height: 44, borderRadius: 8 }} />
            <T style={{ flex: 1, color: c.inkT, fontSize: 13 }}>الصورة جاهزة ترسل</T>
            <Pressable accessibilityLabel="شيل الصورة" onPress={() => setPic(null)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><T color={c.inkT}>✕</T></Pressable>
          </View>
        )}
        <Msg text={err} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          <TextInput value={text} onChangeText={setText} placeholder="اكتب سؤالك للأستاذ" placeholderTextColor={c.muted} multiline maxLength={2000} accessibilityLabel="رسالتك"
            style={{ flex: 1, minHeight: 46, maxHeight: 140, borderWidth: 1.5, borderColor: c.line, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, fontFamily: font.body, fontSize: 15, color: c.fg, backgroundColor: c.bg, textAlign: 'right' }} />
          <Pressable accessibilityRole="button" accessibilityLabel="أرسل" disabled={busy} onPress={send}
            style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: brand.navy, alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.6 : 1 }}>
            <T style={{ color: brand.yellow, fontSize: 20, transform: [{ scaleX: -1 }] }}>➤</T>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable accessibilityRole="button" onPress={() => pick(false)} style={{ minHeight: 44, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.ink, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' }}><T style={{ fontFamily: font.display, color: c.ink, fontSize: 14 }}>📎 أرفق صورة حلّك</T></Pressable>
          <Pressable accessibilityRole="button" onPress={() => pick(true)} style={{ minHeight: 44, borderWidth: 1.5, borderColor: c.line, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' }}><T style={{ fontFamily: font.display, color: c.ink, fontSize: 14 }}>📷 صوّر</T></Pressable>
        </View>
       </View>
      </View>
    </KeyboardAvoidingView>
  );
}
