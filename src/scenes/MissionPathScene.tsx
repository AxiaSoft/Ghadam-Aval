import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PlayerController } from '../characters/PlayerController';
import { StylizedCharacter } from '../characters/StylizedCharacter';
import { CameraRig } from '../camera/CameraRig';
import { InteractionSystem } from '../interaction/InteractionSystem';
import { useGameStore } from '../state/gameStore';
import { resetPlayerTransform } from '../state/inputStore';
import { InteractionTarget, PathColorChoice } from '../types/game';
import { audioManager } from '../audio/AudioManager';
import {
  CUTSCENE_MIN_DURATION_MS,
  getPathChoiceMessage,
  PRECLASS_OPTIONS,
} from '../dialogue/dialogueData';
import { CorridorShell, PrinterCorner, WindowBench } from './UniversityProps';

export const MissionPathScene: React.FC = () => {
  const { scene } = useThree();
  const graphicsProfile = useGameStore((s) => s.graphicsProfile);
  const setObjectiveHint = useGameStore((s) => s.setObjectiveHint);
  const setNarrativeCaption = useGameStore((s) => s.setNarrativeCaption);
  const setCinematicShot = useGameStore((s) => s.setCinematicShot);
  const choosePath = useGameStore((s) => s.choosePath);
  const transitionTo = useGameStore((s) => s.transitionTo);

  const [chosen, setChosen] = useState(false);
  const chosenRef = useRef(false);

  useEffect(() => {
    resetPlayerTransform([0, 0, 3.0], Math.PI, 0, 0.24);
    setCinematicShot(null);
    setObjectiveHint('کنار پرینتر، برگهٔ آخر بیرون آمده. یکی از سه کار معمولیت را انتخاب کن.');

    scene.background = new THREE.Color('#e7eef3');
    scene.fog = new THREE.FogExp2('#eee7dc', 0.022);

    return () => {
      setObjectiveHint(null);
    };
  }, [scene, setCinematicShot, setObjectiveHint]);

  const handleSelect = useCallback(
    (id: PathColorChoice, pos: [number, number, number]) => {
      if (chosenRef.current) return;
      chosenRef.current = true;
      setChosen(true);

      audioManager.playSfx('object_interact');
      choosePath(id);
      setObjectiveHint(null);
      setNarrativeCaption(getPathChoiceMessage(id));

      setCinematicShot({
        position: [pos[0] * 0.5, 1.9, pos[2] + 3.2],
        lookAt: [pos[0], 1.1, pos[2] - 0.6],
        fov: 46,
        duration: 1.7,
      });

      window.setTimeout(() => {
        setNarrativeCaption(null);
        transitionTo('MISSION_2', { withFade: true });
      }, CUTSCENE_MIN_DURATION_MS);
    },
    [choosePath, setCinematicShot, setNarrativeCaption, setObjectiveHint, transitionTo]
  );

  const targets = useMemo<InteractionTarget[]>(
    () =>
      PRECLASS_OPTIONS.map((option) => ({
        id: `preclass_${option.id}`,
        label: option.label,
        sublabel: option.sublabel,
        position: option.pos,
        radius: 1.9,
        accentColor: option.accent,
        onInteract: () => handleSelect(option.id, option.pos),
      })),
    [handleSelect]
  );

  return (
    <group>
      <CameraRig followDistance={3.2} followHeight={1.45} />

      <hemisphereLight args={['#fff8ec', '#b4a18a', 1.05]} />
      <directionalLight
        position={[3, 7, 5]}
        intensity={1.7}
        color="#ffe2b4"
        castShadow={graphicsProfile !== 'LOW'}
        shadow-mapSize-width={graphicsProfile === 'HIGH' ? 2048 : 1024}
        shadow-mapSize-height={graphicsProfile === 'HIGH' ? 2048 : 1024}
      />
      <pointLight position={[0, 2.8, -2]} intensity={0.55} distance={8} color="#fff2d8" />

      <CorridorShell initialWarmth={1} />
      <PrinterCorner position={[-1.8, 0, -3.6]} initialWarmth={1} />
      <WindowBench position={[2.5, 0, 0.4]} rotationY={-Math.PI / 2} initialWarmth={1} />

      {/* پسر همان دانشکده، چند قدم آنطرفتر، سرش توی برگهٔ خودش است */}
      <StylizedCharacter
        kind="male"
        position={[2.35, 0.02, -4.2]}
        rotationY={-0.35}
        pose="idle"
        emotion="thoughtful"
        gazeBehavior="down_shy"
        showPen
      />

      <InteractionSystem targets={targets} enabled={!chosen} />

      <PlayerController
        bounds={{ minX: -2.9, maxX: 2.9, minZ: -5.4, maxZ: 4.2 }}
        controlEnabled={!chosen}
        overridePose={chosen ? 'interact' : undefined}
        emotion={chosen ? 'thoughtful' : 'neutral'}
      />
    </group>
  );
};
