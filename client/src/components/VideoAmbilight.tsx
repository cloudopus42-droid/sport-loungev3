import { useRef, useEffect } from 'react';

type EdgeColors = { top: string; right: string; bottom: string; left: string };

function sampleEdges(video: HTMLVideoElement): EdgeColors {
  const w = 16, h = 16;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { top: '0,0,0', right: '0,0,0', bottom: '0,0,0', left: '0,0,0' };
  ctx.drawImage(video, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  const avg = (y1: number, y2: number, x1: number, x2: number) => {
    let r = 0, g = 0, b = 0, count = 0;
    for (let y = y1; y < y2; y++)
      for (let x = x1; x < x2; x++) {
        const i = (y * w + x) * 4;
        r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
      }
    return `${Math.round(r / count)},${Math.round(g / count)},${Math.round(b / count)}`;
  };

  return {
    top: avg(0, 2, 0, w),
    right: avg(0, h, w - 2, w),
    bottom: avg(h - 2, h, 0, w),
    left: avg(0, h, 0, 2),
  };
}

export function VideoAmbilight({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement | null> }) {
  const colorsRef = useRef<EdgeColors>({ top: '0,0,0', right: '0,0,0', bottom: '0,0,0', left: '0,0,0' });
  const styleRef = useRef<HTMLStyleElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let raf = 0, last = 0;

    const tick = (time: number) => {
      raf = requestAnimationFrame(tick);
      if (time - last < 200) return;
      last = time;
      if (video.readyState < 2 || video.paused) return;
      const c = sampleEdges(video);
      colorsRef.current = c;
      if (styleRef.current) {
        styleRef.current.textContent = `
          .ambilight-glow {
            --ambient-top: ${c.top};
            --ambient-right: ${c.right};
            --ambient-bottom: ${c.bottom};
            --ambient-left: ${c.left};
          }
        `;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [videoRef]);

  return (
    <>
      <style ref={styleRef} />
      <div
        className="ambilight-glow absolute inset-0 z-0 pointer-events-none"
        style={{
          boxShadow: `
            inset 0 60px 80px -20px rgba(var(--ambient-top, 0,0,0), 0.7),
            inset -60px 0 80px -20px rgba(var(--ambient-right, 0,0,0), 0.7),
            inset 0 -60px 80px -20px rgba(var(--ambient-bottom, 0,0,0), 0.7),
            inset 60px 0 80px -20px rgba(var(--ambient-left, 0,0,0), 0.7)
          `,
          transition: 'box-shadow 0.4s ease',
        }}
      />
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-70"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(var(--ambient-top, 0,0,0), 0.25) 0%, transparent 60%),
            radial-gradient(ellipse at 100% 50%, rgba(var(--ambient-right, 0,0,0), 0.25) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 100%, rgba(var(--ambient-bottom, 0,0,0), 0.25) 0%, transparent 60%),
            radial-gradient(ellipse at 0% 50%, rgba(var(--ambient-left, 0,0,0), 0.25) 0%, transparent 60%)
          `,
          filter: 'blur(30px)',
          transition: 'background 0.4s ease',
        }}
      />
    </>
  );
}
