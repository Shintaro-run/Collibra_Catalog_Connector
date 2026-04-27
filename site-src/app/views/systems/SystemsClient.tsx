'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Stars, Html } from '@react-three/drei';
import { Suspense, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { Asset, Catalog, Domain } from '@/lib/types';
import { useT, pickField } from '@/lib/i18n';
import { PillLoader } from '@/components/PillLoader';
import { StatTile } from '@/components/StatTile';

type SystemBucket = {
  name: string;
  assets: { asset: Asset; domain: Domain }[];
  position: [number, number, number];
  index: number;
  color: string;
};

const PALETTE = [
  '#fbbf24',
  '#22d3ee',
  '#fb7185',
  '#a855f7',
  '#84cc16',
  '#f97316',
  '#ec4899',
  '#14b8a6',
  '#60a5fa',
  '#facc15',
];

function Sun({
  bucket,
  onHover,
  onClick,
}: {
  bucket: SystemBucket;
  onHover: (b: SystemBucket | null) => void;
  onClick: (b: SystemBucket) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const radius = 0.3 + Math.min(0.65, bucket.assets.length * 0.05);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
      0.7 + Math.sin(t * 1.5 + bucket.index) * 0.12;
    ref.current.rotation.y = t * 0.25;
  });
  return (
    <group position={bucket.position}>
      <mesh
        ref={ref}
        onPointerEnter={(e) => {
          e.stopPropagation();
          onHover(bucket);
          document.body.style.cursor = 'pointer';
        }}
        onPointerLeave={() => {
          onHover(null);
          document.body.style.cursor = 'default';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(bucket);
        }}
      >
        <sphereGeometry args={[radius, 48, 32]} />
        <meshStandardMaterial
          color={bucket.color}
          emissive={bucket.color}
          emissiveIntensity={0.85}
          toneMapped={false}
        />
      </mesh>
      <pointLight color={bucket.color} intensity={0.9} distance={6} />
      <Html position={[0, radius + 0.35, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div
          className="px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap"
          style={{
            color: bucket.color,
            background: 'rgba(2,6,23,0.85)',
            boxShadow: `0 0 14px ${bucket.color}66`,
            border: `1px solid ${bucket.color}55`,
          }}
        >
          {bucket.name} <span className="text-ink-400 ml-1">({bucket.assets.length})</span>
        </div>
      </Html>
    </group>
  );
}

function Planets({
  bucket,
  onSelectAsset,
}: {
  bucket: SystemBucket;
  onSelectAsset: (a: Asset) => void;
}) {
  return (
    <group position={bucket.position}>
      {bucket.assets.map((entry, i) => (
        <Planet
          key={entry.asset.id}
          color={entry.domain.color}
          assetIndex={i}
          systemSeed={bucket.index}
          totalInSystem={bucket.assets.length}
          onClick={() => onSelectAsset(entry.asset)}
        />
      ))}
    </group>
  );
}

function Planet({
  color,
  assetIndex,
  systemSeed,
  totalInSystem,
  onClick,
}: {
  color: string;
  assetIndex: number;
  systemSeed: number;
  totalInSystem: number;
  onClick: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const radius = 0.55 + (assetIndex % 3) * 0.18 + (totalInSystem > 5 ? 0.15 : 0);
  const speed = 0.5 + ((assetIndex * 7) % 5) * 0.12;
  const offset = (assetIndex / totalInSystem) * Math.PI * 2 + systemSeed;
  const tilt = (assetIndex % 4) * 0.15;
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + offset;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.z = Math.sin(t) * radius;
    ref.current.position.y = Math.sin(t * 0.8) * tilt;
  });
  return (
    <mesh
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerEnter={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerLeave={() => {
        document.body.style.cursor = 'default';
      }}
    >
      <sphereGeometry args={[0.045, 16, 12]} />
      <meshPhysicalMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        metalness={0.2}
        roughness={0.4}
      />
    </mesh>
  );
}

function OrbitRing({
  position,
  radius,
  color,
}: {
  position: [number, number, number];
  radius: number;
  color: string;
}) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.005, radius + 0.005, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.18} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function SystemsClient({ catalog }: { catalog: Catalog }) {
  const { t, lang } = useT();
  const [hovered, setHovered] = useState<SystemBucket | null>(null);

  const buckets = useMemo<SystemBucket[]>(() => {
    const map = new Map<string, { asset: Asset; domain: Domain }[]>();
    for (const domain of catalog.domains) {
      for (const asset of domain.assets) {
        const sys = asset.sourceSystem ?? (lang === 'ja' ? '不明 / 用語集' : 'Unspecified / Glossary');
        if (!map.has(sys)) map.set(sys, []);
        map.get(sys)!.push({ asset, domain });
      }
    }
    const arr = [...map.entries()].sort((a, b) => b[1].length - a[1].length);
    const cols = Math.ceil(Math.sqrt(arr.length));
    return arr.map(([name, assets], i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const xSpread = 3.8;
      const zSpread = 3.8;
      return {
        name,
        assets,
        index: i,
        color: PALETTE[i % PALETTE.length],
        position: [
          (col - (cols - 1) / 2) * xSpread + (row % 2) * 1.5,
          (row % 2) * 0.6 - 0.4,
          (row - (Math.ceil(arr.length / cols) - 1) / 2) * zSpread,
        ] as [number, number, number],
      };
    });
  }, [catalog, lang]);

  const totalSystems = buckets.length;
  const totalAssets = buckets.reduce((s, b) => s + b.assets.length, 0);
  const biggest = buckets[0];

  return (
    <div className="space-y-8">
      <Link
        href="/views/"
        className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-mint-500 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        {t.views.title}
      </Link>

      <header className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-mint-500">
          {t.views.kicker}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{t.systems.title}</h1>
        <p className="text-ink-500 dark:text-ink-400 max-w-2xl text-sm leading-relaxed">
          {t.systems.desc}
        </p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          label={lang === 'ja' ? 'ソースシステム数' : 'Source systems'}
          value={totalSystems}
        />
        <StatTile
          label={lang === 'ja' ? '総アセット' : 'Total assets'}
          value={totalAssets}
        />
        <StatTile
          label={lang === 'ja' ? '最大保有システム' : 'Largest system'}
          value={biggest?.name ?? '—'}
          hint={biggest ? `${biggest.assets.length} assets` : undefined}
        />
        <StatTile
          label={lang === 'ja' ? '平均/システム' : 'Avg per system'}
          value={Math.round(totalAssets / Math.max(1, totalSystems))}
        />
      </section>

      <section className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden bg-gradient-to-br from-ink-950 via-[#0a0f1c] to-ink-950 ring-1 ring-mint-500/10">
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center">
              <PillLoader size={120} label={t.common.loading} />
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, 5, 11], fov: 38 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
          >
            <ambientLight intensity={0.2} />
            <Stars radius={50} depth={30} count={2200} factor={3} fade speed={0.5} />
            {buckets.map((b) => (
              <group key={b.name}>
                <Sun
                  bucket={b}
                  onHover={setHovered}
                  onClick={() => {
                    /* future: filter view */
                  }}
                />
                {[0.55, 0.73, 0.91].map((r) => (
                  <OrbitRing
                    key={r}
                    position={b.position}
                    radius={r}
                    color={b.color}
                  />
                ))}
                <Planets
                  bucket={b}
                  onSelectAsset={(a) => {
                    window.location.href = `/asset/${a.id}/`;
                  }}
                />
              </group>
            ))}
            <Environment preset="night" />
            <OrbitControls
              enablePan
              minDistance={4}
              maxDistance={22}
              minPolarAngle={Math.PI / 8}
              maxPolarAngle={Math.PI / 1.4}
              autoRotate={!hovered}
              autoRotateSpeed={0.18}
              enableDamping
              dampingFactor={0.08}
            />
          </Canvas>
        </Suspense>

        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute bottom-3 left-3 right-3 sm:right-auto glass rounded-xl px-3 py-2 text-xs max-w-md"
            >
              <div className="font-semibold tracking-tight">{hovered.name}</div>
              <div className="text-ink-400 mt-1">
                {hovered.assets.length}{' '}
                {lang === 'ja' ? 'アセット保有' : 'asset(s) hosted'}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {[...new Set(hovered.assets.map((a) => a.domain.name))]
                  .slice(0, 6)
                  .map((d) => (
                    <span
                      key={d}
                      className="text-[10px] rounded bg-ink-800/60 px-1.5 py-0.5"
                    >
                      {d}
                    </span>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute top-3 right-3 text-[10px] uppercase tracking-[0.18em] text-ink-500/70">
          {t.systems.drag}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {buckets.map((b) => (
          <div
            key={b.name}
            className="rounded-xl border border-ink-200 dark:border-ink-800 px-3 py-2.5"
            style={{ borderColor: `${b.color}33` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: b.color, boxShadow: `0 0 8px ${b.color}` }}
              />
              <div className="text-[12px] font-medium truncate">{b.name}</div>
              <span className="ml-auto text-[11px] tabular-nums text-ink-400">
                {b.assets.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {[...new Set(b.assets.map((a) => a.domain.name))]
                .slice(0, 4)
                .map((d) => (
                  <span
                    key={d}
                    className="text-[10px] rounded bg-ink-100/80 dark:bg-ink-800/60 px-1.5 py-0.5"
                  >
                    {d}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
