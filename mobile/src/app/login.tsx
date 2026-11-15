// الدخول وحساب جديد: رقم الجوال هو اسم المستخدم
import { Image } from 'expo-image';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { call, waLink } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { brand, font, useColors } from '@/lib/theme';
import { Btn, Card, Field, Msg, T } from '@/lib/ui';

type Cat = { universities: { id: string; name: string }[]; majors: { id: number; uni: string; name: string }[] };

export default function Login() {
  const { me, login, signup } = useAuth();
  const c = useColors();
  const top = useSafeAreaInsets().top;
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [f, setF] = useState({ phone: '', password: '', first: '', family: '', email: '', uni: '', major: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [cat, setCat] = useState<Cat | null>(null);
  useEffect(() => { call<Cat>('catalog').then(setCat).catch(() => {}); }, []);
  if (me) return <Redirect href="/" />;
  const set = (k: keyof typeof f) => (v: string) => setF(x => ({ ...x, [k]: v, ...(k === 'uni' ? { major: '' } : {}) }));
  const submit = async () => {
    setMsg(''); setBusy(true);
    try {
      if (tab === 'login') await login(f.phone, f.password);
      else await signup({ first: f.first, family: f.family, phone: f.phone, email: f.email, password: f.password, uni: f.uni || undefined, major: f.major ? Number(f.major) : undefined });
    } catch (e: any) {
      setMsg(e.message);
      if (e.code === 'exists') setTab('login');
    }
    setBusy(false);
  };
  const majors = cat?.majors.filter(m => m.uni === f.uni) || [];
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ backgroundColor: brand.navy, paddingTop: top + 18, paddingHorizontal: 16, paddingBottom: 28, gap: 10 }}>
          <Image source={require('../../assets/images/logo-on-navy.png')} style={{ width: 170, height: 44 }} contentFit="contain" accessibilityLabel="الطالب الأكاديمي" />
          <T kind="h1" color="#fff">محاضرات المشتركين</T>
          <T color="#D9D7F3">سجّل دخولك وشوف محاضرات موادك وملفاتها.</T>
        </View>
        <View style={{ padding: 16 }}>
          <Card style={{ gap: 14 }}>
            <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: c.bg, borderRadius: 12, padding: 4 }}>
              {(['login', 'signup'] as const).map(k => (
                <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: tab === k }} onPress={() => { setTab(k); setMsg(''); }}
                  style={{ flex: 1, minHeight: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: tab === k ? c.surface : 'transparent' }}>
                  <T style={{ fontFamily: font.display, color: tab === k ? c.fg : c.muted }}>{k === 'login' ? 'تسجيل دخول' : 'حساب جديد'}</T>
                </Pressable>
              ))}
            </View>
            {tab === 'signup' && (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}><Field label="الاسم الأول" value={f.first} onChangeText={set('first')} autoComplete="given-name" /></View>
                <View style={{ flex: 1 }}><Field label="اسم العائلة" value={f.family} onChangeText={set('family')} autoComplete="family-name" /></View>
              </View>
            )}
            <Field label="رقم الجوال" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" />
            {tab === 'signup' && <Field label="الإيميل (للفواتير واسترجاع كلمة السر)" value={f.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />}
            <Field label="كلمة السر" value={f.password} onChangeText={set('password')} secureTextEntry autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
            {tab === 'signup' && cat && (
              <View style={{ gap: 6 }}>
                <T kind="label">الجامعة</T>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {cat.universities.map(u => <Pill key={u.id} on={f.uni === u.id} label={u.name} onPress={() => set('uni')(f.uni === u.id ? '' : u.id)} />)}
                </View>
                {majors.length > 0 && <>
                  <T kind="label">التخصص</T>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {majors.map(m => <Pill key={m.id} on={f.major === String(m.id)} label={m.name} onPress={() => set('major')(String(m.id))} />)}
                  </View>
                </>}
              </View>
            )}
            <Msg text={msg} />
            <Btn title={tab === 'login' ? 'دخول' : 'سجّل حسابي'} busy={busy} onPress={submit} />
            {tab === 'login'
              ? <Btn kind="outline" small title="نسيت كلمة السر؟" onPress={() => Linking.openURL(waLink('السلام عليكم، نسيت كلمة السر حق حسابي.'))} />
              : <T kind="small">بعد التسجيل نفعّل اشتراكك. الحساب يشتغل على جهازين بالكثير.</T>}
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Pill({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={onPress}
      style={{ minHeight: 40, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5, borderColor: on ? brand.navy : c.line, backgroundColor: on ? brand.navy : 'transparent', justifyContent: 'center' }}>
      <T style={{ color: on ? '#fff' : c.fg, fontSize: 14 }}>{label}</T>
    </Pressable>
  );
}
