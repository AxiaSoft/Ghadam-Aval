import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../state/gameStore';

/**
 * یک لایه سبک روی همه صحنهها: گرد و غبار در نور، و ذرات گرم وقتی دنیا رنگ گرفته.
 * هیچ نور یا ماده سنگینی اضافه نمیکند تا روی موبایل هم روان بماند.
 */
export const AtmosphereField: React.FC = () => {
  const worldWarmth = useGameStore((s) => s.worldWarmth);
  const graphicsProfile = useGameStore((s) => s.graphicsProfile);

  const count =
    graphicsProfile === 'LOW' ? 70 : graphicsProfile === 'MEDIUM' ? 130 : 190;

  const dustRef = useRef<THREE.Points>(null);
  const petalRef = useRef<THREE.Points>(null);

  const coldColor = useMemo(() => new THREE.Color('#aebfd0'), []);
  const warmColor = useMemo(() => new THREE.Color('#f2c878'), []);

  const dustPositions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = 0.35 + Math.random() * 4.2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    return arr;
  }, [count]);

  const petalPositions = useMemo(() => {
    const arr = new Float32Array(Math.round(count * 0.35) * 3);
    for (let i = 0; i < Math.round(count * 0.35); i += 1) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 1] = 0.8 + Math.random() * 3.4;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (dustRef.current) {
      dustRef.current.rotation.y = t * 0.012;
      const material = dustRef.current.material as THREE.PointsMaterial;
      material.color.lerpColors(coldColor, warmColor, Math.min(1, worldWarmth * 0.7));
    }

    if (petalRef.current) {
      petalRef.current.rotation.y = -t * 0.018;
      petalRef.current.position.y = Math.sin(t * 0.25) * 0.12;
      const material = petalRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.07 + worldWarmth * 0.2;
    }
  });

  return (
    <group>
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#c2d0de"
          transparent
          opacity={0.34}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <points ref={petalRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[petalPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.075}
          color="#f3c878"
          transparent
          opacity={0.08}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
        <planeGeometry args={[28, 28]} />
        <meshBasicMaterial
          color="#fff3dc"
          transparent
          opacity={0.012 + worldWarmth * 0.018}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
