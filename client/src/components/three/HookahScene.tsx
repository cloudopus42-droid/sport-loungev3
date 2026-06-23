import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const BOWL_CONFIGS = [
  { color: '#C4956A', roughness: 0.9, metalness: 0, label: 'classic' },
  { color: '#FF6B52', roughness: 0.7, metalness: 0, label: 'grapefruit' },
  { color: '#4CAF50', roughness: 0.8, metalness: 0, label: 'cactus' },
  { color: '#D4A017', roughness: 0.6, metalness: 0.1, label: 'pineapple' },
  { color: '#FF8C00', roughness: 0.7, metalness: 0, label: 'orange' },
];

const LIQUID_CONFIGS = [
  { color: '#87CEEB', emissive: '#4169E1', bubbleSpeed: 0.3, bubbleCount: 8 },
  { color: '#8B0000', emissive: '#5C0000', bubbleSpeed: 0.2, bubbleCount: 5 },
  { color: '#3C1414', emissive: '#1A0000', bubbleSpeed: 0.8, bubbleCount: 20 },
  { color: '#FFA500', emissive: '#E07000', bubbleSpeed: 0.4, bubbleCount: 10 },
  { color: '#B0E0E6', emissive: '#87CEEB', bubbleSpeed: 0.15, bubbleCount: 3 },
];

function Base() {
  return (
    <group position={[0, -1.2, 0]}>
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.8, 0.9, 0.1, 32]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <torusGeometry args={[0.75, 0.06, 16, 48]} />
        <meshStandardMaterial color="#B08D57" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.6, 0.7, 0.08, 32]} />
        <meshStandardMaterial color="#2A2A2A" roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
}

function WaterChamber({ liquidIndex, time }: { liquidIndex: number; time: number }) {
  const liquid = LIQUID_CONFIGS[liquidIndex];
  const prevIdx = useRef(liquidIndex);
  const currentColor = useRef(new THREE.Color(liquid.color));
  const currentEmissive = useRef(new THREE.Color(liquid.emissive));

  useFrame(() => {
    if (prevIdx.current !== liquidIndex) {
      prevIdx.current = liquidIndex;
    }
    const target = new THREE.Color(liquid.color);
    const targetE = new THREE.Color(liquid.emissive);
    currentColor.current.lerp(target, 0.03);
    currentEmissive.current.lerp(targetE, 0.03);
  });

  return (
    <group position={[0, -0.5, 0]}>
      <mesh>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshPhysicalMaterial
          color={currentColor.current}
          transparent
          opacity={0.35}
          roughness={0.1}
          metalness={0}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
          envMapIntensity={0.5}
        />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshPhysicalMaterial
          color={currentColor.current}
          emissive={currentEmissive.current}
          emissiveIntensity={0.15}
          transparent
          opacity={0.6}
          roughness={0.2}
          metalness={0}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.53, 32, 32]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          roughness={0}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

function Bubbles({ liquidIndex, time }: { liquidIndex: number; time: number }) {
  const liquid = LIQUID_CONFIGS[liquidIndex];
  const count = liquid.bubbleCount;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const positions = useMemo(() => {
    const arr: number[][] = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 0.2 + Math.random() * 0.25;
      arr.push([
        r * Math.sin(phi) * Math.cos(theta),
        -0.4 + Math.random() * 0.6,
        r * Math.cos(phi),
      ]);
    }
    return arr;
  }, [count]);

  const speeds = useMemo(() => positions.map(() => 0.2 + Math.random() * 0.4), [positions]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    positions.forEach((pos, i) => {
      pos[1] += speeds[i] * delta * liquid.bubbleSpeed;
      if (pos[1] > 0.3) pos[1] = -0.4;
      dummy.position.set(pos[0], pos[1], pos[2]);
      const s = 0.008 + Math.random() * 0.004;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} position={[0, -0.5, 0]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshPhysicalMaterial color="#ffffff" transparent opacity={0.4} roughness={0} metalness={0} />
    </instancedMesh>
  );
}

function Stem() {
  return (
    <group position={[0, 0.1, 0]}>
      <mesh>
        <cylinderGeometry args={[0.04, 0.05, 1.4, 12]} />
        <meshStandardMaterial color="#2A2A2A" roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
}

function Tray() {
  return (
    <mesh position={[0, 0.22, 0]}>
      <cylinderGeometry args={[0.35, 0.3, 0.04, 24]} />
      <meshStandardMaterial color="#1A1A1A" roughness={0.3} metalness={0.7} />
    </mesh>
  );
}

function ClassicBowl({ color, roughness, metalness }: { color: string; roughness: number; metalness: number }) {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.2, 1.0, 0.1, 24, 16, 0, Math.PI]} />
        <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
      </mesh>
      <mesh position={[0, -0.03, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.05, 16]} />
        <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
      </mesh>
    </group>
  );
}

function GrapefruitBowl({ color, roughness, metalness }: { color: string; roughness: number; metalness: number }) {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.22, 0.24, 0.18, 24, 18]} />
        <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.08, 16, 12]} />
        <meshStandardMaterial color="#FF8C69" roughness={0.6} metalness={0} />
      </mesh>
    </group>
  );
}

