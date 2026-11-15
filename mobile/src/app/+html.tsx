// قالب صفحات الموقع: عربي من اليمين، الخطوط woff2 مقطّعة (العربي واللاتيني لحال)، وألوان الهوية
import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// الخطوط بنفس أسماء التطبيق، فالواجهة ما تتغير. المتصفح ينزّل بس الجزء اللي يحتاجه
const fonts = `@font-face{font-family:Alexandria_700Bold;font-display:swap;src:url(/watch/fonts/alexandria-arabic-700-normal.woff2) format('woff2');unicode-range:U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC}
@font-face{font-family:Alexandria_700Bold;font-display:swap;src:url(/watch/fonts/alexandria-latin-700-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:Alexandria_800ExtraBold;font-display:swap;src:url(/watch/fonts/alexandria-arabic-800-normal.woff2) format('woff2');unicode-range:U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC}
@font-face{font-family:Alexandria_800ExtraBold;font-display:swap;src:url(/watch/fonts/alexandria-latin-800-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:IBMPlexSansArabic_400Regular;font-display:swap;src:url(/watch/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2) format('woff2');unicode-range:U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC}
@font-face{font-family:IBMPlexSansArabic_400Regular;font-display:swap;src:url(/watch/fonts/ibm-plex-sans-arabic-latin-400-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:IBMPlexSansArabic_500Medium;font-display:swap;src:url(/watch/fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2) format('woff2');unicode-range:U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC}
@font-face{font-family:IBMPlexSansArabic_500Medium;font-display:swap;src:url(/watch/fonts/ibm-plex-sans-arabic-latin-500-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:IBMPlexSansArabic_600SemiBold;font-display:swap;src:url(/watch/fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2) format('woff2');unicode-range:U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC}
@font-face{font-family:IBMPlexSansArabic_600SemiBold;font-display:swap;src:url(/watch/fonts/ibm-plex-sans-arabic-latin-600-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}`;
const base = `html,body{background:#F6F5FB;color:#151238}
@media (prefers-color-scheme: dark){html,body{background:#0B0930;color:#F1F0FA}}
body{font-family:IBMPlexSansArabic_400Regular,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
:focus-visible{outline:3px solid #7DE6D5;outline-offset:2px}`;

export default function Root({ children }: PropsWithChildren) {
  // سكربتات الصفحة وستايلاتها من Expo
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } = useServerDocumentContext();
  return (
    <html {...htmlAttributes} lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="محاضرات المواد المحلولة لطلاب جامعات الكويت الخاصة، مع الطالب الأكاديمي." />
        <meta name="theme-color" content="#07005E" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="preload" href="/watch/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/watch/fonts/alexandria-arabic-700-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: fonts + base }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
