import { useRef, useEffect } from 'react';

type RGB = [number, number, number];
type EdgeRGB = Record<'top' | 'right' | 'bottom' | 'left', RGB>;

function sample(video: HTMLVideoElement): EdgeRGB {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 8;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(video, 0, 0, 8, 8);
  const d = ctx.getImageData(0, 0, 8, 8).data;

  const avg = (a: number, b: number, c: number, d: number): RGB => {
    let r = 0, g = 0, bl = 0, n = 0;
    for (let y = a; y < b; y++)
      for (let x = c; x < d; x++) {
        const i = (y * 8 + x) * 4;
        r += d[i]; g += d[i + 1]; bl += d[i + 2]; n++;
      }
    return [~~(r / n), ~~(g / n), ~~(bl / n)];
  };

  return {
    top: avg(0, 1, 0, 8),
    right: avg(0, 8, 7, 8),
    bottom: avg(7, 8, 0, 8),
    left: avg(0, 8, 0, 1),
  };
}

function lerp(a: RGB, b: RGB, t: number): RGB {
  return [
    a[0] + (b[0] - a[0]) * t | 0,
    a[1] + (b[1] - a[1]) * t | 0,
    a[2] + (b[2] - a[2]) * t | 0,
  ];
}

export function VideoAmbilight({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement | null> }) {
  const cur = useRef<EdgeRGB>({ top: [0, 0, 0], right: [0, 0, 0], bottom: [0, 0, 0], left: [0, 0, 0] });
  const tgt = useRef<EdgeRGB>({ top: [0, 0, 0], right: [0, 0, 0], bottom: [0, 0, 0], left: [0, 0, 0] });
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const div = el.current;
    if (!video || !div) return;

    let id = 0, last = 0;
    const sides: (keyof EdgeRGB)[] = ['top', 'right', 'bottom', 'left'];

    const tick = (now: number) => {
      id = requestAnimationFrame(tick);
      const ready = video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;

      if (ready && !video.paused && now - last > 100) {
        tgt.current = sample(video);
        last = now;
      }

      const c = cur.current, t = tgt.current;
      for (const s of sides) c[s] = lerp(c[s], t[s], 0.1);

      div.style.background = `
        radial-gradient(ellipse at 50% 0%, rgba(${c.top[0]},${c.top[1]},${c.top[2]},0.4) 0%, transparent 70%),
        radial-gradient(ellipse at 100% 50%, rgba(${c.right[0]},${c.right[1]},${c.right[2]},0.4) 0%, transparent 70%),
        radial-gradient(ellipse at 50% 100%, rgba(${c.bottom[0]},${c.bottom[1]},${c.bottom[2]},0.4) 0%, transparent 70%),
        radial-gradient(ellipse at 0% 50%, rgba(${c.left[0]},${c.left[1]},${c.left[2]},0.4) 0%, transparent 70%)
      `;
    };

    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [videoRef]);

  return (
    <div
      ref={el}
      className="absolute pointer-events-none z-0"
      style={{
        top: '-70px',
        right: '-70px',
        bottom: '-70px',
        left: '-70px',
        filter: 'blur(45px)',
        opacity: 0.65,
        willChange: 'background',
        transform: 'translateZ(0)',
      }}
    />
  );
}
