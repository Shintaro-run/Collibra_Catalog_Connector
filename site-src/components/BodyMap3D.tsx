'use client';

import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import {
  Suspense,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as THREE from 'three';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { Domain, BodyRegion } from '@/lib/types';
import { useT, pickField } from '@/lib/i18n';
import { PillLoader } from './PillLoader';

type Props = { domains: Domain[] };

type AnchoredRegion = Exclude<BodyRegion, 'systemic'>;

const REGION_LABELS: Record<AnchoredRegion, { en: string; ja: string }> = {
  head: { en: 'Head', ja: '頭部' },
  'chest-left': { en: 'Chest (L)', ja: '左胸部' },
  'chest-right': { en: 'Chest (R)', ja: '右胸部' },
  'abdomen-upper': { en: 'Upper abdomen', ja: '上腹部' },
  'abdomen-lower': { en: 'Lower abdomen', ja: '下腹部' },
  pelvis: { en: 'Pelvis', ja: '骨盤' },
  arms: { en: 'Arms', ja: '腕' },
  legs: { en: 'Legs', ja: '脚' },
};

const REGION_ANCHORS: Record<AnchoredRegion, [number, number, number]> = {
  head: [0, 1.85, 0],
  'chest-left': [-0.22, 1.0, 0.06],
  'chest-right': [0.22, 1.0, 0.06],
  'abdomen-upper': [0, 0.33, 0],
  'abdomen-lower': [0, -0.05, 0],
  pelvis: [0, -0.45, 0],
  arms: [-0.5, 0.7, 0],
  legs: [-0.18, -1.45, 0],
};

type PartProps = {
  region: AnchoredRegion;
  isActive: boolean;
  isDimmed: boolean;
  setHovered: (r: AnchoredRegion | null) => void;
  onClick: (r: AnchoredRegion) => void;
  children: (matProps: {
    color: string;
    emissive: string;
    emissiveIntensity: number;
    opacity: number;
    transparent: boolean;
    roughness: number;
    metalness: number;
    clearcoat: number;
  }) => ReactNode;
};

function HoverGroup({
  region,
  isActive,
  isDimmed,
  setHovered,
  onClick,
  children,
}: PartProps) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const target = isActive ? 1.04 : 1.0;
    ref.current.scale.lerp(new THREE.Vector3(target, target, target), 0.18);
  });

  const matProps = {
    color: '#94a3b8',
    emissive: isActive ? '#14b8a6' : '#000000',
    emissiveIntensity: isActive ? 0.6 : 0,
    opacity: isDimmed ? 0.18 : 0.85,
    transparent: true,
    roughness: 0.42,
    metalness: 0.08,
    clearcoat: 0.35,
  };

  const handleEnter = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(region);
    document.body.style.cursor = 'pointer';
  };
  const handleLeave = () => {
    setHovered(null);
    document.body.style.cursor = 'default';
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick(region);
  };

  return (
    <group
      ref={ref}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      onClick={handleClick}
    >
      {children(matProps)}
    </group>
  );
}

