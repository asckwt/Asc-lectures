// صورة محمية (صور الشات): الجوال يرسل التوكن مع طلب الصورة
import { Image, type ImageStyle } from 'expo-image';
import { API, getToken } from '@/lib/api';

export function AuthImage({ path, style, label }: { path: string; style: ImageStyle; label: string }) {
  return <Image source={{ uri: `${API}/api/${path}`, headers: { Authorization: `Bearer ${getToken()}` } }} style={style} contentFit="cover" accessibilityLabel={label} />;
}
