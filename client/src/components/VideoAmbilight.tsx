export function VideoAmbilight() {
  return (
    <>
      {/* Top glow */}
      <div
        className="absolute pointer-events-none z-0"
        style={{
          top: '-80px', left: '-20%', right: '-20%', height: '160px',
          background: 'radial-gradient(ellipse 60% 80% at 50% 80%, rgba(255,191,0,0.25) 0%, rgba(255,140,0,0.08) 40%, transparent 70%)',
          filter: 'blur(40px)',
          willChange: 'filter',
        }}
      />
      {/* Bottom glow */}
      <div
        className="absolute pointer-events-none z-0"
        style={{
          bottom: '-80px', left: '-20%', right: '-20%', height: '160px',
          background: 'radial-gradient(ellipse 60% 80% at 50% 20%, rgba(255,191,0,0.18) 0%, rgba(200,100,0,0.06) 40%, transparent 70%)',
          filter: 'blur(40px)',
          willChange: 'filter',
        }}
      />
      {/* Left glow */}
      <div
        className="absolute pointer-events-none z-0"
        style={{
          left: '-80px', top: '-10%', bottom: '-10%', width: '160px',
          background: 'radial-gradient(ellipse 80% 60% at 80% 50%, rgba(255,180,50,0.15) 0%, transparent 60%)',
          filter: 'blur(40px)',
          willChange: 'filter',
        }}
      />
      {/* Right glow */}
      <div
        className="absolute pointer-events-none z-0"
        style={{
          right: '-80px', top: '-10%', bottom: '-10%', width: '160px',
          background: 'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(255,180,50,0.15) 0%, transparent 60%)',
          filter: 'blur(40px)',
          willChange: 'filter',
        }}
      />
    </>
  );
}