function Humanoid({
  activeRegions,
  dimAll,
  hoveredDomain,
  setHovered,
  onClickRegion,
}: {
  activeRegions: Set<AnchoredRegion>;
  dimAll: boolean;
  hoveredDomain: Domain | null;
  setHovered: (r: AnchoredRegion | null) => void;
  onClickRegion: (r: AnchoredRegion) => void;
}) {
  const isActive = (r: AnchoredRegion) => activeRegions.has(r);
  const isDimmed = (r: AnchoredRegion) => dimAll && !activeRegions.has(r);

  return (
    <group position={[0, 0, 0]}>
      <HoverGroup
        region="head"
        isActive={isActive('head')}
        isDimmed={isDimmed('head')}
        setHovered={setHovered}
        onClick={onClickRegion}
      >
        {(m) => (
          <>
            <mesh position={[0, 1.85, 0]} castShadow>
              <sphereGeometry args={[0.32, 36, 28]} />
              <meshPhysicalMaterial {...m} />
            </mesh>
            <mesh position={[0, 1.45, 0]} castShadow>
              <capsuleGeometry args={[0.13, 0.16, 8, 16]} />
              <meshPhysicalMaterial {...m} />
            </mesh>
          </>
        )}
      </HoverGroup>

      <HoverGroup
        region="chest-left"
        isActive={isActive('chest-left')}
        isDimmed={isDimmed('chest-left')}
        setHovered={setHovered}
        onClick={onClickRegion}
      >
        {(m) => (
          <mesh position={[-0.22, 1.0, 0.05]} castShadow>
            <capsuleGeometry args={[0.22, 0.55, 8, 16]} />
            <meshPhysicalMaterial {...m} />
          </mesh>
        )}
      </HoverGroup>

      <HoverGroup
        region="chest-right"
        isActive={isActive('chest-right')}
        isDimmed={isDimmed('chest-right')}
        setHovered={setHovered}
        onClick={onClickRegion}
      >
        {(m) => (
          <mesh position={[0.22, 1.0, 0.05]} castShadow>
            <capsuleGeometry args={[0.22, 0.55, 8, 16]} />
            <meshPhysicalMaterial {...m} />
          </mesh>
        )}
      </HoverGroup>

      <HoverGroup
        region="abdomen-upper"
        isActive={isActive('abdomen-upper')}
        isDimmed={isDimmed('abdomen-upper')}
        setHovered={setHovered}
        onClick={onClickRegion}
      >
        {(m) => (
          <mesh position={[0, 0.33, 0]} castShadow>
            <capsuleGeometry args={[0.30, 0.32, 8, 16]} />
            <meshPhysicalMaterial {...m} />
          </mesh>
        )}
      </HoverGroup>

      <HoverGroup
        region="abdomen-lower"
        isActive={isActive('abdomen-lower')}
        isDimmed={isDimmed('abdomen-lower')}
        setHovered={setHovered}
        onClick={onClickRegion}
      >
        {(m) => (
          <mesh position={[0, -0.05, 0]} castShadow>
            <capsuleGeometry args={[0.28, 0.22, 8, 16]} />
            <meshPhysicalMaterial {...m} />
          </mesh>
        )}
      </HoverGroup>

      <HoverGroup
        region="pelvis"
        isActive={isActive('pelvis')}
        isDimmed={isDimmed('pelvis')}
        setHovered={setHovered}
        onClick={onClickRegion}
      >
        {(m) => (
          <mesh position={[0, -0.45, 0]} castShadow>
            <capsuleGeometry args={[0.30, 0.18, 8, 16]} />
            <meshPhysicalMaterial {...m} />
          </mesh>
        )}
      </HoverGroup>

      <HoverGroup
        region="arms"
        isActive={isActive('arms')}
        isDimmed={isDimmed('arms')}
        setHovered={setHovered}
        onClick={onClickRegion}
      >
        {(m) => (
          <>
            <mesh position={[-0.5, 0.7, 0]} rotation={[0, 0, 0.08]} castShadow>
              <capsuleGeometry args={[0.10, 1.05, 8, 16]} />
              <meshPhysicalMaterial {...m} />
            </mesh>
            <mesh position={[-0.55, -0.05, 0]} rotation={[0, 0, 0.06]} castShadow>
              <capsuleGeometry args={[0.085, 0.85, 8, 16]} />
              <meshPhysicalMaterial {...m} />
            </mesh>
            <mesh position={[0.5, 0.7, 0]} rotation={[0, 0, -0.08]} castShadow>
              <capsuleGeometry args={[0.10, 1.05, 8, 16]} />
              <meshPhysicalMaterial {...m} />
            </mesh>
            <mesh position={[0.55, -0.05, 0]} rotation={[0, 0, -0.06]} castShadow>
              <capsuleGeometry args={[0.085, 0.85, 8, 16]} />
              <meshPhysicalMaterial {...m} />
            </mesh>
          </>
        )}
      </HoverGroup>

      <HoverGroup
        region="legs"
        isActive={isActive('legs')}
        isDimmed={isDimmed('legs')}
        setHovered={setHovered}
        onClick={onClickRegion}
      >
        {(m) => (
          <>
            <mesh position={[-0.18, -1.20, 0]} castShadow>
              <capsuleGeometry args={[0.14, 0.95, 8, 16]} />
              <meshPhysicalMaterial {...m} />
            </mesh>
            <mesh position={[-0.18, -2.20, 0]} castShadow>
              <capsuleGeometry args={[0.115, 0.85, 8, 16]} />
              <meshPhysicalMaterial {...m} />
            </mesh>
            <mesh position={[0.18, -1.20, 0]} castShadow>
              <capsuleGeometry args={[0.14, 0.95, 8, 16]} />
              <meshPhysicalMaterial {...m} />
            </mesh>
            <mesh position={[0.18, -2.20, 0]} castShadow>
              <capsuleGeometry args={[0.115, 0.85, 8, 16]} />
              <meshPhysicalMaterial {...m} />
            </mesh>
          </>
        )}
      </HoverGroup>

      {hoveredDomain && hoveredDomain.bodyRegions.length > 1 && (
        <ConnectionLines regions={hoveredDomain.bodyRegions} color={hoveredDomain.color} />
      )}
    </group>
  );
}

