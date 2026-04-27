'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function Pill() {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 1.4;
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.2) * 0.18;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 1.6) * 0.08;
    }
  });

  return (
    <group ref={group} rotation={[Math.PI / 2.2, 0, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 1.1, 48]} />
        <meshPhysicalMaterial
          color="#2dd4bf"
          metalness={0.15}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.12}
        />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <sphereGeometry args={[0.55, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#2dd4bf"
          metalness={0.15}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.12}
        />
      </mesh>
      <mesh position={[0, -0.55, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 1.1, 48]} />
        <meshPhysicalMaterial
          color="#fb7185"
          metalness={0.18}
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.14}
        />
      </mesh>
      <mesh position={[0, -1.15, 0]} castShadow>
        <sphereGeometry args={[0.55, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#fb7185"
          metalness={0.18}
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.14}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.56, 0.03, 16, 64]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

type Props = {
  size?: number;
  label?: string;
};

export function PillLoader({ size = 96, label }: Props) {
  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div style={{ width: size, height: size }}>
        <Canvas
          camera={{ position: [3.4, 0.2, 3.4], fov: 38 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[2, 4, 2]} intensity={1.4} />
          <pointLight position={[-3, -1, -2]} intensity={0.8} color="#a5f3fc" />
          <Pill />
        </Canvas>
      </div>
      {label && (
        <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">{label}</div>
      )}
    </div>
  );
}
