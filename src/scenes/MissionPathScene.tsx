import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PlayerController } from '../characters/PlayerController';
import { CameraRig } from '../camera/CameraRig';
import { InteractionSystem } from '../interaction/InteractionSystem';
import { useGameStore } from '../state/gameStore';
import { resetPlayerTransform } from '../state/inputStore';
import { InteractionTarget, PathColorChoice } from '../types/game';
import { audioManager } from '../audio/AudioManager';
import { CUTSCENE_MIN_DURATION_MS } from '../dialogue/dialogueData';

const PATH_CONFIGS: {
  id: PathColorChoice;
  label: string;
  sublabel: string;
  nameFa: string;
  color: string;
  emissive: string;
  endPos: [number, number, number];
  angle: number;
}[] = [
  {
    id: 'blue',
    label: 'انتخاب مسیر آبی',
    sublabel: 'آرامش، شفافیت و عمقِ خیال',
    nameFa: 'آبی',
    color: '#4c94e6',
    emissive: '#1e5ba8',
    endPos: [-3.1, 0, -4.6],
    angle: 0.46,
  },
  {
    id: 'pink',
    label: 'انتخاب مسیر صورتی',
    sublabel: 'صمیمیت، مهربانی و لطافت',
    nameFa: 'صورتی',
    color: '#ea7fa2',
    emissive: '#a63a5e',
    endPos: [0, 0, -5.2],
    angle: 0,
  },
  {
    id: 'gold',
    label: 'انتخاب مسیر طلایی',
    sublabel: 'روشنایی، امید و شروعی تازه',
    nameFa: 'طلایی',
    color: '#ebb64b',
    emissive: '#9e6b14',
    endPos: [3.1, 0, -4.6],
    angle: -0.46,
  },
];