function ConnectionLines({
  regions,
  color,
}: {
  regions: BodyRegion[];
  color: string;
}) {
  const ref = useRef<THREE.LineSegments>(null);
  useFrame((state) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.5 + 0.4 * Math.sin(state.clock.elapsedTime * 2.5);
    }
  });

  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const valid = regions
      .filter((r): r is AnchoredRegion => r !== 'systemic' && r in REGION_ANCHORS)
      .map((r) => REGION_ANCHORS[r]);
    for (let i = 0; i < valid.length - 1; i++) {
      pts.push(new THREE.Vector3(...valid[i]));
      pts.push(new THREE.Vector3(...valid[i + 1]));
    }
    return pts;
  }, [regions]);

  if (points.length < 2) return null;

  const geometry = useMemoLineGeometry(points);
  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.85} />
    </lineSegments>
  );
}

function useMemoLineGeometry(points: THREE.Vector3[]) {
  return useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points);
    return g;
  }, [points]);
}

function Scene({
  domains,
  hoveredDomain,
  setHovered,
  hoveredRegion,
  setHoveredRegion,
  onSelectRegion,
}: {
  domains: Domain[];
  hoveredDomain: Domain | null;
  setHovered: (d: Domain | null) => void;
  hoveredRegion: AnchoredRegion | null;
  setHoveredRegion: (r: AnchoredRegion | null) => void;
  onSelectRegion: (r: AnchoredRegion) => void;
}) {
  const activeRegions = useMemo(() => {
    if (hoveredDomain) {
      return new Set(
        hoveredDomain.bodyRegions.filter((r): r is AnchoredRegion => r !== 'systemic'),
      );
    }
    if (hoveredRegion) return new Set<AnchoredRegion>([hoveredRegion]);
    return new Set<AnchoredRegion>();
  }, [hoveredDomain, hoveredRegion]);

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} color="#a5f3fc" />
      <pointLight position={[0, -2, 4]} intensity={0.6} color="#fb7185" />

      <Humanoid
        activeRegions={activeRegions}
        dimAll={hoveredDomain !== null}
        hoveredDomain={hoveredDomain}
        setHovered={setHoveredRegion}
        onClickRegion={onSelectRegion}
      />

      <ContactShadows
        position={[0, -2.85, 0]}
        opacity={0.42}
        scale={6}
        blur={2.5}
        far={3}
      />
      <Environment preset="city" />
    </>
  );
}

