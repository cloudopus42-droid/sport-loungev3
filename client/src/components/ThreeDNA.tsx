import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { WebGLSafeBoundary } from './WebGLSafeBoundary';
import { HOOKAH_FLAVORS } from '@/config/seats';

interface SingleHelixProps {
  categoryName: string;
  share: number;
  color: string;
  emoji: string;
  xPosition: number;
  isSelected: boolean;
  onSelect: () => void;
}

function SingleHelix({ categoryName, share, color, emoji, xPosition, isSelected, onSelect }: SingleHelixProps) {
  const groupRef = useRef<THREE.Group | null>(null);
  const [hovered, setHovered] = useState(false);

  const count = 18;
  const radius = 0.55;
  const height = 2.2;

  const helixNodes = useMemo(() => {
    const strand1 = [];
    const strand2 = [];
    const links = [];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 3.5;
      const y = (i / count) * height - height / 2;
      const x1 = Math.sin(angle) * radius;
      const z1 = Math.cos(angle) * radius;
      const x2 = Math.sin(angle + Math.PI) * radius;
      const z2 = Math.cos(angle + Math.PI) * radius;

      strand1.push(new THREE.Vector3(x1, y, z1));
      strand2.push(new THREE.Vector3(x2, y, z2));
      links.push({ from: new THREE.Vector3(x1, y, z1), to: new THREE.Vector3(x2, y, z2) });
    }

    return { strand1, strand2, links };
  }, [count, radius, height]);

  // Adjust spin speed based on intensity (share)
  useFrame((_, delta) => {
    if (groupRef.current) {
      const spinSpeed = 0.4 + (share / 100) * 1.2;
      groupRef.current.rotation.y += spinSpeed * delta;
    }
  });

  const baseSize = 0.045;
  const size = baseSize + (share / 100) * 0.06;
  const emissiveIntensity = share > 0 ? 0.3 + (share / 100) * 1.5 : 0.05;

  return (
    <group 
      ref={groupRef} 
      position={[xPosition, 0.15, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Selection Glow Cylinder */}
      {(isSelected || hovered) && (
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[radius * 1.2, radius * 1.2, height * 1.1, 16, 1, true]} />
          <meshBasicMaterial 
            color={isSelected ? '#EAB308' : color} 
            transparent 
            opacity={isSelected ? 0.15 : 0.06} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      )}

      {/* Strand 1 */}
      {helixNodes.strand1.map((pos, idx) => (
        <mesh key={`s1-${idx}`} position={pos}>
          <sphereGeometry args={[size, 8, 8]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={emissiveIntensity} 
            roughness={0.1}
          />
        </mesh>
      ))}

      {/* Strand 2 */}
      {helixNodes.strand2.map((pos, idx) => (
        <mesh key={`s2-${idx}`} position={pos}>
          <sphereGeometry args={[size, 8, 8]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={emissiveIntensity} 
            roughness={0.1}
          />
        </mesh>
      ))}

      {/* Links */}
      {helixNodes.links.map((link, idx) => {
        const midPoint = new THREE.Vector3().addVectors(link.from, link.to).multiplyScalar(0.5);
        const dist = link.from.distanceTo(link.to);
        const dir = new THREE.Vector3().subVectors(link.to, link.from).normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

        return (
          <mesh key={`link-${idx}`} position={midPoint} quaternion={quaternion}>
            <cylinderGeometry args={[0.009, 0.009, dist, 6]} />
            <meshStandardMaterial 
              color={color} 
              transparent 
              opacity={share > 0 ? 0.15 + (share / 100) * 0.45 : 0.06} 
              emissive={color}
              emissiveIntensity={share > 0 ? (share / 100) * 0.5 : 0.02}
            />
          </mesh>
        );
      })}

      {/* HTML Tag underneath */}
      <Html position={[0, -1.4, 0]} center>
        <div 
          onClick={onSelect}
          className={`flex flex-col items-center gap-0.5 select-none pointer-events-auto cursor-pointer transition-all duration-300 ${
            isSelected 
              ? 'scale-110 text-accent-gold font-bold' 
              : hovered 
              ? 'text-white scale-105' 
              : 'text-white/40'
          }`}
          style={{ width: '70px' }}
        >
          <span className="text-xs flex items-center gap-0.5">
            <span>{emoji}</span>
            <span className="text-[10px] tracking-wide truncate max-w-[50px]">{categoryName}</span>
          </span>
          <span className={`text-[8px] font-mono ${share > 0 ? 'text-accent-gold font-bold' : 'text-white/20'}`}>
            {share}%
          </span>
        </div>
      </Html>
    </group>
  );
}

const CATEGORY_ITEMS = [
  { name: 'Фрукты', emoji: '🍊', color: '#f97316' },
  { name: 'Ягоды', emoji: '🫐', color: '#a855f7' },
  { name: 'Десерт', emoji: '🧁', color: '#f472b6' },
  { name: 'Свежие', emoji: '❄️', color: '#38bdf8' },
  { name: 'Пряные', emoji: '🌶️', color: '#ca8a04' },
  { name: 'Авторские', emoji: '👑', color: '#eab308' }
];

interface ThreeDNAProps {
  mix: string[];
  mixPercentages: Record<string, number>;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

interface DNASliderInnerProps {
  duplicatedItems: any[];
  scrollOffset: number;
  setScrollOffset: React.Dispatch<React.SetStateAction<number>>;
  isHoveredRef: React.RefObject<boolean>;
  loopWidth: number;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

function DNASliderInner({
  duplicatedItems,
  scrollOffset,
  setScrollOffset,
  isHoveredRef,
  loopWidth,
  activeCategory,
  onSelectCategory
}: DNASliderInnerProps) {
  const sliderGroupRef = useRef<THREE.Group | null>(null);

  useFrame((_, delta) => {
    if (!isHoveredRef.current) {
      // Automatic cyclical scroll: ~0.55 units per second
      setScrollOffset(prev => prev + 0.55 * delta);
    }

    if (sliderGroupRef.current) {
      const wrappedX = ((scrollOffset % loopWidth) + loopWidth) % loopWidth;
      sliderGroupRef.current.position.x = -wrappedX;
    }
  });

  return (
    <group ref={sliderGroupRef}>
      {duplicatedItems.map((item) => (
        <SingleHelix
          key={item.uniqueKey}
          categoryName={item.name}
          share={item.share}
          color={item.color}
          emoji={item.emoji}
          xPosition={item.xPosition - 2.5} // Align center
          isSelected={activeCategory === item.name}
          onSelect={() => onSelectCategory(activeCategory === item.name ? 'Все' : item.name)}
        />
      ))}
    </group>
  );
}

export function ThreeDNA({ mix, mixPercentages, activeCategory, onSelectCategory }: ThreeDNAProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isHoveredRef = useRef(false);
  const [scrollOffset, setScrollOffset] = useState(0);

  const xSpacing = 2.0; // Spacing between strands in 3D units
  const totalStrands = CATEGORY_ITEMS.length;
  const loopWidth = totalStrands * xSpacing; // Width of one cycle

  // Calculate shares for each category
  const categoryShares = useMemo(() => {
    const shares: Record<string, number> = {};
    CATEGORY_ITEMS.forEach(c => { shares[c.name] = 0; });

    mix.forEach(name => {
      const fl = HOOKAH_FLAVORS.find(f => f.name === name);
      if (fl && fl.category in shares) {
        shares[fl.category] += mixPercentages[name] || 0;
      }
    });

    return shares;
  }, [mix, mixPercentages]);

  // Direct wheel listener to prevent default page scrolling while hovering the slider
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Scroll speed modifier
      setScrollOffset(prev => prev + e.deltaY * 0.006);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Double array mapping for infinite loop visual duplication
  const duplicatedItems = useMemo(() => {
    const items = [];
    // We render 3 full cycles to ensure seamless visual loop from any screen size
    for (let cycle = 0; cycle < 3; cycle++) {
      for (let i = 0; i < totalStrands; i++) {
        const item = CATEGORY_ITEMS[i];
        items.push({
          ...item,
          uniqueKey: `cycle-${cycle}-${item.name}-${i}`,
          xPosition: (cycle * totalStrands + i) * xSpacing,
          share: categoryShares[item.name] || 0
        });
      }
    }
    return items;
  }, [categoryShares, xSpacing, totalStrands]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[155px] bg-black/60 border border-glass-border/30 rounded-2xl shadow-[inset_0_4px_24px_rgba(0,0,0,0.9)] overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onMouseEnter={() => {
        isHoveredRef.current = true;
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
        setIsHovered(false);
      }}
    >
      <WebGLSafeBoundary fallback={
        <div className="absolute inset-0 p-3 flex items-center justify-around bg-black/80">
          {CATEGORY_ITEMS.map(item => {
            const share = categoryShares[item.name] || 0;
            const isSelected = activeCategory === item.name;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => onSelectCategory(item.name)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border ${
                  isSelected 
                    ? 'bg-accent-gold/15 border-accent-gold text-accent-gold' 
                    : 'bg-white/5 border-transparent text-white/50 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.emoji}</span>
                <span className="text-[9px] font-bold">{item.name} ({share}%)</span>
              </button>
            );
          })}
        </div>
      }>
        <Canvas
          camera={{ position: [0, 0, 3.2], fov: 45 }}
          style={{ width: '100%', height: '100%', background: 'transparent' }}
        >
          <ambientLight intensity={0.7} />
          <pointLight position={[0, 4, 3]} intensity={2.5} color="#EAB308" />

          {/* Slider Inner Component (renders inside Canvas context to allow R3F useFrame) */}
          <DNASliderInner
            duplicatedItems={duplicatedItems}
            scrollOffset={scrollOffset}
            setScrollOffset={setScrollOffset}
            isHoveredRef={isHoveredRef}
            loopWidth={loopWidth}
            activeCategory={activeCategory}
            onSelectCategory={onSelectCategory}
          />
        </Canvas>
      </WebGLSafeBoundary>

      {/* Interface Instruction Overlay */}
      <div className="absolute top-2 left-3 pointer-events-none text-[8px] uppercase tracking-wider text-white/25">
        ДНК категорий вкусов {isHovered ? '• Крутите колесико для прокрутки' : '• Наведите для управления'}
      </div>
    </div>
  );
}
export default ThreeDNA;
