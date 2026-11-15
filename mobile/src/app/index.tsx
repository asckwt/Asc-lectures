// الشاشة الرئيسية: الأخبار أول شي، وبعدها مواد الطالب ومحاضراتها وملفاتها
import { Image } from 'expo-image';
import { Link, Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ago, clock, date, mins, waLink } from '@/lib/api';
import { useAuth, type Me } from '@/lib/auth';
import { confirm, notify } from '@/lib/dialog';
import { canShare, openFile, printFile, shareFile } from '@/lib/files';
import { brand, font, useColors } from '@/lib/theme';
import { Btn, Card, Chip, Page, T } from '@/lib/ui';

export default function Home() {
  const { me, refresh, logout } = useAuth();
  const c = useColors();
  const top = useSafeAreaInsets().top;
  const [busy, setBusy] = useState(false);
  const [allNews, setAllNews] = useState(false);
  // الكمبيوتر: الأخبار عمود جنب المواد
  const wide = useWindowDimensions().width >= 1000;
  if (!me) return <Redirect href="/login" />;
  const first = me.user.name.split(' ')[0];
  const hi = `السلام عليكم، أنا ${me.user.name} ورقمي ${me.user.phone}`;
  const news = allNews ? me.news : me.news.slice(0, 3);
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={busy} onRefresh={async () => { setBusy(true); await refresh(); setBusy(false); }} />}>
      <View style={{ backgroundColor: brand.navy, paddingTop: top + 12, paddingBottom: 22 }}>
       <Page wide style={{ paddingVertical: 0, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Image source={require('../../assets/images/logo-on-navy.png')} style={{ width: 150, height: 36 }} contentFit="contain" accessibilityLabel="الطالب الأكاديمي" />
          <Pressable accessibilityRole="button" onPress={() => confirm('تسجيل خروج', 'تبي تطلع من حسابك؟', 'إيه', logout)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 }}>
            <T style={{ color: '#fff', fontSize: 13 }}>تسجيل خروج</T>
          </Pressable>
        </View>
        <T kind="h1" color="#fff">هلا {first} 👋</T>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <NavPill label="القروبات" onPress={() => router.push('/groups')} />
          <NavPill label="الشكاوي والاقتراحات" onPress={() => router.push('/support')} />
        </View>
       </Page>
      </View>
      <Page wide style={wide ? { flexDirection: 'row', alignItems: 'flex-start', gap: 22 } : { gap: 18 }}>
       {me.news.length > 0 && (
        <View style={wide ? { width: 360, order: 1 } as object : undefined}>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T kind="h2">📣 الأخبار</T>
              {me.news.length > 3 && !allNews && <Btn small kind="outline" title="كل الأخبار" onPress={() => setAllNews(true)} />}
            </View>
            {news.map(n => (
              <View key={n.id} style={{ borderWidth: 1, borderColor: n.pinned ? brand.yellow : c.line, backgroundColor: n.pinned ? '#FFF8DB' : c.surface, borderRadius: 14, padding: 12, gap: 4 }}>
                {n.pinned ? <Chip tone="n" text="📌 مثبّت" /> : n.scope === 'uni' ? <Chip tone="t" text="جامعتك" /> : n.scope === 'course' ? <Chip tone="p" text={`${n.ref} · من أستاذك`} /> : null}
                <T kind="h3" color={n.pinned ? '#151238' : undefined}>{n.title}</T>
                {n.body ? <T color={n.pinned ? '#151238' : undefined} style={{ fontSize: 14 }}>{n.body}</T> : null}
                <T kind="small" color={n.pinned ? '#5B5878' : undefined}>{n.author} · {ago(n.created)}</T>
              </View>
            ))}
          </Card>
        </View>
       )}
       <View style={wide ? { flex: 1, gap: 18 } : { gap: 18 }}>
        {me.user.status !== 'active' ? (
          <Card style={{ alignItems: 'center' }}>
            <T style={{ fontSize: 40 }}>⏳</T>
            <T kind="h2">حسابك ينتظر التفعيل</T>
            <T style={{ textAlign: 'center', color: c.muted }}>أرسل لنا بالواتساب عشان نأكد اشتراكك ونفتح لك محاضرات موادك.</T>
            <Btn kind="wa" title="أرسل لنا بالواتساب" onPress={() => Linking.openURL(waLink(`${hi}، سجّلت بالتطبيق وأبي أفعّل اشتراكي.`))} />
          </Card>
        ) : me.courses.length === 0 ? (
          <Card style={{ alignItems: 'center' }}>
            <T style={{ fontSize: 40 }}>📚</T>
            <T kind="h2">ما عندك مواد مفعّلة الحين</T>
            <Btn kind="wa" title="كلمنا بالواتساب" onPress={() => Linking.openURL(waLink(`${hi}، ما طلعت لي مواد بالتطبيق.`))} />
          </Card>
        ) : me.courses.map(course => <CourseCard key={course.code} course={course} me={me} />)}
       </View>
      </Page>
    </ScrollView>
  );
}

