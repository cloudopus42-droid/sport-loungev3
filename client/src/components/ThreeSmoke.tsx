import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { WebGLSafeBoundary } from './WebGLSafeBoundary';

interface SmokeParticleProps {
  texture: THREE.Texture;
}

function SmokeParticles({ texture }: SmokeParticleProps) {
  const groupRef = useRef<THREE.Group | null>(null);
  const { viewport } = useThree();

  // Procedural particle configurations
  const particles = useMemo(() => {
    const arr = [];
    const count = 32;
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * viewport.width * 1.5,
        y: (Math.random() - 0.5) * viewport.height * 1.5,
        z: Math.random() * 2 - 1,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.05,
        speedX: (Math.random() - 0.5) * 0.005,
        speedY: 0.004 + Math.random() * 0.006, // Upwards drift
        scale: 1.5 + Math.random() * 2.5,
      });
    }
    return arr;
  }, [viewport]);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    groupRef.current.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      const data = particles[index];
      if (!data) return;

      // Update positions
      data.y += data.speedY * (delta * 60);
      data.x += data.speedX * (delta * 60);
      data.rotation += data.spin * delta;

      // Wrap around bounds
      if (data.y > viewport.height * 0.8) {
        data.y = -viewport.height * 0.8;
        data.x = (Math.random() - 0.5) * viewport.width * 1.5;
      }
      if (data.x < -viewport.width * 0.9) data.x = viewport.width * 0.9;
      if (data.x > viewport.width * 0.9) data.x = -viewport.width * 0.9;

      mesh.position.set(data.x, data.y, data.z);
      mesh.rotation.z = data.rotation;
    });
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, idx) => (
        <mesh key={idx} scale={[p.scale, p.scale, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={texture}
            transparent={true}
            opacity={0.08}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

export function ThreeSmoke() {
  // Generate soft volumetric cloud texture programmatically
  const smokeTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      // Soft luxury gold radial smoke glow
      grad.addColorStop(0, 'rgba(212, 175, 55, 0.45)');
      grad.addColorStop(0.3, 'rgba(212, 175, 55, 0.12)');
      grad.addColorStop(0.7, 'rgba(255, 184, 0, 0.02)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-[2]">
      <WebGLSafeBoundary fallback={
        <div className="absolute inset-0 bg-gradient-to-tr from-accent-gold/5 via-transparent to-accent-gold/5 animate-pulse opacity-40" />
      }>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 60 }}
          style={{ width: '100%', height: '100%', background: 'transparent' }}
        >
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} color="#D4AF37" intensity={1.5} />
          <SmokeParticles texture={smokeTexture} />
        </Canvas>
      </WebGLSafeBoundary>
    </div>
  );
}
export default ThreeSmoke;

