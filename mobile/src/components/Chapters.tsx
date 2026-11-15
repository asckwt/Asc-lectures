// فهرس الأسئلة تحت الفيديو: الضغط يقفز للسؤال، واللي ينشرح الحين يتلوّن
import { Pressable } from 'react-native';
import { clock } from '@/lib/api';
import { brand, font, useColors } from '@/lib/theme';
import { Card, T } from '@/lib/ui';

type Ch = { t: number; title: string };
export function Chapters({ list, now, onPick }: { list: Ch[]; now: number; onPick: (t: number) => void }) {
  const c = useColors();
  if (!list.length) return null;
  const current = [...list].reverse().find(ch => ch.t <= now + 0.5);
  return (
    <Card>
      <T kind="h2">الأسئلة بالمحاضرة</T>
      {list.map(ch => {
        const on = current?.t === ch.t;
        return (
          <Pressable key={ch.t} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => onPick(ch.t)}
            style={{ flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 48, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1.5, borderColor: on ? brand.yellow : c.line, backgroundColor: on ? brand.yellow : 'transparent' }}>
            <T style={{ fontFamily: font.display, writingDirection: 'ltr', color: on ? brand.navy : c.fg }}>{clock(ch.t)}</T>
            <T style={{ flex: 1, color: on ? brand.navy : c.fg }}>{ch.title}</T>
          </Pressable>
        );
      })}
    </Card>
  );
}
