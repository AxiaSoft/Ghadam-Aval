import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PlayerController, ObstacleCircle } from '../characters/PlayerController';
import { CameraRig } from '../camera/CameraRig';
import { InteractionSystem } from '../interaction/InteractionSystem';
import { useGameStore } from '../state/gameStore';
import { resetPlayerTransform } from '../state/inputStore';
import { InteractionTarget, MissionObjectChoice } from '../types/game';
import { assetManager } from '../assets/AssetManager';
import { audioManager } from '../audio/AudioManager';
import {
  CUTSCENE_MIN_DURATION_MS,
  getPersonalizedObjectMessage,
} from '../dialogue/dialogueData';

const PEDESTALS: {
  id: MissionObjectChoice;
  nodeName: string;
  label: string;
  sublabel: string;
  pos: [number, number, number];
  accent: string;
}[] = [
  {
    id: 'star',
    nodeName: 'GlassStar',
    label: 'ستاره شیشهای',
    sublabel: 'نور تویش میشکند',
    pos: [-2.7, 0, -2.4],
    accent: '#7ac7ff',
  },
  {
    id: 'flower',
    nodeName: 'BotanicalFlower',
    label: 'گل روی پایه',
    sublabel: 'یک برگش کمی افتاده',
    pos: [0, 0, -3.4],
    accent: '#f28da8',
  },
  {
    id: 'book',
    nodeName: 'StoryBook',
    label: 'کتاب باز',
    sublabel: 'صفحهای هنوز خط نخورده',
    pos: [2.7, 0, -2.4],
    accent: '#eab85c',
  },
];

