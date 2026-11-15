// صفحة الأستاذ: نبذة، موادّه، وآراء الطلاب
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { ago, call } from '@/lib/api';
import { brand, font, useColors } from '@/lib/theme';
import { Card, Loading, Msg, Stars, T, column } from '@/lib/ui';

export default function Doctor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const [p, setP] = useState<any>(null);
  const [err, setErr] = useState('');
  const [photoOk, setPhotoOk] = useState(true);
  useEffect(() => { call(`doctor?id=${Number(id)}`).then(setP).catch(e => setErr(e.message)); }, [id]);
  if (err) return <View style={{ flex: 1, padding: 16, backgroundColor: c.bg }}><Msg text={err} /></View>;
  if (!p) return <Loading />;
  const d = p.doctor;
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ ...column, padding: 16, gap: 14, paddingBottom: 40 }}>
      <Stack.Screen options={{ title: d.name }} />
      <Card style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: brand.turq, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          {d.photo && photoOk ? <Image source={{ uri: d.photo }} style={{ width: 76, height: 76 }} onError={() => setPhotoOk(false)} accessibilityIgnoresInvertColors /> : <T style={{ fontFamily: font.displayX, fontSize: 28, color: brand.navy }}>{d.name.replace(/^(د|أ)\.\s*/, '').charAt(0)}</T>}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <T kind="h2">{d.name}</T>
          <T kind="small">{p.rating.count ? `★ ${p.rating.avg} من ${p.rating.count} تقييم · ` : ''}{p.courses.length} مادة · {p.lectures} محاضرة</T>
        </View>
      </Card>
      {d.bio ? <Card><T>{d.bio}</T></Card> : null}
      {p.courses.length > 0 && <Card>
        <T kind="h2">موادّه</T>
        {p.courses.map((co: any) => (
          <Pressable key={co.id} accessibilityRole="link" onPress={() => router.push({ pathname: '/course', params: { id: co.id } })} style={{ borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 12, minHeight: 56, gap: 2 }}>
            <T bold style={{ writingDirection: 'ltr' }}>{co.code} · {co.title}</T>
            <T kind="small">{co.ratings ? `★ ${co.rating} · ` : ''}{co.lectures} محاضرة</T>
          </Pressable>
        ))}
      </Card>}
      {p.ratings.length > 0 && <Card>
        <T kind="h2">آراء الطلاب</T>
        {p.ratings.map((r: any, i: number) => (
          <View key={i} style={{ gap: 4, borderTopWidth: i ? 1 : 0, borderColor: c.line, paddingTop: i ? 10 : 0 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T bold>{r.name} · {r.course}</T><Stars n={r.stars} /></View>
            {r.comment ? <T>{r.comment}</T> : null}
            <T kind="small">{ago(r.created)}</T>
          </View>
        ))}
      </Card>}
    </ScrollView>
  );
}
