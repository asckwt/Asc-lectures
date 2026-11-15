// القروبات: العامة حسب الجامعة، والخاصة للمشترك
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { call } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { brand, useColors } from '@/lib/theme';
import { Card, Loading, Msg, T, column } from '@/lib/ui';

export default function Groups() {
  const { me } = useAuth();
  const c = useColors();
  const [cat, setCat] = useState<any>(null);
  const [err, setErr] = useState('');
  const [uni, setUni] = useState<string | null>(null);
  useEffect(() => { call('catalog').then(setCat).catch(e => setErr(e.message)); }, []);
  if (err) return <View style={{ flex: 1, padding: 16, backgroundColor: c.bg }}><Msg text={err} /></View>;
  if (!cat) return <Loading />;
  const pub = cat.groups.filter((g: any) => g.url);
  const unis = cat.universities.filter((u: any) => pub.some((g: any) => g.uni === u.id));
  const cur = uni || (unis.some((u: any) => u.id === me?.user.uni) ? me!.user.uni : unis[0]?.id);
  const row = (g: any, sub?: string) => (
    <Pressable key={g.id ?? g.url} accessibilityRole="link" onPress={() => Linking.openURL(g.url)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 10, minHeight: 56 }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: brand.wa, alignItems: 'center', justifyContent: 'center' }}><T>💬</T></View>
      <View style={{ flex: 1 }}><T bold>{g.title}</T>{sub ? <T kind="small">{sub}</T> : null}</View>
      <T style={{ color: c.ok }} bold>انضم</T>
    </Pressable>
  );
  const list = pub.filter((g: any) => g.uni === cur);
  const sec = (title: string, items: any[], sub: (g: any) => string) => items.length ? <Card key={title}><T kind="h2">{title}</T>{items.map(g => row(g, sub(g)))}</Card> : null;
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ ...column, padding: 16, gap: 14, paddingBottom: 40 }}>
      {!!me?.groups.length && <Card><T kind="h2">🔒 قروبات موادك الخاصة</T><T kind="small">للمشتركين بس، فيها الأستاذ وتنبيهات المادة.</T>{me.groups.map(g => row(g, g.course))}</Card>}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {unis.map((u: any) => <Pressable key={u.id} accessibilityRole="button" accessibilityState={{ selected: u.id === cur }} onPress={() => setUni(u.id)} style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: u.id === cur ? brand.navy : c.line, backgroundColor: u.id === cur ? brand.navy : c.surface, justifyContent: 'center' }}><T style={{ color: u.id === cur ? '#fff' : c.fg }}>{u.name}</T></Pressable>)}
      </View>
      {sec('الجامعة', list.filter((g: any) => g.scope === 'uni'), () => '')}
      {sec('التخصصات', list.filter((g: any) => g.scope === 'major'), g => cat.majors.find((m: any) => m.id === Number(g.ref))?.name || '')}
      {sec('المواد', list.filter((g: any) => g.scope === 'course'), g => { const co = cat.courses.find((x: any) => x.id === g.ref); return co ? `${co.code} · ${co.title}` : g.ref; })}
      {!list.length && <T kind="small">ما فيه قروبات للحين.</T>}
    </ScrollView>
  );
}