export function BodyMap3D({ domains }: Props) {
  const { lang, t } = useT();
  const [hoveredDomain, setHoveredDomain] = useState<Domain | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<AnchoredRegion | null>(null);

  const regionToDomains = useMemo(() => {
    const map = new Map<AnchoredRegion, Domain[]>();
    for (const domain of domains) {
      for (const region of domain.bodyRegions) {
        if (region === 'systemic') continue;
        if (!map.has(region)) map.set(region, []);
        map.get(region)!.push(domain);
      }
    }
    return map;
  }, [domains]);

  const onSelectRegion = (region: AnchoredRegion) => {
    const list = regionToDomains.get(region) ?? [];
    if (list.length === 1) {
      window.location.href = `/domain/${list[0].slug}/`;
    }
  };

  const systemicOnlyDomains = domains.filter(
    (d) => d.bodyRegions.length === 1 && d.bodyRegions[0] === 'systemic',
  );
  const anatomicalDomains = domains.filter(
    (d) => !(d.bodyRegions.length === 1 && d.bodyRegions[0] === 'systemic'),
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
      <div className="relative aspect-[3/4] max-h-[680px] mx-auto w-full rounded-3xl overflow-hidden bg-gradient-to-br from-ink-900/60 via-ink-950 to-ink-900/40 ring-1 ring-mint-500/10">
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center">
              <PillLoader size={120} label={t.common.loading} />
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, 0.2, 5.4], fov: 38 }}
            dpr={[1, 2]}
            shadows
            gl={{ antialias: true, alpha: true }}
          >
            <Scene
              domains={domains}
              hoveredDomain={hoveredDomain}
              setHovered={setHoveredDomain}
              hoveredRegion={hoveredRegion}
              setHoveredRegion={setHoveredRegion}
              onSelectRegion={onSelectRegion}
            />
            <OrbitControls
              enablePan={false}
              minDistance={3.6}
              maxDistance={8}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 1.7}
              autoRotate={!hoveredDomain && !hoveredRegion}
              autoRotateSpeed={0.4}
              enableDamping
              dampingFactor={0.08}
            />
          </Canvas>
        </Suspense>

        <AnimatePresence>
          {(hoveredRegion || hoveredDomain) && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
              className="absolute top-3 left-3 glass rounded-xl px-3 py-2 text-xs max-w-[260px]"
            >
              <div className="font-semibold tracking-tight">
                {hoveredDomain
                  ? pickField(hoveredDomain as never, 'name', lang)
                  : REGION_LABELS[hoveredRegion!][lang]}
              </div>
              {hoveredRegion && !hoveredDomain && (
                <div className="text-ink-400 mt-1 leading-snug">
                  {(regionToDomains.get(hoveredRegion) ?? [])
                    .map((d) => pickField(d as never, 'name', lang))
                    .join(' · ') || '—'}
                </div>
              )}
              {hoveredDomain && (
                <div className="text-ink-400 mt-1 leading-snug">
                  {hoveredDomain.bodyRegions
                    .filter((r): r is AnchoredRegion => r !== 'systemic')
                    .map((r) => REGION_LABELS[r][lang])
                    .join(' · ')}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-3 right-3 text-[10px] uppercase tracking-[0.18em] text-ink-500/70">
          {lang === 'ja' ? 'ドラッグで回転' : 'Drag to rotate'}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">
          {t.home.panels.therapeuticAreas}
        </div>
        <ul className="space-y-2">
          {anatomicalDomains.map((domain) => (
            <DomainRow
              key={domain.id}
              domain={domain}
              onHover={setHoveredDomain}
            />
          ))}
        </ul>

        {systemicOnlyDomains.length > 0 && (
          <>
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400 pt-3">
              {t.home.panels.crossSystem}
            </div>
            <ul className="space-y-2">
              {systemicOnlyDomains.map((domain) => (
                <DomainRow
                  key={domain.id}
                  domain={domain}
                  onHover={setHoveredDomain}
                  crossSystem
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function DomainRow({
  domain,
  onHover,
  crossSystem,
}: {
  domain: Domain;
  onHover: (d: Domain | null) => void;
  crossSystem?: boolean;
}) {
  const { lang } = useT();
  const name = pickField(domain as never, 'name', lang);
  return (
    <li>
      <Link
        href={`/domain/${domain.slug}/`}
        onMouseEnter={() => onHover(domain)}
        onMouseLeave={() => onHover(null)}
        className="group flex items-center justify-between rounded-xl border border-ink-200 dark:border-ink-800 px-3 py-2.5 hover:border-mint-400 hover:bg-mint-50/50 dark:hover:bg-mint-900/10 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ background: domain.color }}
          />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{name}</div>
            <div className="text-[11px] text-ink-400 truncate">
              {crossSystem
                ? lang === 'ja'
                  ? '全身横断 · '
                  : 'Spans multiple regions · '
                : ''}
              {domain.steward}
            </div>
          </div>
        </div>
        <span className="text-xs tabular-nums text-ink-500 dark:text-ink-400 group-hover:text-mint-500">
          {domain.assetCount}
        </span>
      </Link>
    </li>
  );
}
