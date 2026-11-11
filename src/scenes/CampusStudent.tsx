import React, { useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { StylizedCharacter } from '../characters/StylizedCharacter';
import { transientInput } from '../state/inputStore';
import { useGameStore } from '../state/gameStore';
import { CAMPUS_CHATTER, initialChatterState, updateChatter } from './campusChatter';

export const CampusStudent: React.FC<{
  variant: 'seated' | 'standing';
  position: [number, number, number];
  rotationY: number;
  enabled: boolean;
}> = ({ variant, position, rotationY, enabled }) => {
  const state = useRef(initialChatterState());
  const [line, setLine] = useState<string | null>(null);
  useFrame((_, delta) => {
    const player = transientInput.playerPosition;
    const distance = Math.hypot(player.x - position[0], player.z - position[2]);
    const next = updateChatter(state.current, distance, Math.min(delta, .05), enabled, useGameStore.getState().isPaused, CAMPUS_CHATTER[variant]);
    if (next.line !== state.current.line) setLine(next.line);
    state.current = next;
  });
  const visibleLine = enabled ? line : null;
  return <group position={position}>
    <StylizedCharacter kind={variant === 'seated' ? 'student' : 'student_female'}
      rotationY={rotationY} seated={variant === 'seated'}
      pose={visibleLine ? 'talk' : variant === 'seated' ? 'sit' : 'idle'}
      isSpeaking={Boolean(visibleLine)} phaseOffset={variant === 'seated' ? .3 : .7} />
    {visibleLine && <Html position={[0, variant === 'seated' ? 1.7 : 2.1, 0]} center zIndexRange={[34, 34]} style={{ pointerEvents: 'none' }}>
      <div className="campus-chatter" dir="rtl" role="status">{visibleLine}</div>
    </Html>}
  </group>;
};