function NavPill({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="link" onPress={onPress} style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingHorizontal: 14, minHeight: 40, justifyContent: 'center' }}><T style={{ color: '#fff', fontFamily: font.bodyB, fontSize: 14 }}>{label}</T></Pressable>;
}

function CourseCard({ course, me }: { course: Me['courses'][number]; me: Me }) {
  const c = useColors();
  const [fileBusy, setFileBusy] = useState('');
  const group = me.groups.find(g => g.course === course.code);
  const run = async (key: string, fn: () => Promise<void>) => {
    setFileBusy(key);
    try { await fn(); } catch (e) { notify('ما زبطت', (e as Error).message || 'جرّب مرة ثانية.'); }
    setFileBusy('');
  };
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <T kind="h2" style={{ writingDirection: 'ltr' }}>{course.code}</T>
        <T kind="small">اشتراكك لين {date(course.until)}</T>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Link href={{ pathname: '/course', params: { id: course.code } }} asChild><Btn small kind="outline" title="صفحة المادة" /></Link>
        <Link href={{ pathname: '/chat', params: { course: course.code } }} asChild><Btn small kind="outline" title={`💬 اسأل الأستاذ${me.unread ? ` (${me.unread})` : ''}`} /></Link>
        {group && <Btn small kind="wa" title="قروب المادة 🔒" onPress={() => Linking.openURL(group.url)} />}
      </View>
      {course.videos.length === 0 && <T kind="small">المحاضرات بتنزل هني قريب.</T>}
      {course.videos.map((v, i) => {
        const done = v.duration && v.pos >= v.duration - 30;
        return (
          <Pressable key={v.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/lecture', params: { id: v.id, course: course.code } })}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: pressed ? brand.turq : c.line, borderRadius: 14, padding: 12, minHeight: 56 })}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}><T style={{ fontFamily: font.display, fontSize: 13 }}>{i + 1}</T></View>
            <View style={{ flex: 1 }}>
              <T bold>{v.title}</T>
              {v.chapters.length > 0 && <T kind="small">{v.chapters.length} سؤال محلول</T>}
            </View>
            <T kind="small" color={done ? c.ok : undefined}>{done ? '✓ خلصتها' : v.pos && v.duration ? `كمّل من ${clock(v.pos)}` : mins(v.duration)}</T>
          </Pressable>
        );
      })}
      {course.files.length > 0 && (
        <View style={{ gap: 8, marginTop: 6 }}>
          <T kind="h3" color={c.ink}>الملفات</T>
          {course.files.map(f => (
            <View key={f.id} style={{ borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 12, gap: 8 }}>
              <T bold>📄 {f.title} <T kind="small">· {f.pages} صفحة</T></T>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                <Btn small kind="outline" title="فتح" busy={fileBusy === f.id + 'o'} onPress={() => run(f.id + 'o', () => openFile(f.id, f.title))} />
                <Btn small kind="outline" title="طباعة" busy={fileBusy === f.id + 'p'} onPress={() => run(f.id + 'p', () => printFile(f.id, f.title))} />
                <Btn small kind="outline" title={canShare() ? 'مشاركة' : 'تنزيل'} busy={fileBusy === f.id + 's'} onPress={() => run(f.id + 's', () => shareFile(f.id, f.title))} />
              </View>
            </View>
          ))}
          <T kind="small">كل ملف عليه اسمك ورقمك، فهو لك بروحك.</T>
        </View>
      )}
    </Card>
  );
}
