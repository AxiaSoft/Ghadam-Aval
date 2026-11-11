import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../state/gameStore';
import { initialQualitySample, sampleQuality } from '../graphics/qualityMonitor';

/** Sustained low frame rate reduces quality; short dips never change settings. */
export function AdaptiveQuality() {
  const sample = useRef(initialQualitySample());
  useFrame((_, delta) => {
    const state = useGameStore.getState();
    const next = sampleQuality(sample.current, delta, document.hidden || state.isPaused, state.graphicsProfile);
    if (next) state.setGraphicsProfile(next);
  });
  return null;
}
