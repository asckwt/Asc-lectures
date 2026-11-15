// ألوان الهوية والخطوط، فاتح وداكن
import { useColorScheme } from 'react-native';

export const brand = { navy: '#07005E', yellow: '#F7DC6B', turq: '#7DE6D5', pink: '#E980C2', wa: '#25D366', star: '#E5A800' };
const light = { bg: '#F6F5FB', surface: '#FFFFFF', fg: '#151238', muted: '#5B5878', line: '#E2E0EE', ink: '#07005E', bad: '#B42318', ok: '#067647', softY: '#FFF8DB', softT: '#DDF8F3', softP: '#FBE6F3', inkT: '#0B5D52', inkP: '#8A1F63', me: '#07005E' };
const dark: typeof light = { bg: '#0B0930', surface: '#141142', fg: '#F1F0FA', muted: '#B4B1D3', line: '#2A2663', ink: '#F7DC6B', bad: '#FDA29B', ok: '#75E0A7', softY: '#2B2510', softT: '#0E2B2A', softP: '#2E1328', inkT: '#7DE6D5', inkP: '#F2A9D7', me: '#2A1FB0' };
export type Palette = typeof light;
export function useColors(): Palette { return useColorScheme() === 'dark' ? dark : light; }
export const font = { display: 'Alexandria_700Bold', displayX: 'Alexandria_800ExtraBold', body: 'IBMPlexSansArabic_400Regular', bodyM: 'IBMPlexSansArabic_500Medium', bodyB: 'IBMPlexSansArabic_600SemiBold' };
