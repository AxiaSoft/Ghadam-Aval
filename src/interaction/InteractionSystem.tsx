import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { InteractionTarget } from '../types/game';
import { transientInput } from '../state/inputStore';
import { useGameStore } from '../state/gameStore';
import { audioManager } from '../audio/AudioManager';

export interface InteractionSystemProps {
  targets: InteractionTarget[];
  enabled?: boolean;
}

export const InteractionSystem: React.FC<InteractionSystemProps> = ({
  targets,
  enabled = true,
}) => {
  const setActiveInteraction = useGameStore((s) => s.setActiveInteraction);
  const activeInteraction = useGameStore((s) => s.activeInteraction);
  const lastIdRef = useRef<string | null>(null);
  const ringRefs = useRef<Record<string, THREE.Group | null>>({});

  useEffect(() => {
    if (!enabled) {
      lastIdRef.current = null;
      setActiveInteraction(null);
    }
    return () => {
      setActiveInteraction(null);
    };
  }, [enabled, setActiveInteraction]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Gentle floating beacon animation on markers
    targets.forEach((target, idx) => {
      const g = ringRefs.current[target.id];
      if (g) {
        const isActive = lastIdRef.current === target.id;
        const pulse = 1 + Math.sin(t * 3.2 + idx) * (isActive ? 0.12 : 0.05);
        g.scale.setScalar(pulse);
        g.rotation.y = t * 0.7;
      }
    });

    if (!enabled || targets.length === 0) {
      if (lastIdRef.current !== null) {
        lastIdRef.current = null;
        setActiveInteraction(null);
      }
      return;
    }

    const px = transientInput.playerPosition.x;
    const pz = transientInput.playerPosition.z;

    let closest: InteractionTarget | null = null;
    let closestDist = Infinity;

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const d = Math.hypot(px - target.position[0], pz - target.position[2]);
      if (d <= target.radius && d < closestDist) {
        closestDist = d;
        closest = target;
      }
    }

    const nextId = closest ? closest.id : null;
    if (nextId !== lastIdRef.current) {
      lastIdRef.current = nextId;
      setActiveInteraction(closest);
    }
  });

  if (!enabled) return null;

  return (
    <group>
      {targets.map((target) => {
        const isCurrent = activeInteraction?.id === target.id;
        const color = target.accentColor ?? '#f6c97a';
        return (
          <group
            key={target.id}
            ref={(el) => {
              ringRefs.current[target.id] = el;
            }}
            position={[target.position[0], target.position[1] + 0.03, target.position[2]]}
            onClick={(e) => {
              e.stopPropagation();
              if (isCurrent) {
                audioManager.playSfx('ui_tap');
                target.onInteract();
              }
            }}
          >
            {/* Subtle glowing ground ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.38, 0.46, 28]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={isCurrent ? 0.88 : 0.36}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