export const MissionObjectScene: React.FC = () => {
  const { scene } = useThree();
  const graphicsProfile = useGameStore((s) => s.graphicsProfile);
  const answers = useGameStore((s) => s.answers);
  const chooseObject = useGameStore((s) => s.chooseObject);
  const setObjectiveHint = useGameStore((s) => s.setObjectiveHint);
  const setNarrativeCaption = useGameStore((s) => s.setNarrativeCaption);
  const setCinematicShot = useGameStore((s) => s.setCinematicShot);
  const transitionTo = useGameStore((s) => s.transitionTo);

  const [propsModel, setPropsModel] = useState<THREE.Object3D | null>(
    () => assetManager.getCached('mission_props') ?? null
  );
  const [interactingObj, setInteractingObj] = useState<MissionObjectChoice | null>(null);
  const interactingRef = useRef(false);
  const propFloatingRefs = useRef<Record<string, THREE.Group | null>>({});

  useEffect(() => {
    resetPlayerTransform([0, 0, 2.8], Math.PI, 0, 0.24);
    setCinematicShot(null);
    setObjectiveHint('روی سه تا پایه یک چیز گذاشته شده. یکی را که نگاهت روش ماند، بردار.');

    scene.background = new THREE.Color('#d9eeff');
    scene.fog = new THREE.FogExp2('#eef4fa', 0.024);

    if (!propsModel) {
      assetManager.loadAsset('mission_props').then((loaded) => {
        setPropsModel(loaded);
      });
    }

    return () => {
      setObjectiveHint(null);
    };
  }, [scene, propsModel, setCinematicShot, setObjectiveHint]);

  const extractedProps = useMemo(() => {
    const map: Record<MissionObjectChoice, THREE.Object3D | null> = {
      star: null,
      flower: null,
      book: null,
    };
    if (!propsModel) return map;
    PEDESTALS.forEach((p) => {
      const found = propsModel.getObjectByName(p.nodeName);
      if (found) {
        const clone = found.clone(true);
        clone.position.set(0, 0, 0);
        map[p.id] = clone;
      }
    });
    return map;
  }, [propsModel]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    PEDESTALS.forEach((p, idx) => {
      const holder = propFloatingRefs.current[p.id];
      if (holder) {
        holder.position.y = 0.96 + Math.sin(t * 1.8 + idx * 1.3) * 0.035;
        holder.rotation.y = t * (p.id === 'star' ? 0.65 : 0.28);
      }
    });
  });

  const handleInteractObject = useCallback(
    (p: (typeof PEDESTALS)[number]) => {
      if (interactingRef.current) return;
      interactingRef.current = true;
      setInteractingObj(p.id);
      chooseObject(p.id);
      setObjectiveHint(null);
      audioManager.playSfx('object_interact');

      const message = getPersonalizedObjectMessage(p.id, answers);
      setNarrativeCaption(message);

      // Cinematic camera movement focusing on both player and chosen pedestal object inside mobile frame
      setCinematicShot({
        position: [p.pos[0] + (p.pos[0] <= 0 ? 1.15 : -1.15), 1.52, p.pos[2] + 2.35],
        lookAt: [p.pos[0] * 0.9, 1.08, p.pos[2] + 0.35],
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
      PEDESTALS.map((p) => ({
        id: `obj_${p.id}`,
        label: p.label,
        sublabel: p.sublabel,
        position: [p.pos[0], 0, p.pos[2] + 0.85],
        radius: 1.45,
        accentColor: p.accent,
        onInteract: () => handleInteractObject(p),
      })),
    [handleInteractObject]
  );

  const obstacles = useMemo<ObstacleCircle[]>(
    () => PEDESTALS.map((p) => ({ x: p.pos[0], z: p.pos[2], radius: 0.52 })),
    []
  );

  const activePedestalPos = useMemo(() => {
    if (!interactingObj) return null;
    const found = PEDESTALS.find((p) => p.id === interactingObj);
    return found ? new THREE.Vector3(found.pos[0], 1.15, found.pos[2]) : null;
  }, [interactingObj]);

  return (
    <group>
      <CameraRig followDistance={3.4} followHeight={1.48} />

      <hemisphereLight args={['#fff8ec', '#678c62', 1.12]} />
      <directionalLight
        position={[-6, 10, 5]}
        intensity={1.9}
        color="#ffe0ad"
        castShadow={graphicsProfile !== 'LOW'}
        shadow-mapSize-width={graphicsProfile === 'HIGH' ? 2048 : 1024}
        shadow-mapSize-height={graphicsProfile === 'HIGH' ? 2048 : 1024}
      />

      {/* Sunlit garden grass & circular stone courtyard */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[26, 48]} />
        <meshStandardMaterial color="#6e9e67" roughness={0.9} />
      </mesh>

      {/* Rolling garden hills & framing trees for lush sanctuary depth */}
      {[
        [-13, -1.0, -18, 8.8, 3.4],
        [0, -1.2, -21, 11.5, 4.2],
        [13, -1.0, -18, 8.8, 3.4],
      ].map(([hx, hy, hz, sx, sy], idx) => (
        <mesh key={`m2hill-${idx}`} position={[hx, hy, hz]} scale={[sx, sy, 4.5]}>
          <sphereGeometry args={[1, 18, 12]} />
          <meshStandardMaterial color="#5c9264" roughness={0.92} />
        </mesh>
      ))}
      {[
        [-5.8, 0, -3.6],
        [5.8, 0, -3.6],
        [-5.4, 0, 1.8],
        [5.4, 0, 1.8],
      ].map(([tx, ty, tz], idx) => (
        <group key={`m2tree-${idx}`} position={[tx, ty, tz]}>
          <mesh position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.11, 0.17, 1.7, 8]} />
            <meshStandardMaterial color="#6d4f3b" roughness={0.88} />
          </mesh>
          <mesh position={[0, 2.05, 0]}>
            <sphereGeometry args={[0.92, 14, 12]} />
            <meshStandardMaterial color={idx % 2 === 0 ? '#52915b' : '#64a367'} roughness={0.8} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 0.02, -0.3]} receiveShadow>
        <cylinderGeometry args={[5.4, 5.6, 0.06, 44]} />
        <meshStandardMaterial color="#ece2d1" roughness={0.76} />
      </mesh>

      {/* Decorative colonnade pillars around sanctuary */}
      {[-4.2, -2.1, 0, 2.1, 4.2].map((x, idx) => (
        <group key={idx} position={[x, 0, -5.2]}>
          <mesh position={[0, 1.35, 0]} castShadow={graphicsProfile !== 'LOW'}>
            <cylinderGeometry args={[0.13, 0.16, 2.7, 14]} />
            <meshStandardMaterial color="#f2e9da" roughness={0.72} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 2.75, -5.2]}>
        <boxGeometry args={[9.2, 0.22, 0.42]} />
        <meshStandardMaterial color="#e8decb" roughness={0.74} />
      </mesh>

      {/* Three Sculpted Pedestals + GLB Interactive Objects */}
      {PEDESTALS.map((p) => {
        const propClone = extractedProps[p.id];
        return (
          <group key={p.id} position={p.pos}>
            {/* Pedestal column */}
            <mesh position={[0, 0.46, 0]} castShadow={graphicsProfile !== 'LOW'} receiveShadow>
              <cylinderGeometry args={[0.34, 0.42, 0.92, 20]} />
              <meshStandardMaterial color="#f4ede1" roughness={0.68} />
            </mesh>
            <mesh position={[0, 0.93, 0]}>
              <cylinderGeometry args={[0.38, 0.36, 0.06, 20]} />
              <meshStandardMaterial color={p.accent} roughness={0.4} metalness={0.2} />
            </mesh>

            {/* Loaded GLB 3D Prop (with safe geometric fallback while loading) */}
            <group
              ref={(el) => {
                propFloatingRefs.current[p.id] = el;
              }}
              position={[0, 0.96, 0]}
            >
              {propClone ? (
                <primitive object={propClone} />
              ) : (
                <mesh position={[0, 0.18, 0]}>
                  <octahedronGeometry args={[0.16, 1]} />
                  <meshStandardMaterial color={p.accent} roughness={0.25} />
                </mesh>
              )}
            </group>
          </group>
        );
      })}

      <InteractionSystem targets={targets} enabled={!interactingObj} />

      <PlayerController
        bounds={{ minX: -4.8, maxX: 4.8, minZ: -4.4, maxZ: 4.2 }}
        obstacles={obstacles}
        controlEnabled={!interactingObj}
        overridePose={interactingObj ? 'interact' : undefined}
        emotion={interactingObj ? 'warm_smile' : 'neutral'}
        gazeBehavior={interactingObj ? 'target' : 'forward'}
        gazeTarget={activePedestalPos}
      />
    </group>
  );
};
