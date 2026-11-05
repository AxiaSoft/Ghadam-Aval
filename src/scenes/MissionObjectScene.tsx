import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PlayerController, ObstacleCircle } from '../characters/PlayerController';
import { StylizedCharacter } from '../characters/StylizedCharacter';
import { CameraRig } from '../camera/CameraRig';
import { InteractionSystem } from '../interaction/InteractionSystem';
import { useGameStore } from '../state/gameStore';
import { resetPlayerTransform } from '../state/inputStore';
import { InteractionTarget, MissionObjectChoice } from '../types/game';
import { audioManager } from '../audio/AudioManager';
import {
  CUTSCENE_MIN_DURATION_MS,
  getPersonalizedObjectMessage,
  REHEARSAL_OPTIONS,
} from '../dialogue/dialogueData';
import { CorridorShell, PrinterCorner, WindowBench } from './UniversityProps';

export const MissionObjectScene: React.FC = () => {
  const { scene } = useThree();
  const graphicsProfile = useGameStore((s) => s.graphicsProfile);
  const answers = useGameStore((s) => s.answers);
  const chooseObject = useGameStore((s) => s.chooseObject);
  const setObjectiveHint = useGameStore((s) => s.setObjectiveHint);
  const setNarrativeCaption = useGameStore((s) => s.setNarrativeCaption);
  const setCinematicShot = useGameStore((s) => s.setCinematicShot);
  const transitionTo = useGameStore((s) => s.transitionTo);

  const [interacting, setInteracting] = useState(false);
  const interactingRef = useRef(false);

  useEffect(() => {
    resetPlayerTransform([0, 0, 3.0], Math.PI, 0, 0.24);
    setCinematicShot(null);
    setObjectiveHint('روی نیمکت، دو دقیقه فرصت داری. یکی از سه کار معمولیت را انتخاب کن.');

    scene.background = new THREE.Color('#e9f0f4');
    scene.fog = new THREE.FogExp2('#f0e9dd', 0.022);

    return () => {
      setObjectiveHint(null);
    };
  }, [scene, setCinematicShot, setObjectiveHint]);

  const handleSelect = useCallback(
    (id: MissionObjectChoice, pos: [number, number, number]) => {
      if (interactingRef.current) return;
      interactingRef.current = true;
      setInteracting(true);
      chooseObject(id);
      setObjectiveHint(null);
      audioManager.playSfx('object_interact');

      setNarrativeCaption(getPersonalizedObjectMessage(id, answers));

      setCinematicShot({
        position: [pos[0] + 1.1, 1.65, pos[2] + 2.5],
        lookAt: [pos[0], 0.9, pos[2] + 0.25],
        fov: 45,
        duration: 1.5,
      });

      window.setTimeout(() => {
        setNarrativeCaption(null);
        transitionTo('MISSION_3', { withFade: true });
      }, CUTSCENE_MIN_DURATION_MS);
    },
    [answers, chooseObject, setCinematicShot, setNarrativeCaption, setObjectiveHint, transitionTo]
  );

  const targets = useMemo<InteractionTarget[]>(
    () =>
      REHEARSAL_OPTIONS.map((option) => ({
        id: `rehearsal_${option.id}`,
        label: option.label,
        sublabel: option.sublabel,
        position: option.pos,
        radius: 1.7,
        accentColor: option.accent,
        onInteract: () => handleSelect(option.id, option.pos),
      })),
    [handleSelect]
  );

  const obstacles = useMemo<ObstacleCircle[]>(
    () => [
      { x: -2.0, z: -2.2, radius: 0.55 },
      { x: 0, z: -3.0, radius: 0.55 },
      { x: 2.0, z: -2.2, radius: 0.55 },
    ],
    []
  );

  return (
    <group>
      <CameraRig followDistance={3.1} followHeight={1.42} />

      <hemisphereLight args={['#fff9ee', '#b7a48c', 1.06]} />
      <directionalLight
        position={[-3, 7, 5]}
        intensity={1.75}
        color="#ffe3b8"
        castShadow={graphicsProfile !== 'LOW'}
        shadow-mapSize-width={graphicsProfile === 'HIGH' ? 2048 : 1024}
        shadow-mapSize-height={graphicsProfile === 'HIGH' ? 2048 : 1024}
      />
      <pointLight position={[0, 2.9, -1.4]} intensity={0.5} distance={8} color="#fff2d8" />

      <CorridorShell initialWarmth={1} />
      <PrinterCorner position={[-2.5, 0, -5.6]} initialWarmth={1} />
      <WindowBench position={[0, 0, -3.2]} initialWarmth={1} />

      {/* پسر سر میز بغلی؛ فقط یک بار خودکارش را زمین میگذارد */}
      <StylizedCharacter
        kind="male"
        position={[1.85, 0.02, -3.5]}
        rotationY={-0.5}
        pose="idle"
        emotion="thoughtful"
        gazeBehavior="down_shy"
        showPen
      />

      <InteractionSystem targets={targets} enabled={!interacting} />

      <PlayerController
        bounds={{ minX: -2.8, maxX: 2.8, minZ: -5.2, maxZ: 4.0 }}
        obstacles={obstacles}
        controlEnabled={!interacting}
        overridePose={interacting ? 'interact' : undefined}
        emotion={interacting ? 'thoughtful' : 'neutral'}
      />
    </group>
  );
};
