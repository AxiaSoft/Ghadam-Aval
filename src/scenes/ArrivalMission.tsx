import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraRig } from '../camera/CameraRig';
import { PlayerController } from '../characters/PlayerController';
import { InteractionSystem } from '../interaction/InteractionSystem';
import { resetPlayerTransform } from '../state/inputStore';
import { useGameStore } from '../state/gameStore';
import { InteractionTarget } from '../types/game';
import { audioManager } from '../audio/AudioManager';
import { CampusArrival } from './CampusArrival';
import { ARRIVAL_PLAN } from './arrivalPlan';

/** Two sequential physical objectives in each chapter, rather than three overlapping choices. */
export const ArrivalMission: React.FC<{ chapter: 1 | 2 }> = ({ chapter }) => {
  const { scene } = useThree();
  const graphics = useGameStore(s => s.graphicsProfile);
  const setHint = useGameStore(s => s.setObjectiveHint);
  const setCaption = useGameStore(s => s.setNarrativeCaption);
  const setShot = useGameStore(s => s.setCinematicShot);
  const transition = useGameStore(s => s.transitionTo);
  const [step, setStep] = useState(0);
  const [interacting, setInteracting] = useState(false);
  const locked = useRef(false);
  const pending = useRef<{ remaining: number; finish: () => void } | null>(null);
  useFrame((_, delta) => {
    if (!pending.current || useGameStore.getState().isPaused) return;
    pending.current.remaining -= Math.min(delta, 0.1);
    if (pending.current.remaining <= 0) {
      const finish = pending.current.finish;
      pending.current = null;
      finish();
    }
  });

  useEffect(() => {
    setStep(0); setInteracting(false); locked.current = false;
    resetPlayerTransform(chapter === 1 ? [0, 0, 4] : [-2, 0, -1.4], Math.PI, 0, .24);
    setShot(null); setCaption(null);
    scene.background = new THREE.Color('#d7e4ea');
    scene.fog = new THREE.Fog('#d7e4ea', 20, 48);
    return () => { pending.current = null; setHint(null); setCaption(null); };
  }, [chapter, scene, setHint, setCaption, setShot]);
  useEffect(() => {
    setHint(ARRIVAL_PLAN[chapter][step]?.hint ?? null);
  }, [chapter, step, setHint]);

  const targets = useMemo<InteractionTarget[]>(() => {
    if (step > 1) return [];
    const objective = ARRIVAL_PLAN[chapter][step];
    return [{ ...objective,
      onInteract: () => {
        if (locked.current) return;
        locked.current = true;
        setInteracting(true);
        audioManager.playSfx('object_interact');
        setCaption(objective.caption);
        pending.current = { remaining: 2.2, finish: () => {
          setCaption(null);
          if (step === 0) { locked.current = false; setInteracting(false); setStep(1); }
          else { setStep(2); transition(chapter === 1 ? 'MISSION_2' : 'MISSION_3', { withFade: true }); }
        } };
      },
    }];
  }, [chapter, step, setCaption, transition]);
  return <group>
    <CameraRig followDistance={3.4} followHeight={1.5} indoorClamp={{minX:-6.1,maxX:6.1,minZ:-6.2,maxZ:7.8,maxY:4.5}} />
    <hemisphereLight args={['#e8f3ff', '#9a8b77', 1.3]} />
    <directionalLight position={[4,8,4]} intensity={1.8} color="#fff0d9" castShadow={graphics !== 'LOW'} shadow-mapSize-width={graphics === 'HIGH' ? 2048 : 1024} shadow-mapSize-height={graphics === 'HIGH' ? 2048 : 1024} />
    <CampusArrival showCard={chapter === 1 || step === 0} />
    <InteractionSystem targets={targets} enabled={step < 2 && !interacting} />
    <PlayerController controlEnabled={!interacting} overridePose={interacting ? 'interact' : undefined} bounds={{minX:-5.5,maxX:5.5,minZ:-5.5,maxZ:5.5}} obstacles={[{x:-3,z:-3,radius:.55},{x:2.7,z:-1.8,radius:.7}]} />
  </group>;
};
