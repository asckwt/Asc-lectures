import { Alexandria_700Bold, Alexandria_800ExtraBold } from '@expo-google-fonts/alexandria';
import { IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold } from '@expo-google-fonts/ibm-plex-sans-arabic';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { brand, font } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

function Nav() {
  const { ready } = useAuth();
  const [fonts] = useFonts({ Alexandria_700Bold, Alexandria_800ExtraBold, IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold });
  useEffect(() => { if (ready && fonts) SplashScreen.hideAsync(); }, [ready, fonts]);
  if (!ready || !fonts) return null;
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: brand.navy }, headerTintColor: '#fff', headerTitleStyle: { fontFamily: font.display, fontSize: 16 }, headerBackButtonDisplayMode: 'minimal', contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="lecture/[id]" options={{ title: 'المحاضرة' }} />
      <Stack.Screen name="course/[id]" options={{ title: 'المادة' }} />
      <Stack.Screen name="chat/[course]" options={{ title: 'اسأل الأستاذ' }} />
      <Stack.Screen name="doctor/[id]" options={{ title: 'الأستاذ' }} />
      <Stack.Screen name="support" options={{ title: 'الشكاوي والاقتراحات' }} />
      <Stack.Screen name="groups" options={{ title: 'القروبات' }} />
    </Stack>
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Nav />
    </AuthProvider>
  );
}
