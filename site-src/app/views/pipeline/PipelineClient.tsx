'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import { Suspense, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { Asset, Catalog, Domain } from '@/lib/types';
import { useT, pickField } from '@/lib/i18n';
import { PIPELINE_PHASES, PHASE_LABELS, inferPhase, type PipelinePhase } from '@/lib/phases';
import { PillLoader } from '@/components/PillLoader';
import { StatTile } from '@/components/StatTile';

type Bucket = {
  phase: PipelinePhase;
  index: number;
  x: number;
  assets: { asset: Asset; domain: Domain }[];
};

const PHASE_SPACING = 2.4;

function PhasePillar({
  bucket,
  highlighted,
}: {
  bucket: Bucket;
  highlighted: PipelinePhase | null;
}) {
  const meta = PHASE_LABELS[bucket.phase];
  const isActive = highlighted === bucket.phase;
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const target = isActive ? 1.05 : 1;
    ref.current.scale.lerp(new THREE.Vector3(target, target, target), 0.1);
    (ref.current.material as THREE.MeshPhysicalMaterial).emissiveIntensity =
      0.18 + Math.sin(t * 1.2 + bucket.index) * 0.05 + (isActive ? 0.4 : 0);
  });

  return (
    <group position={[bucket.x, 0, 0]}>
      <mesh ref={ref} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 4.6, 64, 1, true]} />
        <meshPhysicalMaterial
          color={meta.color}
          emissive={meta.color}
          emissiveIntensity={0.18}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, -2.32, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.04, 64]} />
        <meshStandardMaterial color={meta.color} emissive={meta.color} emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0, 2.32, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.04, 64]} />
        <meshStandardMaterial color={meta.color} emissive={meta.color} emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

function AssetOrbs({
  bucket,
  onHoverAsset,
  onSelectAsset,
}: {
  bucket: Bucket;
  onHoverAsset: (a: { asset: Asset; domain: Domain } | null) => void;
  onSelectAsset: (a: Asset) => void;
}) {
  return (
    <group position={[bucket.x, 0, 0]}>
      {bucket.assets.map((entry, i) => {
        const angle = (i / bucket.assets.length) * Math.PI * 2;
        const r = 0.45;
        const y = ((i % 7) - 3) * 0.55;
        const x = Math.cos(angle + i * 0.8) * r;
        const z = Math.sin(angle + i * 0.8) * r;
        return (
          <FloatingOrb
            key={entry.asset.id}
            position={[x, y, z]}
            color={entry.domain.color}
            seed={i}
            onPointerEnter={() => {
              onHoverAsset(entry);
              document.body.style.cursor = 'pointer';
            }}
            onPointerLeave={() => {
              onHoverAsset(null);
              document.body.style.cursor = 'default';
            }}
            onClick={() => onSelectAsset(entry.asset)}
          />
        );
      })}
    </group>
  );
}

function FloatingOrb({
  position,
  color,
  seed,
  onPointerEnter,
  onPointerLeave,
  onClick,
}: {
  position: [number, number, number];
  color: string;
  seed: number;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onClick: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + seed;
    ref.current.position.y = position[1] + Math.sin(t * 0.7) * 0.05;
    ref.current.rotation.y = t * 0.4;
  });
  return (
    <mesh
      ref={ref}
      position={position}
      onPointerEnter={(e) => {
        e.stopPropagation();
        onPointerEnter();
      }}
      onPointerLeave={onPointerLeave}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <icosahedronGeometry args={[0.085, 1]} />
      <meshPhysicalMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        metalness={0.2}
        roughness={0.3}
        clearcoat={0.6}
      />
    </mesh>
  );
}

