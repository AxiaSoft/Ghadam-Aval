import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { assetManager, AssetKey } from '../assets/AssetManager';
import {
  buildFallbackCharacterTemplate,
  CharacterRigNodes,
  instantiateCharacterRig,
} from './CharacterBuilder';
import { ProceduralAnimator } from '../animation/ProceduralAnimator';
import { CharacterEmotion, CharacterGazeBehavior, CharacterPose } from '../types/game';
import { useGameStore } from '../state/gameStore';

export interface StylizedCharacterProps {
  kind: 'female' | 'male' | 'student';
  position?: [number, number, number];
  rotationY?: number;
  pose?: CharacterPose;
  seated?: boolean;
  emotion?: CharacterEmotion;
  gazeBehavior?: CharacterGazeBehavior;
  gazeTarget?: THREE.Vector3 | null;
  walkSpeed?: number;
  isSpeaking?: boolean;
  showPen?: boolean;
  tintTop?: string;
  phaseOffset?: number;
  onFootstep?: () => void;
  groupRef?: React.RefObject<THREE.Group | null>;
}

export const StylizedCharacter: React.FC<StylizedCharacterProps> = ({
  kind,
  position = [0, 0, 0],
  rotationY = 0,
  pose = 'idle',
  seated = false,
  emotion = 'neutral',
  gazeBehavior = 'forward',
  gazeTarget = null,
  walkSpeed = 0,
  isSpeaking = false,
  showPen = false,
  tintTop,
  phaseOffset = 0,
  onFootstep,
  groupRef,
}) => {
  const internalGroupRef = useRef<THREE.Group>(null);
  const targetRef = groupRef ?? internalGroupRef;

  const graphicsProfile = useGameStore((s) => s.graphicsProfile);
  const isPaused = useGameStore((s) => s.isPaused);
  const castShadow = graphicsProfile !== 'LOW' && kind !== 'student';

  const assetKey: AssetKey =
    kind === 'female'
      ? 'female_character'
      : kind === 'male'
        ? 'male_character'
        : 'student_npc';

  const resolvedTintTop =
    tintTop ?? (kind === 'female' ? '#ae7163' : kind === 'male' ? '#416d92' : '#6b7078');

  const rigNodes = useMemo<CharacterRigNodes>(() => {
    const cached = assetManager.getCached(assetKey);
    const template = cached ?? buildFallbackCharacterTemplate(kind);
    return instantiateCharacterRig(template, {
      castShadow,
      receiveShadow: graphicsProfile === 'HIGH',
      tintSweater: resolvedTintTop,
      showPen,
    });
  }, [assetKey, kind, castShadow, graphicsProfile, resolvedTintTop, showPen]);

  const animator = useMemo(() => new ProceduralAnimator(phaseOffset), [phaseOffset]);

  useEffect(() => {
    animator.onFootstep = onFootstep;
  }, [animator, onFootstep]);

  useEffect(() => {
    if (rigNodes.heldPen) {
      rigNodes.heldPen.visible = showPen;
    }
  }, [rigNodes, showPen]);

  useFrame((_, delta) => {
    if (isPaused) return;
    animator.update(rigNodes, delta, {
      pose,
      seated,
      emotion,
      gazeBehavior,
      gazeTargetWorld: gazeTarget,
      walkSpeed,
      isSpeaking,
      isFemale: kind === 'female',
      baseHipsY: kind === 'male' ? 0.963 : kind === 'female' ? 0.9 : 0.88,
    });
  });

  const isSeated =
    seated ||
    pose === 'sit' ||
    pose === 'sit_attentive' ||
    pose === 'sit_nervous' ||
    pose === 'sit_lean_forward';

  return (
    <group ref={targetRef} position={position} rotation={[0, rotationY, 0]}>
      <primitive object={rigNodes.root} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.012, isSeated ? 0.08 : 0]}
        receiveShadow={false}
      >
        <circleGeometry args={[kind === 'student' ? 0.24 : 0.28, 16]} />
        <meshBasicMaterial color="#0d1017" transparent opacity={0.26} depthWrite={false} />
      </mesh>
    </group>
  );
};
