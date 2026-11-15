// صفحة المادة: المحاضرات (المجانية تشتغل)، الملفات، الأسعار، التقييمات، والتقييم للمشترك
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, View } from 'react-native';
import { ago, call, kwd, mins, waLink } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { brand, font, useColors } from '@/lib/theme';
import { Btn, Card, Chip, Field, Loading, Msg, Stars, T } from '@/lib/ui';

export default function Course() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me } = useAuth();
  const c = useColors();
  const [p, setP] = useState<any>(null);
  const [err, setErr] = useState('');
  const [rate, setRate] = useState(false);
  const [now] = useState(() => Date.now());
  useEffect(() => { call(`course?id=${encodeURIComponent(id)}`).then(setP).catch(e => setErr(e.message)); }, [id]);
  if (err) return <View style={{ flex: 1, padding: 16, backgroundColor: c.bg }}><Msg text={err} /></View>;
  if (!p) return <Loading />;
  const co = p.course, mine = me?.courses.find(x => x.code === co.id);
  const plans = [['ميدتيرم', co.price_mid, co.mid_until], ['فاينل', co.price_final, co.final_until], ['الفصل كامل', co.price_full, co.final_until]].filter(x => x[1] > 0 && !(x[2] && x[2] * 1000 < now));
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
      <Stack.Screen options={{ title: co.code }} />
      <Card style={{ backgroundColor: brand.navy, borderColor: brand.navy }}>
        <Chip tone="y" text={co.code} />
        <T kind="h1" color="#fff" style={{ writingDirection: 'ltr', fontSize: 22 }}>{co.title}</T>
        <T color="#D9D7F3" style={{ fontSize: 14 }}>{p.rating.count ? `★ ${p.rating.avg} (${p.rating.count} تقييم) · ` : ''}{p.lectures.length} محاضرة{p.files.length ? ` · ${p.files.length} ملف` : ''}</T>
        {p.doctor && <Link href={{ pathname: '/doctor/[id]', params: { id: String(p.doctor.id) } }} asChild><Pressable accessibilityRole="link" style={{ minHeight: 44, justifyContent: 'center' }}><T color="#fff">يشرحها <T bold color="#fff">{p.doctor.name}</T> ←</T></Pressable></Link>}
      </Card>
      {mine ? (
        <Card>
          <T kind="h2">أنت مشترك ✓</T>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Btn small title="شوف المحاضرات" onPress={() => router.dismissTo('/')} />
            <Btn small kind="outline" title="💬 اسأل الأستاذ" onPress={() => router.push({ pathname: '/chat/[course]', params: { course: co.id } })} />
            <Btn small kind="outline" title="⭐ قيّم المادة" onPress={() => setRate(true)} />
          </View>
        </Card>
      ) : (
        <Card>
          <T kind="h2">اشترك بالمادة</T>
          {plans.length ? plans.map(([n, price]) => <View key={n} style={{ flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1.5, borderColor: c.line, borderRadius: 14, padding: 12 }}><T bold>{n}</T><T style={{ fontFamily: font.displayX, fontSize: 17 }}>{kwd(price)}</T></View>) : <T kind="small">الاشتراك مسكّر الحين.</T>}
          {plans.length > 0 && <Btn kind="yellow" title="اشترك الحين" onPress={() => Linking.openURL(waLink(`السلام عليكم، أبي أشترك بمادة ${co.code} ${co.title}.`))} />}
        </Card>
      )}
      <Card>
        <T kind="h2">المحاضرات</T>
        {p.lectures.map((l: any, i: number) => (
          <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 12 }}>
            <T style={{ fontFamily: font.display }}>{i + 1}</T>
            <View style={{ flex: 1 }}><T bold>{l.title}</T>{l.questions ? <T kind="small">{l.questions} سؤال محلول</T> : null}</View>
            {l.free ? <Chip text="مجانية" /> : <T>🔒</T>}
            <T kind="small">{mins(l.duration)}</T>
          </View>
        ))}
        {p.lectures.some((l: any) => l.free) && <T kind="small">المحاضرة المجانية تقدر تشوفها من الموقع بدون حساب.</T>}
      </Card>
      {p.files.length > 0 && <Card><T kind="h2">الملفات</T>{p.files.map((f: any, i: number) => <T key={i}>📄 {f.title} <T kind="small">· {f.pages} صفحة</T></T>)}<T kind="small">للمشتركين، وكل ملف ينزل عليه اسمك.</T></Card>}
      <Card>
        <T kind="h2">آراء الطلاب</T>
        {!p.ratings.length && <T kind="small">ما فيه تقييمات للحين.</T>}
        {p.ratings.map((r: any, i: number) => (
          <View key={i} style={{ borderTopWidth: i ? 1 : 0, borderColor: c.line, paddingTop: i ? 10 : 0, gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T bold>{r.name}</T><Stars n={r.stars} /></View>
            {r.tags.length > 0 && <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>{r.tags.map((t: string) => <Chip key={t} text={t} />)}</View>}
            {r.comment ? <T>{r.comment}</T> : null}
            <T kind="small">✓ مشترك بالمادة · {ago(r.created)}</T>
            {r.reply ? <View style={{ backgroundColor: c.bg, borderRadius: 12, padding: 8 }}><T style={{ fontSize: 14 }}><T bold>رد: </T>{r.reply}</T></View> : null}
          </View>
        ))}
      </Card>
      <RateSheet open={rate} onClose={() => setRate(false)} course={co.id} tags={p.tags} />
    </ScrollView>
  );
}

