import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../state/gameStore';

/**
 * لایهٔ سبک اتمسفر: گرد ریز توی نور مهتابی
 * و یک پرتو کمجان پروژکتور توی کلاس. هیچ گلبرگ شناور یا باغ خیالی اضافه نمیکند.
 */
export const AtmosphereField: React.FC = () => {
  const worldWarmth = useGameStore((s) => s.worldWarmth);
  const graphicsProfile = useGameStore((s) => s.graphicsProfile);
  const stage = useGameStore((s) => s.stage);

  const count =
    graphicsProfile === 'LOW' ? 70 : graphicsProfile === 'MEDIUM' ? 130 : 190;
  const inClassroom = stage.startsWith('CLASSROOM');
  const outdoors = stage.startsWith('MISSION');

  const dustRef = useRef<THREE.Points>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  const coldColor = useMemo(() => new THREE.Color('#aebfd0'), []);
  const warmColor = useMemo(() => new THREE.Color('#f2d49a'), []);

  const dustPositions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = 0.35 + Math.random() * 3.2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (dustRef.current) {
      dustRef.current.rotation.y = t * 0.008;
      dustRef.current.position.y = Math.sin(t * 0.22) * 0.04;
      const material = dustRef.current.material as THREE.PointsMaterial;
      material.color.lerpColors(coldColor, warmColor, Math.min(1, worldWarmth * 0.75));
      material.opacity = 0.12 + worldWarmth * 0.16;
    }

    if (beamRef.current) {
      const material = beamRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = inClassroom ? 0.055 + worldWarmth * 0.025 : 0;
    }
  });

  return (
    <group>
      <points ref={dustRef} visible={!outdoors}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.028}
          color="#c2d0de"
          transparent
          opacity={0.2}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <mesh ref={beamRef} position={[0, 1.9, -3.4]} rotation={[0.12, 0, 0]}>
        <planeGeometry args={[2.6, 2.2]} />
        <meshBasicMaterial
          color="#fff0cf"
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <planeGeometry args={[24, 24]} />
        <meshBasicMaterial
          color="#fff3dc"
          transparent
          opacity={0.008 + worldWarmth * 0.014}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
