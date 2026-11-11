import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StylizedCharacter, StylizedCharacterProps } from '../characters/StylizedCharacter';
import { useGameStore } from '../state/gameStore';
import { CHAIR_SLIDE, classroomExitRoute } from './classroomRoutes';

export const SlidingChair: React.FC<{ dismissed: boolean; children: React.ReactNode }> = ({ dismissed, children }) => {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!group.current || useGameStore.getState().isPaused) return;
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, 0.36 + (dismissed ? CHAIR_SLIDE : 0), 6, Math.min(delta, 0.05));
  });
  return <group ref={group} position={[0, 0, 0.36]}>{children}</group>;
};

type WalkerProps = Omit<StylizedCharacterProps, 'groupRef' | 'position'> & {
  row: number; col: number; exiting: boolean; delay: number; onExit: () => void;
};
export const ClassroomWalker: React.FC<WalkerProps> = ({ row, col, exiting, delay, onExit, pose, ...character }) => {
  const group = useRef<THREE.Group>(null);
  const route = useRef(classroomExitRoute(row, col));
  const state = useRef({ elapsed: 0, next: 1, finished: false });
  const [walking, setWalking] = useState(false);
  const [exited, setExited] = useState(false);
  useEffect(() => {
    if (!exiting) { state.current = { elapsed: 0, next: 1, finished: false }; setWalking(false); setExited(false); }
  }, [exiting]);
  useFrame((_, delta) => {
    if (!exiting || !group.current || state.current.finished || useGameStore.getState().isPaused) return;
    const dt = Math.min(delta, 0.05);
    state.current.elapsed += dt;
    if (state.current.elapsed < delay) return;
    const next = route.current[state.current.next];
    const dx = next.x - group.current.position.x, dz = next.z - group.current.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance > 0.01) {
      const target = Math.atan2(dx, dz);
      const diff = Math.atan2(Math.sin(target - group.current.rotation.y), Math.cos(target - group.current.rotation.y));
      group.current.rotation.y += diff * Math.min(1, dt * 8);
      if (Math.abs(diff) > 0.2) {
        if (walking) setWalking(false);
        return;
      }
    }
    if (!walking) setWalking(true);
    const step = 1.65 * dt;
    if (distance <= step) {
      group.current.position.set(next.x, 0, next.z);
      state.current.next++;
      if (state.current.next >= route.current.length) {
        state.current.finished = true; setWalking(false); setExited(true); onExit();
      }
    } else {
      group.current.position.x += dx / distance * step;
      group.current.position.z += dz / distance * step;
    }
  });
  const start = route.current[0];
  return <group visible={!exited}><StylizedCharacter {...character} seatHands="desk" groupRef={group} position={[start.x, 0, start.z]}
    pose={exiting ? (walking ? 'walk' : 'idle') : pose} walkSpeed={walking ? 0.8 : 0} /></group>;
};