function RateSheet({ open, onClose, course, tags }: { open: boolean; onClose: () => void; course: string; tags: string[] }) {
  const c = useColors();
  const [stars, setStars] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [msg, setMsg] = useState<{ t: string; ok?: boolean }>({ t: '' });
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!stars) { setMsg({ t: 'اختار عدد النجوم.' }); return; }
    setBusy(true);
    try {
      const r = await call<{ status: string }>('rate', { course, stars, tags: picked, comment });
      setMsg({ ok: true, t: r.status === 'pending' ? 'وصلنا تقييمك، نراجعه ونتواصل معاك لو احتجت شي.' : 'شكراً! تقييمك انشر.' });
      setTimeout(onClose, 1600);
    } catch (e) { setMsg({ t: (e as Error).message }); }
    setBusy(false);
  };
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(7,0,94,0.55)' }}>
        <View style={{ backgroundColor: c.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 36, gap: 14 }}>
          <T kind="h2" style={{ textAlign: 'center' }}>شنو رأيك بالشرح؟</T>
          <View style={{ flexDirection: 'row', justifyContent: 'center', direction: 'ltr' }}>
            {[1, 2, 3, 4, 5].map(n => <Pressable key={n} accessibilityLabel={`${n} من 5`} onPress={() => setStars(n)} style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}><T style={{ fontSize: 36, lineHeight: 44, color: n <= stars ? brand.star : c.line }}>★</T></Pressable>)}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {tags.map(t => { const on = picked.includes(t); return <Pressable key={t} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => setPicked(x => on ? x.filter(y => y !== t) : [...x, t])} style={{ minHeight: 40, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5, borderColor: on ? brand.yellow : c.line, backgroundColor: on ? brand.yellow : 'transparent', justifyContent: 'center' }}><T style={{ color: on ? brand.navy : c.fg, fontSize: 14 }}>{t}</T></Pressable>; })}
          </View>
          <Field label="تعليقك (اختياري)" value={comment} onChangeText={setComment} multiline maxLength={500} />
          <T kind="small">يطلع اسمك الأول بس. التقييم نجمتين أو أقل نراجعه قبل لا ينشر.</T>
          <Msg text={msg.t} ok={msg.ok} />
          <View style={{ flexDirection: 'row', gap: 8 }}><Btn title="أرسل" busy={busy} onPress={send} style={{ flex: 1 }} /><Btn kind="outline" title="بعدين" onPress={onClose} /></View>
        </View>
      </View>
    </Modal>
  );
}
