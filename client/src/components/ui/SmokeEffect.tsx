/** Ambient smoke wisps for premium lounge pages */
export function SmokeEffect() {
  const wisps = [
    { left: '8%', delay: '0s', duration: '14s', drift: '-20px', size: 120 },
    { left: '35%', delay: '3s', duration: '18s', drift: '15px', size: 160 },
    { left: '62%', delay: '1.5s', duration: '16s', drift: '-10px', size: 140 },
    { left: '85%', delay: '5s', duration: '20s', drift: '25px', size: 100 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]" aria-hidden="true">
      {wisps.map((w, i) => (
        <div
          key={i}
          className="smoke-wisp absolute bottom-0 rounded-full blur-2xl opacity-0"
          style={{
            left: w.left,
            width: w.size,
            height: w.size * 0.6,
            animationDelay: w.delay,
            animationDuration: w.duration,
            ['--drift' as string]: w.drift,
          }}
        />
      ))}
    </div>
  );
}
