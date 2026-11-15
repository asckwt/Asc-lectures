// مشغّل الفيديو بالمتصفح: HLS عن طريق hls.js (كروم وإيدج وفايرفوكس)، وسفاري يشغّله بروحه
import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import type { PlayerHandle, PlayerSource } from './Player';

export type { PlayerHandle, PlayerSource } from './Player';
type Props = { source: PlayerSource; onTime?: (t: number) => void; onError?: () => void; ref?: Ref<PlayerHandle> };

export function Player({ source, onTime, onError, ref }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  // الدوال من برا تنحفظ بـ ref عشان تغيّرها ما يعيد تحميل الفيديو
  const cb = useRef({ onTime, onError });
  useEffect(() => { cb.current = { onTime, onError }; });
  useImperativeHandle(ref, () => ({
    seek: t => { if (video.current) video.current.currentTime = t; },
    play: () => { video.current?.play().catch(() => {}); },
    pause: () => video.current?.pause(),
    time: () => video.current?.currentTime || 0,
  }), []);
  useEffect(() => {
    const v = video.current;
    if (!v || !source) return;
    let hls: { destroy: () => void } | null = null, live = true;
    const start = () => { if (source.at > 0) v.currentTime = source.at; v.play().catch(() => {}); };
    (async () => {
      const { default: Hls } = await import('hls.js/light');
      if (!live) return;
      if (Hls.isSupported()) {
        const h = new Hls({ maxBufferLength: 30 });
        hls = h;
        h.on(Hls.Events.ERROR, (_e, d) => { if (d.fatal) cb.current.onError?.(); });
        h.loadSource(source.url);
        h.attachMedia(v);
        h.once(Hls.Events.MANIFEST_PARSED, start);
      } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
        v.src = source.url;
        v.addEventListener('loadedmetadata', start, { once: true });
      } else cb.current.onError?.();
    })();
    return () => { live = false; hls?.destroy(); };
  }, [source]);
  return (
    <video ref={video} controls playsInline preload="metadata" controlsList="nodownload noremoteplayback noplaybackrate" disablePictureInPicture
      onContextMenu={e => e.preventDefault()} onTimeUpdate={e => cb.current.onTime?.(e.currentTarget.currentTime)}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#000' }} />
  );
}
