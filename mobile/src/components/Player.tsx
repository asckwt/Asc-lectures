// مشغّل الفيديو على الجوال (expo-video). نسخة الويب بـ Player.web.tsx بنفس الشكل
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { StyleSheet } from 'react-native';

export type PlayerSource = { url: string; at: number } | null;
export type PlayerHandle = { seek: (t: number) => void; play: () => void; pause: () => void; time: () => number };
type Props = { source: PlayerSource; onTime?: (t: number) => void; onError?: () => void; ref?: Ref<PlayerHandle> };

export function Player({ source, onTime, onError, ref }: Props) {
  const player = useVideoPlayer(null, p => { p.timeUpdateEventInterval = 1; });
  // الدوال من برا تنحفظ بـ ref عشان تغيّرها ما يعيد تحميل الفيديو
  const cb = useRef({ onTime, onError });
  useEffect(() => { cb.current = { onTime, onError }; });
  useImperativeHandle(ref, () => ({
    seek: t => player.seekBy(t - player.currentTime),
    play: () => player.play(),
    pause: () => player.pause(),
    time: () => player.currentTime || 0,
  }), [player]);
  useEffect(() => {
    if (!source) return;
    let live = true;
    player.replaceAsync({ uri: source.url, contentType: 'hls' }).then(() => {
      if (!live) return;
      if (source.at > 0) player.seekBy(source.at - player.currentTime);
      player.play();
    }).catch(() => cb.current.onError?.());
    return () => { live = false; };
  }, [source, player]);
  useEventListener(player, 'timeUpdate', ({ currentTime }) => cb.current.onTime?.(currentTime));
  useEventListener(player, 'statusChange', ({ status }) => { if (status === 'error') cb.current.onError?.(); });
  return <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls fullscreenOptions={{ enable: false }} allowsPictureInPicture={false} contentFit="contain" />;
}
