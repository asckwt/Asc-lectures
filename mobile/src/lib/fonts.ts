// خطوط الجوال: ملفات الخط تنحمّل مع التطبيق. الويب ياخذها من +html.tsx (fonts.web.ts)
import { Alexandria_700Bold, Alexandria_800ExtraBold } from '@expo-google-fonts/alexandria';
import { IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold } from '@expo-google-fonts/ibm-plex-sans-arabic';
import { useFonts } from 'expo-font';

export const useAppFonts = () => useFonts({ Alexandria_700Bold, Alexandria_800ExtraBold, IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold });
