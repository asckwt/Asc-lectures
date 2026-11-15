import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, Pressable } from 'react-native';
import { AuthProvider, useAuth } from '@/lib/auth';
import { useAppFonts } from '@/lib/fonts';
import { brand, font } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();


// الويب: شعار يرجع للرئيسية بكل صفحة (اللي يفتح رابط مادة على طول ما عنده زر رجوع)
const home = Platform.OS === 'web' ? () => (
  <Link href="/" asChild>
    <Pressable accessibilityRole="link" accessibilityLabel="الرئيسية" style={{ paddingHorizontal: 16, minHeight: 44, justifyContent: 'center' }}>
      <Image source={require('../../assets/images/logo-on-navy.png')} style={{ width: 120, height: 30 }} contentFit="contain" />
    </Pressable>
  </Link>
) : undefined;

function Nav() {
  const { ready } = useAuth();
  const [fonts] = useAppFonts();
  useEffect(() => { if (ready && fonts) SplashScreen.hideAsync(); }, [ready, fonts]);
  if (!ready || !fonts) return null;
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: brand.navy }, headerTintColor: '#fff', headerTitleStyle: { fontFamily: font.display, fontSize: 16 }, headerBackButtonDisplayMode: 'minimal', contentStyle: { backgroundColor: 'transparent' }, headerRight: home }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="lecture" options={{ title: 'المحاضرة' }} />
      <Stack.Screen name="course" options={{ title: 'المادة' }} />
      <Stack.Screen name="chat" options={{ title: 'اسأل الأستاذ' }} />
      <Stack.Screen name="doctor" options={{ title: 'الأستاذ' }} />
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