function FlowParticles({ buckets }: { buckets: Bucket[] }) {
  const COUNT = 60;
  const ref = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(
    () => new Array(COUNT).fill(0).map(() => Math.random()),
    [],
  );
  useFrame((state) => {
    if (!ref.current || buckets.length < 2) return;
    const tmp = new THREE.Object3D();
    const totalLen = buckets[buckets.length - 1].x - buckets[0].x;
    const start = buckets[0].x;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      const phase = (t * 0.18 + seeds[i]) % 1;
      tmp.position.set(start + phase * totalLen, Math.sin(t + i) * 1.4, Math.cos(t * 0.5 + i) * 0.3);
      tmp.scale.setScalar(0.018 + Math.sin(t * 2 + i) * 0.01);
      tmp.updateMatrix();
      ref.current.setMatrixAt(i, tmp.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#5eead4" transparent opacity={0.55} />
    </instancedMesh>
  );
}

function PhaseLabels({ buckets }: { buckets: Bucket[] }) {
  const { lang } = useT();
  return (
    <>
      {buckets.map((b) => {
        const meta = PHASE_LABELS[b.phase];
        return (
          <Html
            key={b.phase}
            position={[b.x, 2.7, 0]}
            center
            distanceFactor={9}
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="px-2 py-1 rounded-md text-[11px] font-semibold tracking-tight whitespace-nowrap"
              style={{
                color: meta.color,
                background: 'rgba(2,6,23,0.85)',
                boxShadow: `0 0 14px ${meta.color}66`,
                border: `1px solid ${meta.color}55`,
              }}
            >
              {lang === 'ja' ? meta.ja : meta.en}{' '}
              <span className="text-ink-400 ml-1">({b.assets.length})</span>
            </div>
          </Html>
        );
      })}
    </>
  );
}

export function PipelineClient({ catalog }: { catalog: Catalog }) {
  const { t, lang } = useT();
  const [hovered, setHovered] = useState<{ asset: Asset; domain: Domain } | null>(null);

  const buckets = useMemo<Bucket[]>(() => {
    const map = new Map<PipelinePhase, { asset: Asset; domain: Domain }[]>();
    PIPELINE_PHASES.forEach((p) => map.set(p, []));
    for (const domain of catalog.domains) {
      for (const asset of domain.assets) {
        const phase = inferPhase(asset, domain);
        map.get(phase)!.push({ asset, domain });
      }
    }
    const offset = ((PIPELINE_PHASES.length - 1) * PHASE_SPACING) / 2;
    return PIPELINE_PHASES.map((p, i) => ({
      phase: p,
      index: i,
      x: i * PHASE_SPACING - offset,
      assets: map.get(p) ?? [],
    }));
  }, [catalog]);

  const totalAssets = buckets.reduce((sum, b) => sum + b.assets.length, 0);
  const busiestPhase = buckets.reduce((a, b) => (a.assets.length >= b.assets.length ? a : b));

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
        <h1 className="text-3xl font-semibold tracking-tight">{t.pipeline.title}</h1>
        <p className="text-ink-500 dark:text-ink-400 max-w-2xl text-sm leading-relaxed">
          {t.pipeline.desc}
        </p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label={t.home.stats.catalogued} value={totalAssets} />
        <StatTile
          label={lang === 'ja' ? '最も活発なフェーズ' : 'Busiest phase'}
          value={
            lang === 'ja'
              ? PHASE_LABELS[busiestPhase.phase].ja
              : PHASE_LABELS[busiestPhase.phase].en
          }
          hint={`${busiestPhase.assets.length} ${t.pipeline.assetsAtPhase}`}
        />
        <StatTile
          label={lang === 'ja' ? 'フェーズ数' : 'Phases tracked'}
          value={PIPELINE_PHASES.length}
        />
        <StatTile
          label={lang === 'ja' ? '治療領域' : 'Therapeutic areas'}
          value={catalog.domainCount}
        />
      </section>

      <section className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900/60 to-ink-950 ring-1 ring-mint-500/10">
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center">
              <PillLoader size={120} label={t.common.loading} />
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, 1.6, 11], fov: 38 }}
            dpr={[1, 2]}
            shadows
            gl={{ antialias: true, alpha: true }}
          >
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 6, 5]} intensity={1.0} />
            <pointLight position={[0, 0, 6]} intensity={0.5} color="#a5f3fc" />

            {buckets.map((b) => (
              <PhasePillar key={b.phase} bucket={b} highlighted={hovered ? null : null} />
            ))}
            {buckets.map((b) => (
              <AssetOrbs
                key={`orbs-${b.phase}`}
                bucket={b}
                onHoverAsset={setHovered}
                onSelectAsset={(a) => {
                  window.location.href = `/asset/${a.id}/`;
                }}
              />
            ))}

            <FlowParticles buckets={buckets} />
            <PhaseLabels buckets={buckets} />

            <ContactShadows
              position={[0, -2.4, 0]}
              opacity={0.4}
              scale={20}
              blur={2.4}
              far={4}
            />
            <Environment preset="night" />

            <OrbitControls
              enablePan={false}
              minDistance={6}
              maxDistance={18}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 1.6}
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
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: hovered.domain.color }}
                />
                <span className="font-semibold tracking-tight">
                  {pickField(hovered.asset as never, 'displayName', lang)}
                </span>
                <span className="text-ink-400 font-mono">{hovered.asset.name}</span>
              </div>
              <div className="text-ink-400 mt-1 leading-snug line-clamp-2">
                {pickField(hovered.asset as never, 'description', lang)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute top-3 right-3 text-[10px] uppercase tracking-[0.18em] text-ink-500/70">
          {t.pipeline.drag}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-2">
        {buckets.map((b) => {
          const meta = PHASE_LABELS[b.phase];
          return (
            <div
              key={b.phase}
              className="rounded-xl border border-ink-200 dark:border-ink-800 px-3 py-2.5"
              style={{ borderColor: `${meta.color}33` }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: meta.color }}
                />
                <div className="text-[11px] font-medium tracking-tight">
                  {lang === 'ja' ? meta.ja : meta.en}
                </div>
              </div>
              <div className="text-xl font-semibold tabular-nums">{b.assets.length}</div>
              <div className="text-[10px] text-ink-400 mt-0.5">
                {t.pipeline.assetsAtPhase}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