function CactusBowl({ color, roughness, metalness }: { color: string; roughness: number; metalness: number }) {
  return (
    <group>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.25, 12]} />
        <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
      </mesh>
      <mesh position={[-0.13, 0.12, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.05, 0.04, 0.12, 8]} />
        <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
      </mesh>
      <mesh position={[0.13, 0.1, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.05, 0.04, 0.1, 8]} />
        <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
      </mesh>
      {[0, 0.05, 0.1, 0.15, 0.2].map((y) => (
        <mesh key={y} position={[0.2, y + 0.03, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.015, 0.04, 4]} />
          <meshStandardMaterial color="#3E8E41" />
        </mesh>
      ))}
    </group>
  );
}

function PineappleBowl({ color, roughness, metalness }: { color: string; roughness: number; metalness: number }) {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.22, 12]} />
        <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.19, 0.21, 0.22, 12]} />
        <meshStandardMaterial
          color={color}
          roughness={roughness}
          metalness={metalness}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
      {[0.17, 0.19, 0.21].map((y, i) => (
        <mesh key={y} position={[0, y + 0.11, 0]} rotation={[0.2 + i * 0.1, 0, 0]}>
          <coneGeometry args={[0.02, 0.06, 4]} />
          <meshStandardMaterial color="#2D8A2D" />
        </mesh>
      ))}
    </group>
  );
}

function OrangeBowl({ color, roughness, metalness }: { color: string; roughness: number; metalness: number }) {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.22, 20, 18]} />
        <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#2D8A2D" roughness={0.8} metalness={0} />
      </mesh>
    </group>
  );
}

function Bowl({ bowlIndex, transitionProgress }: { bowlIndex: number; transitionProgress: number }) {
  const config = BOWL_CONFIGS[bowlIndex];
  const scale = 0.6 + transitionProgress * 0.4;
  const opacity = 0.3 + transitionProgress * 0.7;

  const renderBowl = () => {
    switch (bowlIndex) {
      case 0: return <ClassicBowl {...config} />;
      case 1: return <GrapefruitBowl {...config} />;
      case 2: return <CactusBowl {...config} />;
      case 3: return <PineappleBowl {...config} />;
      case 4: return <OrangeBowl {...config} />;
      default: return <ClassicBowl {...config} />;
    }
  };

  return (
    <group position={[0, 0.3, 0]} scale={scale}>
      <group scale={opacity}>{renderBowl()}</group>
    </group>
  );
}

function SmokeParticles({ time }: { time: number }) {
  const count = 60;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particleData = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      offset: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.25,
      radius: 0.02 + Math.random() * 0.04,
      spread: 0.3 + Math.random() * 0.5,
      height: Math.random() * 1.5,
      driftX: (Math.random() - 0.5) * 0.3,
      driftZ: (Math.random() - 0.5) * 0.3,
    }));
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1, 6, 6);
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const t = time;
    particleData.forEach((p, i) => {
      const phase = t * p.speed + p.offset;
      const y = (Math.sin(phase * 0.5) * 0.5 + 0.5) * p.height + 0.3;
      const x = Math.sin(phase * 1.3) * p.spread + p.driftX * t;
      const z = Math.cos(phase * 1.7) * p.spread * 0.5 + p.driftZ * t;
      dummy.position.set(x, y, z);
      const s = p.radius * (0.5 + Math.sin(phase) * 0.3);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, null, count]} position={[0, 0.35, 0]}>
      <meshBasicMaterial color="#ffffff" transparent opacity={0.08} depthWrite={false} />
    </instancedMesh>
  );
}

function SceneInner({ bowlIndex, liquidIndex }: { bowlIndex: number; liquidIndex: number }) {
  const timeRef = useRef(0);
  const prevBowlRef = useRef(bowlIndex);
  const transitionRef = useRef(1);
  const visualBowlRef = useRef(bowlIndex);

  useFrame((_, delta) => {
    timeRef.current += delta * 0.6;
    if (prevBowlRef.current !== bowlIndex) {
      prevBowlRef.current = bowlIndex;
      transitionRef.current = 0;
    }
    if (transitionRef.current < 1) {
      transitionRef.current = Math.min(1, transitionRef.current + delta * 2);
      if (transitionRef.current >= 0.5) {
        visualBowlRef.current = bowlIndex;
      }
    }
  });

  const transitionProgress = transitionRef.current;
  const visualBowl = visualBowlRef.current;
  const time = timeRef.current;

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-3, 4, -3]} intensity={0.2} color="#B08D57" />
      <pointLight position={[0, 3, 2]} intensity={0.4} color="#B08D57" />
      <spotLight position={[0, 6, 0]} angle={0.5} penumbra={0.5} intensity={0.3} color="#FFBF00" />

      <group position={[0, -0.5, 0]}>
        <Base />
        <WaterChamber liquidIndex={liquidIndex} time={time} />
        <Bubbles liquidIndex={liquidIndex} time={time} />
        <Stem />
        <Tray />
        <Bowl bowlIndex={visualBowl} transitionProgress={transitionProgress} />
        <SmokeParticles time={time} />
      </group>

      <ContactShadows opacity={0.4} scale={3} blur={2} far={3} resolution={128} color="#000000" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.25, 0]} receiveShadow>
        <planeGeometry args={[4, 4]} />
        <shadowMaterial transparent opacity={0.3} />
      </mesh>
    </>
  );
}

export function HookahScene({ bowlIndex = 0, liquidIndex = 0 }: { bowlIndex?: number; liquidIndex?: number }) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0.5, 2.8], fov: 40 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        shadows
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
      >
        <AdaptiveDpr pixelated />
        <SceneInner bowlIndex={bowlIndex} liquidIndex={liquidIndex} />
      </Canvas>
    </div>
  );
}
