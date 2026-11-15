// قطع الواجهة المشتركة: نص، زر، بطاقة، شارة، نجوم
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type PressableProps, type TextInputProps, type TextProps, type ViewProps } from 'react-native';
import { brand, font, useColors } from './theme';

type TP = TextProps & { kind?: 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'label'; color?: string; bold?: boolean };
export function T({ kind = 'body', color, bold, style, ...p }: TP) {
  const c = useColors();
  const base = {
    h1: { fontFamily: font.displayX, fontSize: 26, lineHeight: 38 },
    h2: { fontFamily: font.display, fontSize: 19, lineHeight: 30, color: c.ink },
    h3: { fontFamily: font.display, fontSize: 16, lineHeight: 24 },
    body: { fontFamily: bold ? font.bodyB : font.body, fontSize: 15, lineHeight: 25 },
    small: { fontFamily: bold ? font.bodyB : font.body, fontSize: 12.5, lineHeight: 19, color: c.muted },
    label: { fontFamily: font.bodyB, fontSize: 14, lineHeight: 21 },
  }[kind];
  return <Text {...p} style={[{ color: c.fg, textAlign: 'left', writingDirection: 'rtl' }, base, color ? { color } : null, style]} />;
}

type BP = PressableProps & { title: string; kind?: 'primary' | 'yellow' | 'outline' | 'wa'; small?: boolean; busy?: boolean; icon?: string };
export function Btn({ title, kind = 'primary', small, busy, icon, style, disabled, ...p }: BP) {
  const c = useColors();
  const bg = { primary: c.me === '#07005E' ? brand.navy : brand.yellow, yellow: brand.yellow, outline: 'transparent', wa: brand.wa }[kind];
  const fg = { primary: c.me === '#07005E' ? '#fff' : brand.navy, yellow: brand.navy, outline: c.ink, wa: '#06301A' }[kind];
  return (
    <Pressable accessibilityRole="button" disabled={disabled || busy} {...p}
      style={(s) => [styles.btn, { backgroundColor: bg, borderColor: kind === 'outline' ? c.line : bg, opacity: disabled || busy ? 0.6 : s.pressed ? 0.85 : 1, minHeight: small ? 44 : 48, paddingHorizontal: small ? 14 : 18 }, typeof style === 'function' ? style(s) : style]}>
      {busy ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontFamily: font.display, fontSize: small ? 14 : 15 }}>{icon ? `${icon} ` : ''}{title}</Text>}
    </Pressable>
  );
}

export function Card({ style, ...p }: ViewProps) {
  const c = useColors();
  return <View {...p} style={[{ backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: 18, padding: 16, gap: 10 }, style]} />;
}

export function Chip({ text, tone = 't' }: { text: string; tone?: 't' | 'p' | 'y' | 'n' }) {
  const c = useColors();
  const m = { t: [c.softT, c.inkT], p: [c.softP, c.inkP], y: [brand.yellow, brand.navy], n: [brand.navy, '#fff'] }[tone];
  return <View style={{ alignSelf: 'flex-start', backgroundColor: m[0], borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 }}><Text style={{ color: m[1], fontFamily: font.bodyB, fontSize: 12 }}>{text}</Text></View>;
}

export function Stars({ n, size = 14 }: { n: number; size?: number }) {
  const r = Math.round(n);
  return <Text accessibilityLabel={`${n} من 5`} style={{ color: brand.star, fontSize: size, letterSpacing: 1 }}>{'★'.repeat(r)}{'☆'.repeat(5 - r)}</Text>;
}

export function Field({ label, style, ...p }: TextInputProps & { label: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 4 }}>
      <T kind="label">{label}</T>
      <TextInput placeholderTextColor={c.muted} accessibilityLabel={label} {...p} style={[{ fontFamily: font.body, fontSize: 16, color: c.fg, backgroundColor: c.bg, borderColor: c.line, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, minHeight: 48, textAlign: 'left' }, style]} />
    </View>
  );
}

export function Msg({ text, ok }: { text?: string; ok?: boolean }) {
  const c = useColors();
  if (!text) return null;
  return <T accessibilityLiveRegion="polite" style={{ color: ok ? c.ok : c.bad, fontSize: 14 }}>{text}</T>;
}

export function Loading() {
  const c = useColors();
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}><ActivityIndicator color={brand.navy} size="large" /></View>;
}

const styles = StyleSheet.create({
  btn: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, flexDirection: 'row' },
});

// عمود المحتوى: على الجوال عرض الشاشة، وعلى الكمبيوتر بالوسط بعرض مريح للقراية
export function Page({ wide, style, ...p }: ViewProps & { wide?: boolean }) {
  return <View {...p} style={[{ width: '100%', maxWidth: wide ? 1080 : 760, alignSelf: 'center', padding: 16, gap: 14 }, style]} />;
}
// نفس عرض Page لمحتوى ScrollView
export const column = { width: '100%', maxWidth: 760, alignSelf: 'center' } as const;