export const MissionPathScene: React.FC = () => {
  const { scene } = useThree();
  const graphicsProfile = useGameStore((s) => s.graphicsProfile);
  const answers = useGameStore((s) => s.answers);
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
    setObjectiveHint('مرحله اول — به جلو قدم بزن و یکی از سه مسیر رنگی را انتخاب کن');

    scene.background = new THREE.Color(
      answers.atmosphere === 'starry_sky' ? '#b7cff2' : '#d4ecff'
    );
    scene.fog = new THREE.FogExp2('#eaf2fa', 0.022);

    return () => {
      setObjectiveHint(null);
    };
  }, [scene, answers.atmosphere, setCinematicShot, setObjectiveHint]);

  const handleSelectPath = useCallback(
    (cfg: (typeof PATH_CONFIGS)[number]) => {
      if (chosenRef.current) return;
      chosenRef.current = true;
      setChosen(true);

      audioManager.playSfx('object_interact');
      choosePath(cfg.id);
      setObjectiveHint(null);
      setNarrativeCaption(`در مسیرِ ${cfg.nameFa} قدم گذاشتی — ${cfg.sublabel}.`);

      setCinematicShot({
        position: [cfg.endPos[0] * 0.65, 2.2, cfg.endPos[2] + 3.4],
        lookAt: [cfg.endPos[0], 1.25, cfg.endPos[2] - 1.2],
        fov: 46,
        duration: 1.8,
      });

      window.setTimeout(() => {
        transitionTo('MISSION_2', { withFade: true });
      }, CUTSCENE_MIN_DURATION_MS);
    },
    [choosePath, setCinematicShot, setNarrativeCaption, setObjectiveHint, transitionTo]
  );

  const targets = useMemo<InteractionTarget[]>(
    () =>
      PATH_CONFIGS.map((cfg) => ({
        id: `path_${cfg.id}`,
        label: cfg.label,
        sublabel: cfg.sublabel,
        position: [cfg.endPos[0] * 0.85, 0, cfg.endPos[2] + 0.55],
        radius: 2.1,
        accentColor: cfg.color,
        onInteract: () => handleSelectPath(cfg),
      })),
    [handleSelectPath]
  );

  return (
    <group>
      <CameraRig followDistance={3.6} followHeight={1.5} />

      <hemisphereLight args={['#fff7ea', '#668f5e', 1.1]} />
      <directionalLight
        position={[7, 11, 5]}
        intensity={1.95}
        color="#ffe0ab"
        castShadow={graphicsProfile !== 'LOW'}
        shadow-mapSize-width={graphicsProfile === 'HIGH' ? 2048 : 1024}
        shadow-mapSize-height={graphicsProfile === 'HIGH' ? 2048 : 1024}
      />

      {/* Lush sunlit meadow ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[28, 48]} />
        <meshStandardMaterial color="#73a16a" roughness={0.9} />
      </mesh>

      {/* Rolling horizon hills & sun glow for atmospheric depth */}
      {[
        [-14, -1.0, -20, 9.5, 3.8],
        [0, -1.2, -23, 12.0, 4.4],
        [14, -1.0, -20, 9.5, 3.8],
      ].map(([hx, hy, hz, sx, sy], idx) => (
        <mesh key={`hill-${idx}`} position={[hx, hy, hz]} scale={[sx, sy, 5]}>
          <sphereGeometry args={[1, 18, 12]} />
          <meshStandardMaterial color="#5d9464" roughness={0.92} />
        </mesh>
      ))}
      <mesh position={[6, 9.5, -24]}>
        <circleGeometry args={[2.2, 24]} />
        <meshBasicMaterial color="#fff3cf" transparent opacity={0.78} />
      </mesh>

      {/* Starting stone plaza */}
      <mesh position={[0, 0.02, 3.3]} receiveShadow>
        <cylinderGeometry args={[2.3, 2.45, 0.06, 32]} />
        <meshStandardMaterial color="#e7dcc9" roughness={0.78} />
      </mesh>

      {/* Three Colored Pathways (Blue, Pink, Gold) */}
      {PATH_CONFIGS.map((cfg) => {
        const steps = 11;
        const startX = 0;
        const startZ = 1.6;
        return (
          <group key={cfg.id}>
            {Array.from({ length: steps }).map((_, i) => {
              const t = (i + 1) / steps;
              const x = THREE.MathUtils.lerp(startX, cfg.endPos[0], t);
              const z = THREE.MathUtils.lerp(startZ, cfg.endPos[2], t);
              return (
                <mesh
                  key={i}
                  position={[x, 0.025 + i * 0.001, z]}
                  rotation={[0, cfg.angle, 0]}
                  receiveShadow
                >
                  <boxGeometry args={[1.18, 0.05, 0.62]} />
                  <meshStandardMaterial
                    color={cfg.color}
                    emissive={cfg.emissive}
                    emissiveIntensity={0.22}
                    roughness={0.48}
                  />
                </mesh>
              );
            })}

            {/* Path Destination Stone Archway Shrine */}
            <group position={cfg.endPos} rotation={[0, cfg.angle, 0]}>
              <mesh position={[0, 0.03, 0]} receiveShadow>
                <cylinderGeometry args={[1.15, 1.25, 0.07, 24]} />
                <meshStandardMaterial color={cfg.color} roughness={0.45} />
              </mesh>
              <mesh position={[-0.78, 1.25, -0.3]} castShadow={graphicsProfile !== 'LOW'}>
                <cylinderGeometry args={[0.1, 0.12, 2.5, 12]} />
                <meshStandardMaterial color="#efe5d5" roughness={0.7} />
              </mesh>
              <mesh position={[0.78, 1.25, -0.3]} castShadow={graphicsProfile !== 'LOW'}>
                <cylinderGeometry args={[0.1, 0.12, 2.5, 12]} />
                <meshStandardMaterial color="#efe5d5" roughness={0.7} />
              </mesh>
              <mesh position={[0, 2.55, -0.3]}>
                <boxGeometry args={[1.88, 0.2, 0.3]} />
                <meshStandardMaterial
                  color={cfg.color}
                  emissive={cfg.emissive}
                  emissiveIntensity={0.35}
                  roughness={0.4}
                />
              </mesh>
              {/* Glowing lantern spheres flanking archway */}
              {[-1.05, 1.05].map((lx, li) => (
                <group key={li} position={[lx, 0, 0.4]}>
                  <mesh position={[0, 0.5, 0]}>
                    <cylinderGeometry args={[0.04, 0.06, 1.0, 8]} />
                    <meshStandardMaterial color="#d8ccb8" roughness={0.75} />
                  </mesh>
                  <mesh position={[0, 1.08, 0]}>
                    <sphereGeometry args={[0.13, 14, 12]} />
                    <meshStandardMaterial
                      color={cfg.color}
                      emissive={cfg.color}
                      emissiveIntensity={0.85}
                      roughness={0.2}
                    />
                  </mesh>
                </group>
              ))}
            </group>
          </group>
        );
      })}

      {/* Framing garden trees */}
      {[
        [-6.2, 0, -2.5],
        [6.2, 0, -2.5],
        [-5.8, 0, 2.8],
        [5.8, 0, 2.8],
        [-2.2, 0, -9.5],
        [2.2, 0, -9.5],
      ].map(([tx, ty, tz], idx) => (
        <group key={idx} position={[tx, ty, tz]}>
          <mesh position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.12, 0.18, 1.7, 8]} />
            <meshStandardMaterial color="#6e4f3a" roughness={0.88} />
          </mesh>
          <mesh position={[0, 2.05, 0]}>
            <sphereGeometry args={[0.95, 14, 12]} />
            <meshStandardMaterial
              color={idx % 2 === 0 ? '#55945d' : '#64a468'}
              roughness={0.8}
            />
          </mesh>
        </group>
      ))}

      <InteractionSystem targets={targets} enabled={!chosen} />

      <PlayerController
        bounds={{ minX: -6.2, maxX: 6.2, minZ: -8.2, maxZ: 5.2 }}
        controlEnabled={!chosen}
      />
    </group>
  );
};
