// الشكاوي والاقتراحات: يرسل ويتابع الرد، ويشوف تقييماته
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { ago, call } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { brand, useColors } from '@/lib/theme';
import { Btn, Card, Field, Msg, Stars, T, column } from '@/lib/ui';

const KINDS = [['suggestion', '💡 اقتراح'], ['complaint', '😕 شكوى'], ['tech', '🛠️ مشكلة تقنية'], ['payment', '💳 الدفع والاشتراك']] as const;
const ST: Record<string, string> = { open: 'وصلتنا', working: 'نشتغل عليها', solved: 'انحلت ✓' };

export default function Support() {
  const { me } = useAuth();
  const c = useColors();
  const [kind, setKind] = useState<string>('suggestion');
  const [course, setCourse] = useState('');
  const [message, setMessage] = useState('');
  const [msg, setMsg] = useState<{ t: string; ok?: boolean }>({ t: '' });
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<{ tickets: any[]; ratings: any[] } | null>(null);
  const load = useCallback(() => call<any>('tickets').then(setData).catch(e => setMsg({ t: e.message })), []);
  useEffect(() => { load(); }, [load]);
  const send = async () => {
    if (message.trim().length < 5) { setMsg({ t: 'اكتب رسالتك.' }); return; }
    setBusy(true); setMsg({ t: '' });
    try { await call('ticket', { kind, course: course || null, message }); setMessage(''); setMsg({ ok: true, t: 'وصلتنا ✓ بنرد عليك هني.' }); await load(); }
    catch (e) { setMsg({ t: (e as Error).message }); }
    setBusy(false);
  };
  const pill = (on: boolean, label: string, onPress: () => void) => (
    <Pressable key={label} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={onPress} style={{ minHeight: 48, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1.5, borderColor: on ? c.ink : c.line, justifyContent: 'center', flexGrow: 1, flexBasis: '45%' }}><T bold>{label}</T></Pressable>
  );
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ ...column, padding: 16, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Card>
        <T kind="h2">رسالة جديدة</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{KINDS.map(([k, l]) => pill(kind === k, l, () => setKind(k)))}</View>
        {!!me?.courses.length && <>
          <T kind="label">المادة (اختياري)</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {me.courses.map(x => <Pressable key={x.code} onPress={() => setCourse(course === x.code ? '' : x.code)} style={{ minHeight: 40, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5, borderColor: course === x.code ? brand.navy : c.line, backgroundColor: course === x.code ? brand.navy : 'transparent', justifyContent: 'center' }}><T style={{ color: course === x.code ? '#fff' : c.fg }}>{x.code}</T></Pressable>)}
          </View>
        </>}
        <Field label="رسالتك" value={message} onChangeText={setMessage} multiline maxLength={2000} placeholder="اكتب بالتفصيل، مثلاً: الفيديو يوقف عندي بالمحاضرة 3" style={{ minHeight: 100, textAlignVertical: 'top' }} />
        <Msg text={msg.t} ok={msg.ok} />
        <Btn title="أرسل" busy={busy} onPress={send} />
      </Card>
      {!!data?.tickets.length && <Card>
        <T kind="h2">رسايلك</T>
        {data.tickets.map(t => (
          <View key={t.id} style={{ borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 12, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T bold>{KINDS.find(k => k[0] === t.kind)?.[1]}{t.course ? ` · ${t.course}` : ''}</T><T kind="small" bold>{ST[t.status]}</T></View>
            <T>{t.message}</T>
            {t.reply ? <View style={{ backgroundColor: c.softT, borderRadius: 12, padding: 8 }}><T style={{ fontSize: 14 }}><T bold>ردنا: </T>{t.reply}</T></View> : null}
            <T kind="small">{ago(t.created)}</T>
          </View>
        ))}
      </Card>}
      {!!data?.ratings.length && <Card>
        <T kind="h2">تقييماتك</T>
        {data.ratings.map(r => (
          <View key={r.course} style={{ borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 12, gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T bold>{r.course}</T><Stars n={r.stars} /></View>
            {r.comment ? <T>{r.comment}</T> : null}
            <T kind="small">{r.status === 'pending' ? 'قيد المراجعة' : r.status === 'hidden' ? 'مخفي' : 'منشور'}</T>
            {r.reply ? <T style={{ fontSize: 14 }}><T bold>الرد: </T>{r.reply}</T> : null}
          </View>
        ))}
      </Card>}
    </ScrollView>
  );
}
