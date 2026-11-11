import React, { Component, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from './state/gameStore';
import { assetManager } from './assets/AssetManager';
import { audioManager } from './audio/AudioManager';
import { SceneManager } from './scenes/SceneManager';
import { AdaptiveQuality } from './scenes/AdaptiveQuality';
import { LoadingScreen } from './ui/LoadingScreen';
import { HUDAndPauseMenu } from './ui/HUDAndPauseMenu';
import { IntroAndEndingScreens } from './ui/IntroAndEndingScreens';
import { QuestionnaireUI } from './ui/QuestionnaireUI';
import { MobileControls } from './ui/MobileControls';
import { FinalDecisionUI } from './ui/FinalDecisionUI';
import { DialogueOverlay } from './dialogue/DialogueOverlay';

class CanvasErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 40%, #2d3545, #141821)',
          }}
        />
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  const stage = useGameStore((s) => s.stage);
  const graphicsProfile = useGameStore((s) => s.graphicsProfile);
  const worldWarmth = useGameStore((s) => s.worldWarmth);
  const reducedMotion = useGameStore((s) => s.reducedMotion);
  const musicVolume = useGameStore((s) => s.musicVolume);
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const isMuted = useGameStore((s) => s.isMuted);
  const essentialAssetsLoaded = useGameStore((s) => s.essentialAssetsLoaded);
  const setLoadingState = useGameStore((s) => s.setLoadingState);
  const unlockAudio = useGameStore((s) => s.unlockAudio);

  useEffect(() => {
    const handleFirstGesture = () => {
      audioManager.unlock();
      unlockAudio();
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
    window.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [unlockAudio]);

  useEffect(() => {
    let mounted = true;
    assetManager
      .preloadEssentials((progress, label) => {
        if (mounted) setLoadingState(progress, label, false);
      })
      .then(() => {
        assetManager.preloadSecondaryAssets();
        if (mounted) setLoadingState(100, 'آماده شروع', true);
      })
      .catch(() => {
        assetManager.preloadSecondaryAssets();
        if (mounted) setLoadingState(100, 'آماده شروع', true);
      });
    return () => {
      mounted = false;
    };
  }, [setLoadingState]);

  useEffect(() => {
    audioManager.setVolumes(musicVolume, sfxVolume, isMuted);
  }, [musicVolume, sfxVolume, isMuted]);

  useEffect(() => {
    audioManager.syncStageMusic(stage);
  }, [stage]);

  const dprRange: [number, number] =
    graphicsProfile === 'LOW'
      ? [0.85, 1.0]
      : graphicsProfile === 'MEDIUM'
        ? [1.0, 1.5]
        : [1.25, 2.0];

  return (
    <main className="game-shell" data-reduced-motion={reducedMotion ? 'true' : 'false'}>
      <LoadingScreen />

      <div className="webgl-stage" data-stage={stage}>
        <CanvasErrorBoundary>
          {essentialAssetsLoaded && (
            <Canvas
              shadows={graphicsProfile !== 'LOW'}
              dpr={dprRange}
              camera={{ fov: 48, near: 0.1, far: 80, position: [1.35, 1.52, 3.15] }}
              gl={{
                antialias: graphicsProfile !== 'LOW',
                powerPreference: 'high-performance',
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.05,
              }}
            >
              <AdaptiveQuality />
              <SceneManager />
            </Canvas>
          )}
        </CanvasErrorBoundary>
      </div>

      <div
        className="world-grade world-grade-cold"
        aria-hidden="true"
        style={{ opacity: 0.5 - worldWarmth * 0.28 }}
      />
      <div
        className="world-grade world-grade-warm"
        aria-hidden="true"
        style={{ opacity: 0.1 + worldWarmth * 0.26 }}
      />
      <div className="film-grain" aria-hidden="true" />
      <div className="scene-vignette" aria-hidden="true" />

      <HUDAndPauseMenu />
      <IntroAndEndingScreens />
      <QuestionnaireUI />
      <MobileControls />
      <FinalDecisionUI />
      <DialogueOverlay />
    </main>
  );
};

export default App;
