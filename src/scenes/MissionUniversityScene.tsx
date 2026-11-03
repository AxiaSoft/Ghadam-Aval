import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PlayerController, ObstacleCircle } from '../characters/PlayerController';
import { StylizedCharacter } from '../characters/StylizedCharacter';
import { CameraRig } from '../camera/CameraRig';
import { InteractionSystem } from '../interaction/InteractionSystem';
import { useGameStore } from '../state/gameStore';
import { resetPlayerTransform } from '../state/inputStore';
import { InteractionTarget } from '../types/game';
import { audioManager } from '../audio/AudioManager';
import { assetManager } from '../assets/AssetManager';
import {
  CUTSCENE_CAPTIONS,
  CUTSCENE_MIN_DURATION_MS,
} from '../dialogue/dialogueData';

export const MissionUniversityScene: React.FC = () => {
  const { scene } = useThree();
  const graphicsProfile = useGameStore((s) => s.graphicsProfile);
  const answers = useGameStore((s) => s.answers);
  const setObjectiveHint = useGameStore((s) => s.setObjectiveHint);
  const setNarrativeCaption = useGameStore((s) => s.setNarrativeCaption);
  const setCinematicShot = useGameStore((s) => s.setCinematicShot);
  const transitionTo = useGameStore((s) => s.transitionTo);

  const [entering, setEntering] = useState(false);
  const enteringRef = useRef(false);
  const doorLeftRef = useRef<THREE.Group>(null);
  const doorRightRef = useRef<THREE.Group>(null);
  const doorAngleRef = useRef(0);

  useEffect(() => {
    resetPlayerTransform([0, 0, 4.8], Math.PI, 0, 0.22);
    setCinematicShot(null);
    setObjectiveHint('مرحله سوم — در محوطه‌ی دانشگاه به سمت سرِدرِ اصلی حرکت کن');

    scene.background = new THREE.Color('#cce6ff');
    scene.fog = new THREE.FogExp2('#eaf2f8', 0.018);

    // Ensure student NPC asset is ready for Classroom
    assetManager.loadAsset('student_npc').catch(() => {});

    return () => {
      setObjectiveHint(null);
    };
  }, [scene, setCinematicShot, setObjectiveHint]);

  useFrame((_, delta) => {
    if (entering && doorAngleRef.current < 1.15) {
      doorAngleRef.current = Math.min(1.15, doorAngleRef.current + delta * 1.8);
      if (doorLeftRef.current) doorLeftRef.current.rotation.y = -doorAngleRef.current;
      if (doorRightRef.current) doorRightRef.current.rotation.y = doorAngleRef.current;
    }
  });

  const handleEnterUniversity = useCallback(() => {
    if (enteringRef.current) return;
    enteringRef.current = true;
    setEntering(true);
    setObjectiveHint(null);
    audioManager.playSfx('door_open');
    setNarrativeCaption(CUTSCENE_CAPTIONS.universityEnter);

    setCinematicShot({
      position: [0, 1.85, -1.8],
      lookAt: [0, 1.65, -6.8],
      fov: 45,
      duration: 2.8,
    });

    window.setTimeout(() => {
      setNarrativeCaption(null);
      transitionTo('CLASSROOM_ENTRY', { withFade: true });
    }, CUTSCENE_MIN_DURATION_MS);
  }, [setCinematicShot, setNarrativeCaption, setObjectiveHint, transitionTo]);

  const targets = useMemo<InteractionTarget[]>(
    () => [
      {
        id: 'univ_main_entrance',
        label: 'ورود به دانشگاه',
        sublabel: 'حرکت به سمت کلاسِ درس',
        position: [0, 0, -4.1],
        radius: 2.25,
        accentColor: '#f5c76e',
        onInteract: handleEnterUniversity,
      },
    ],
    [handleEnterUniversity]
  );

  const obstacles = useMemo<ObstacleCircle[]>(
    () => [
      { x: -3.2, z: 2.2, radius: 0.75 },
      { x: 3.2, z: 2.2, radius: 0.75 },
      { x: -3.2, z: -1.4, radius: 0.75 },
      { x: 3.2, z: -1.4, radius: 0.75 },
    ],
    []
  );

  const showExtraFlowers =
    answers.atmosphere === 'flowers_gardens' || answers.atmosphere === 'nature';

  return (
    <group>
      <CameraRig followDistance={3.8} followHeight={1.55} />

      <hemisphereLight args={['#fff9ed', '#678d5f', 1.1]} />
      <directionalLight
        position={[8, 13, 7]}
        intensity={2.05}
        color="#ffdfaa"
        castShadow={graphicsProfile !== 'LOW'}
        shadow-mapSize-width={graphicsProfile === 'HIGH' ? 2048 : 1024}
        shadow-mapSize-height={graphicsProfile === 'HIGH' ? 2048 : 1024}
      />

      {/* Campus Lawn */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[42, 42]} />
        <meshStandardMaterial color="#6da065" roughness={0.9} />
      </mesh>

      {/* Main Paved Sidewalk & Forecourt */}
      <mesh position={[0, 0.015, 1.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.8, 15]} />
        <meshStandardMaterial color="#e6dfd3" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.018, -3.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11.5, 4.2]} />
        <meshStandardMaterial color="#ebe4d8" roughness={0.76} />
      </mesh>

      {/* Sidewalk curbs */}
      {[-2.0, 2.0].map((cx, idx) => (
        <mesh key={idx} position={[cx, 0.05, 2.5]} receiveShadow>
          <boxGeometry args={[0.2, 0.1, 12.2]} />
          <meshStandardMaterial color="#d4cbbd" roughness={0.8} />
        </mesh>
      ))}

      {/* UNIVERSITY EXTERIOR BUILDING FACADE */}
      <group position={[0, 0, -6.5]}>
        {/* Wide entrance steps */}
        <mesh position={[0, 0.08, 1.25]} receiveShadow>
          <boxGeometry args={[5.2, 0.16, 1.2]} />
          <meshStandardMaterial color="#dfd6c7" roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.2, 0.8]} receiveShadow>
          <boxGeometry args={[4.6, 0.16, 0.8]} />
          <meshStandardMaterial color="#e8dfd0" roughness={0.75} />
        </mesh>

        {/* Warm collegiate sandstone & terracotta main facade */}
        <mesh position={[-5.2, 2.8, 0]} castShadow={graphicsProfile !== 'LOW'} receiveShadow>
          <boxGeometry args={[6.8, 5.6, 2.4]} />
          <meshStandardMaterial color="#c97d60" roughness={0.78} />
        </mesh>
        <mesh position={[5.2, 2.8, 0]} castShadow={graphicsProfile !== 'LOW'} receiveShadow>
          <boxGeometry args={[6.8, 5.6, 2.4]} />
          <meshStandardMaterial color="#c97d60" roughness={0.78} />
        </mesh>
        {/* Central entrance portico */}
        <mesh position={[0, 3.85, 0]} castShadow={graphicsProfile !== 'LOW'}>
          <boxGeometry args={[4.2, 3.5, 2.5]} />
          <meshStandardMaterial color="#e8decb" roughness={0.72} />
        </mesh>
        {/* Warm interior vestibule wall behind entrance doors */}
        <mesh position={[0, 1.5, -0.35]}>
          <boxGeometry args={[4.2, 3.1, 0.4]} />
          <meshStandardMaterial color="#f6e7c8" emissive="#ffd996" emissiveIntensity={0.35} roughness={0.8} />
        </mesh>

        {/* Classical Entrance Columns */}
        {[-1.75, -0.95, 0.95, 1.75].map((colX, idx) => (
          <mesh key={idx} position={[colX, 2.3, 1.18]} castShadow={graphicsProfile !== 'LOW'}>
            <cylinderGeometry args={[0.14, 0.17, 4.4, 14]} />
            <meshStandardMaterial color="#f2eadb" roughness={0.68} />
          </mesh>
        ))}

        {/* Roof cornice & triangular pediment */}
        <mesh position={[0, 5.75, 0.2]}>
          <boxGeometry args={[17.6, 0.36, 2.9]} />
          <meshStandardMaterial color="#efe6d5" roughness={0.7} />
        </mesh>
        <mesh position={[0, 6.35, 0.9]} rotation={[0, 0, 0]}>
          <coneGeometry args={[2.8, 1.2, 4]} />
          <meshStandardMaterial color="#e6dcc8" roughness={0.72} />
        </mesh>

        {/* Campus Clock Emblem */}
        <mesh position={[0, 4.25, 1.28]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.08, 24]} />
          <meshStandardMaterial color="#faf6ed" roughness={0.4} />
        </mesh>

        {/* Animated Double Main Entrance Doors */}
        <group ref={doorLeftRef} position={[-0.9, 1.32, 0.65]}>
          <mesh position={[0.44, 0, 0]}>
            <boxGeometry args={[0.88, 2.35, 0.08]} />
            <meshStandardMaterial color="#5d3b28" roughness={0.55} />
          </mesh>
          <mesh position={[0.44, 0.35, 0.045]}>
            <planeGeometry args={[0.56, 1.1]} />
            <meshStandardMaterial color="#bfe0f5" roughness={0.18} metalness={0.3} />
          </mesh>
        </group>

        <group ref={doorRightRef} position={[0.9, 1.32, 0.65]}>
          <mesh position={[-0.44, 0, 0]}>
            <boxGeometry args={[0.88, 2.35, 0.08]} />
            <meshStandardMaterial color="#5d3b28" roughness={0.55} />
          </mesh>
          <mesh position={[-0.44, 0.35, 0.045]}>
            <planeGeometry args={[0.56, 1.1]} />
            <meshStandardMaterial color="#bfe0f5" roughness={0.18} metalness={0.3} />
          </mesh>
        </group>

        {/* University Facade Windows (2 floors, both wings) */}
        {[-6.8, -5.1, -3.4, 3.4, 5.1, 6.8].map((wx, wi) =>
          [1.65, 3.85].map((wy, fi) => (
            <group key={`${wi}-${fi}`} position={[wx, wy, 1.22]}>
              <mesh>
                <boxGeometry args={[0.98, 1.48, 0.08]} />
                <meshStandardMaterial color="#f2eadb" roughness={0.7} />
              </mesh>
              <mesh position={[0, 0, 0.052]}>
                <planeGeometry args={[0.78, 1.28]} />
                <meshStandardMaterial color="#8ebbd9" roughness={0.15} metalness={0.35} />
              </mesh>
            </group>
          ))
        )}
      </group>

      {/* Benches & Lampposts along the walkway */}
      {[
        { x: -3.1, z: 2.2, rot: Math.PI / 2 },
        { x: 3.1, z: 2.2, rot: -Math.PI / 2 },
        { x: -3.1, z: -1.4, rot: Math.PI / 2 },
        { x: 3.1, z: -1.4, rot: -Math.PI / 2 },
      ].map((b, idx) => (
        <group key={idx} position={[b.x, 0, b.z]} rotation={[0, b.rot, 0]}>
          {/* Wooden Bench */}
          <mesh position={[0, 0.42, 0]} castShadow={graphicsProfile === 'HIGH'}>
            <boxGeometry args={[1.35, 0.07, 0.46]} />
            <meshStandardMaterial color="#8d5b3c" roughness={0.72} />
          </mesh>
          <mesh position={[0, 0.72, -0.2]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[1.35, 0.42, 0.06]} />
            <meshStandardMaterial color="#8d5b3c" roughness={0.72} />
          </mesh>
          {[-0.52, 0.52].map((lx, li) => (
            <mesh key={li} position={[lx, 0.21, 0]}>
              <boxGeometry args={[0.08, 0.42, 0.44]} />
              <meshStandardMaterial color="#2f353d" roughness={0.6} metalness={0.4} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Campus Lampposts */}
      {[
        [-2.35, 0, 4.4],
        [2.35, 0, 4.4],
        [-2.35, 0, -0.2],
        [2.35, 0, -0.2],
      ].map(([lx, ly, lz], idx) => (
        <group key={idx} position={[lx, ly, lz]}>
          <mesh position={[0, 1.45, 0]}>
            <cylinderGeometry args={[0.045, 0.07, 2.9, 10]} />
            <meshStandardMaterial color="#2b313a" roughness={0.5} metalness={0.5} />
          </mesh>
          <mesh position={[0, 2.98, 0]}>
            <sphereGeometry args={[0.16, 12, 10]} />
            <meshStandardMaterial
              color="#fff4d2"
              emissive="#ffd27d"
              emissiveIntensity={0.45}
              roughness={0.25}
            />
          </mesh>
        </group>
      ))}

      {/* Stylized Campus Trees & Flower Planters */}
      {[
        [-5.4, 0, 4.2],
        [5.4, 0, 4.2],
        [-5.8, 0, 0.2],
        [5.8, 0, 0.2],
        [-6.2, 0, -3.4],
        [6.2, 0, -3.4],
      ].map(([tx, ty, tz], idx) => (
        <group key={idx} position={[tx, ty, tz]}>
          <mesh position={[0, 1.0, 0]} castShadow={graphicsProfile !== 'LOW'}>
            <cylinderGeometry args={[0.14, 0.21, 2.0, 8]} />
            <meshStandardMaterial color="#694b37" roughness={0.88} />
          </mesh>
          <mesh position={[0, 2.4, 0]} castShadow={graphicsProfile !== 'LOW'}>
            <sphereGeometry args={[1.15, 14, 12]} />
            <meshStandardMaterial
              color={idx % 2 === 0 ? '#4e8f56' : '#63a162'}
              roughness={0.8}
            />
          </mesh>
          {showExtraFlowers && (
            <mesh position={[0.45, 0.2, 0.55]}>
              <sphereGeometry args={[0.32, 10, 8]} />
              <meshStandardMaterial color="#f08ca2" roughness={0.7} />
            </mesh>
          )}
        </group>
      ))}

      {/* Simplified desaturated background students on campus */}
      {graphicsProfile !== 'LOW' && (
        <>
          <StylizedCharacter
            kind="student"
            position={[-3.05, 0, 2.2]}
            rotationY={Math.PI / 2}
            pose="sit"
            phaseOffset={0.3}
          />
          <StylizedCharacter
            kind="student"
            position={[4.2, 0, -3.1]}
            rotationY={-0.6}
            pose="idle"
            phaseOffset={0.7}
          />
        </>
      )}

      <InteractionSystem targets={targets} enabled={!entering} />

      <PlayerController
        bounds={{ minX: -6.5, maxX: 6.5, minZ: -4.7, maxZ: 8.2 }}
        obstacles={obstacles}
        controlEnabled={!entering}
        autoWalkTarget={entering ? new THREE.Vector3(0, 0, -5.6) : null}
      />
    </group>
  );
};
