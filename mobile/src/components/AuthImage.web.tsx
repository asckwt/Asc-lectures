// صورة محمية بالمتصفح: <img> ما يقدر يرسل التوكن، فنجيبها بـ fetch ونعرضها من الذاكرة
import { Image, type ImageStyle } from 'expo-image';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { bytes } from '@/lib/api';

const cache = new Map<string, string>();
export function AuthImage({ path, style, label }: { path: string; style: ImageStyle; label: string }) {
  const [url, setUrl] = useState(() => cache.get(path) || '');
  useEffect(() => {
    if (cache.has(path)) return;
    let live = true;
    bytes(path).then(b => {
      const u = URL.createObjectURL(new Blob([b as BlobPart]));
      cache.set(path, u);
      if (live) setUrl(u);
    }).catch(() => {});
    return () => { live = false; };
  }, [path]);
  if (!url) return <View style={style} accessibilityLabel={label} />;
  return <Image source={{ uri: url }} style={style} contentFit="cover" accessibilityLabel={label} />;
}
