import React, { useCallback, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StylizedCharacter } from './StylizedCharacter';
import { getCombinedMovementVector, transientInput } from '../state/inputStore';
import { audioManager } from '../audio/AudioManager';
import { useGameStore } from '../state/gameStore';
import { CharacterEmotion, CharacterGazeBehavior, CharacterPose } from '../types/game';

export interface ObstacleCircle {
  x: number;
  z: number;
  radius: number;
}

export interface PlayerBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface PlayerControllerProps {
  bounds: PlayerBounds;
  obstacles?: ObstacleCircle[];
  controlEnabled?: boolean;
  overridePose?: CharacterPose;
  overrideSeated?: boolean;
  emotion?: CharacterEmotion;
  overridePosition?: [number, number, number] | null;
  overrideRotationY?: number | null;
  autoWalkTarget?: THREE.Vector3 | null;
  onReachAutoWalkTarget?: () => void;
  gazeBehavior?: CharacterGazeBehavior;
  gazeTarget?: THREE.Vector3 | null;
  isSpeaking?: boolean;
  moveSpeed?: number;
}

export const PlayerController: React.FC<PlayerControllerProps> = ({
  bounds,
  obstacles = [],
  controlEnabled = true,
  overridePose,
  overrideSeated = false,
  emotion = 'neutral',
  overridePosition = null,
  overrideRotationY = null,
  autoWalkTarget = null,
  onReachAutoWalkTarget,
  gazeBehavior = 'forward',
  gazeTarget = null,
  isSpeaking = false,
  moveSpeed = 2.65,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const isPaused = useGameStore((s) => s.isPaused);
  const [locomotionPose, setLocomotionPose] = useState<'idle' | 'walk'>('idle');
  const walkSpeedRef = useRef(0);
  const reachedAutoRef = useRef(false);

  const handleFootstep = useCallback(() => {
    audioManager.playSfx('footstep');
  }, []);

  useFrame((_, delta) => {
    if (isPaused || !groupRef.current) return;
    const dt = Math.min(delta, 0.05);

    if (overridePosition) {
      transientInput.playerPosition.set(
        overridePosition[0],
        overridePosition[1],
        overridePosition[2]
      );
      if (overrideRotationY !== null) {
        transientInput.playerHeading = overrideRotationY;
      }
      groupRef.current.position.copy(transientInput.playerPosition);
      groupRef.current.rotation.y = transientInput.playerHeading;
      if (locomotionPose !== 'idle') setLocomotionPose('idle');
      return;
    }

    if (autoWalkTarget) {
      const dx = autoWalkTarget.x - transientInput.playerPosition.x;
      const dz = autoWalkTarget.z - transientInput.playerPosition.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.14) {
        reachedAutoRef.current = false;
        const dirX = dx / dist;
        const dirZ = dz / dist;
        const step = Math.min(dist, moveSpeed * 0.85 * dt);
        transientInput.playerPosition.x += dirX * step;
        transientInput.playerPosition.z += dirZ * step;

        const desiredHeading = Math.atan2(dirX, dirZ);
        let diff = desiredHeading - transientInput.playerHeading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        transientInput.playerHeading += diff * Math.min(1, dt * 10);

        walkSpeedRef.current = 0.78;
        transientInput.playerSpeed = 0.78;
        if (locomotionPose !== 'walk') setLocomotionPose('walk');
      } else {
        walkSpeedRef.current = 0;
        transientInput.playerSpeed = 0;
        if (locomotionPose !== 'idle') setLocomotionPose('idle');
        if (!reachedAutoRef.current) {
          reachedAutoRef.current = true;
          onReachAutoWalkTarget?.();
        }
      }

      groupRef.current.position.copy(transientInput.playerPosition);
      groupRef.current.rotation.y = transientInput.playerHeading;
      return;
    }

    if (!controlEnabled) {
      walkSpeedRef.current = 0;
      transientInput.playerSpeed = 0;
      if (locomotionPose !== 'idle') setLocomotionPose('idle');
      groupRef.current.position.copy(transientInput.playerPosition);
      if (overrideRotationY !== null) {
        transientInput.playerHeading = overrideRotationY;
      }
      groupRef.current.rotation.y = transientInput.playerHeading;
      return;
    }

    const { x: joyX, y: joyY, magnitude } = getCombinedMovementVector();

    if (magnitude > 0.06) {
      const camYaw = transientInput.cameraYaw;
      const forwardX = -Math.sin(camYaw);
      const forwardZ = -Math.cos(camYaw);
      const rightX = Math.cos(camYaw);
      const rightZ = -Math.sin(camYaw);

      const moveDirX = forwardX * joyY + rightX * joyX;
      const moveDirZ = forwardZ * joyY + rightZ * joyX;
      const len = Math.hypot(moveDirX, moveDirZ) || 1;
      const nx = moveDirX / len;
      const nz = moveDirZ / len;

      let nextX = transientInput.playerPosition.x + nx * moveSpeed * magnitude * dt;
      let nextZ = transientInput.playerPosition.z + nz * moveSpeed * magnitude * dt;

      nextX = THREE.MathUtils.clamp(nextX, bounds.minX, bounds.maxX);
      nextZ = THREE.MathUtils.clamp(nextZ, bounds.minZ, bounds.maxZ);

      const playerRadius = 0.32;
      for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        const odx = nextX - obs.x;
        const odz = nextZ - obs.z;
        const minDist = obs.radius + playerRadius;
        const dSq = odx * odx + odz * odz;
        if (dSq < minDist * minDist && dSq > 0.0001) {
          const d = Math.sqrt(dSq);
          nextX = obs.x + (odx / d) * minDist;
          nextZ = obs.z + (odz / d) * minDist;
        }
      }

      transientInput.playerPosition.x = THREE.MathUtils.clamp(nextX, bounds.minX, bounds.maxX);
      transientInput.playerPosition.z = THREE.MathUtils.clamp(nextZ, bounds.minZ, bounds.maxZ);

      const targetHeading = Math.atan2(nx, nz);
      let angleDiff = targetHeading - transientInput.playerHeading;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      transientInput.playerHeading += angleDiff * Math.min(1, dt * 11);

      walkSpeedRef.current = magnitude;
      transientInput.playerSpeed = magnitude;
      if (locomotionPose !== 'walk') setLocomotionPose('walk');
    } else {
      walkSpeedRef.current = THREE.MathUtils.lerp(walkSpeedRef.current, 0, dt * 12);
      transientInput.playerSpeed = walkSpeedRef.current;
      if (walkSpeedRef.current < 0.05 && locomotionPose !== 'idle') {
        setLocomotionPose('idle');
      }
    }

    groupRef.current.position.copy(transientInput.playerPosition);
    groupRef.current.rotation.y = transientInput.playerHeading;
  });

  const activePose: CharacterPose = overridePose ?? locomotionPose;

  return (
    <StylizedCharacter
      kind="female"
      groupRef={groupRef}
      pose={activePose}
      seated={overrideSeated}
      emotion={emotion}
      walkSpeed={walkSpeedRef.current || 0.85}
      gazeBehavior={gazeBehavior}
      gazeTarget={gazeTarget}
      isSpeaking={isSpeaking}
      onFootstep={handleFootstep}
    />
  );
};
