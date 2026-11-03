import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { StylizedCharacter } from '../characters/StylizedCharacter';
import { CameraRig } from '../camera/CameraRig';
import { useGameStore } from '../state/gameStore';
import { assetManager } from '../assets/AssetManager';
import {
  CUTSCENE_CAPTIONS,
  CUTSCENE_MIN_DURATION_SEC,
} from '../dialogue/dialogueData';

const COLD_SKY = new THREE.Color('#232934');
const WARM_SKY = new THREE.Color('#cbe6ff');
const COLD_FOG = new THREE.Color('#2c3340');
const WARM_FOG = new THREE.Color('#f7e8d0');

const COLD_GROUND = new THREE.Color('#3b404a');
const WARM_GROUND = new THREE.Color('#6f9e66');
const COLD_STONE = new THREE.Color('#5c6370');
const WARM_STONE = new THREE.Color('#ebe0cc');
const COLD_TREE = new THREE.Color('#484e59');
const WARM_TREE = new THREE.Color('#4f9159');
const COLD_BLOSSOM = new THREE.Color('#616774');
const WARM_BLOSSOM = new THREE.Color('#f494ab');
const COLD_HILL = new THREE.Color('#323843');
const WARM_HILL = new THREE.Color('#5a8b62');

export const ColdWorldAndTransformScene: React.FC = () => {
  const { scene, size } = useThree();
  const isMobilePortrait = size.width < size.height * 1.05 || size.width < 680;
  const stage = useGameStore((s) => s.stage);
  const questionnaireIndex = useGameStore((s) => s.questionnaireIndex);
  const answers = useGameStore((s) => s.answers);
  const graphicsProfile = useGameStore((s) => s.graphicsProfile);
  const setCinematicShot = useGameStore((s) => s.setCinematicShot);
  const setWorldWarmth = useGameStore((s) => s.setWorldWarmth);
  const setNarrativeCaption = useGameStore((s) => s.setNarrativeCaption);
  const transitionTo = useGameStore((s) => s.transitionTo);

  const warmthRef = useRef(0);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const treesGroupRef = useRef<THREE.Group>(null);

  // Shared materials so EVERY tree, archway, hill, and blossom transforms in unison
  const sharedMats = useMemo(
    () => ({
      ground: new THREE.MeshStandardMaterial({ color: COLD_GROUND.clone(), roughness: 0.92 }),
      stone: new THREE.MeshStandardMaterial({ color: COLD_STONE.clone(), roughness: 0.76 }),
      trunk: new THREE.MeshStandardMaterial({ color: '#4d433d', roughness: 0.9 }),
      tree: new THREE.MeshStandardMaterial({ color: COLD_TREE.clone(), roughness: 0.8 }),
      blossom: new THREE.MeshStandardMaterial({ color: COLD_BLOSSOM.clone(), roughness: 0.78 }),
      hill: new THREE.MeshStandardMaterial({ color: COLD_HILL.clone(), roughness: 0.94 }),
    }),
    []
  );

  useEffect(() => {
    return () => {
      Object.values(sharedMats).forEach((m) => m.dispose());
    };
  }, [sharedMats]);

  useEffect(() => {
    if (stage === 'QUESTIONNAIRE') {
      assetManager.preloadSecondaryAssets();
    }
  }, [stage]);

  useEffect(() => {
    // در موبایل عمودی یا باریک، کاراکتر دقیقاً در مرکز قاب بالای کارت قرار می‌گیرد تا هرگز از کادر بیرون نرود
    const sideOffsetX = isMobilePortrait ? 0 : -0.46;
    const camPosX = isMobilePortrait ? 0 : -0.52;

    if (stage === 'INTRO') {
      warmthRef.current = 0;
      setWorldWarmth(0);
      setCinematicShot({
        position: [camPosX, 1.42, 2.52],
        lookAt: [sideOffsetX, 1.24, 0],
        fov: 45,
        duration: 0.4,
      });
    } else if (stage === 'QUESTIONNAIRE') {
      const shots = isMobilePortrait
        ? [
            { position: [0.0, 1.42, 2.48] as [number, number, number], lookAt: [0.0, 1.24, 0] as [number, number, number], fov: 45 },
            { position: [-0.14, 1.45, 2.55] as [number, number, number], lookAt: [0.0, 1.23, 0] as [number, number, number], fov: 45 },
            { position: [0.14, 1.48, 2.6] as [number, number, number], lookAt: [0.0, 1.22, -0.05] as [number, number, number], fov: 46 },
            { position: [-0.08, 1.4, 2.42] as [number, number, number], lookAt: [0.0, 1.25, 0] as [number, number, number], fov: 44 },
          ]
        : [
            { position: [-0.48, 1.42, 2.48] as [number, number, number], lookAt: [-0.44, 1.24, 0] as [number, number, number], fov: 44 },
            { position: [-0.6, 1.46, 2.56] as [number, number, number], lookAt: [-0.44, 1.23, 0] as [number, number, number], fov: 45 },
            { position: [-0.42, 1.5, 2.62] as [number, number, number], lookAt: [-0.46, 1.22, -0.08] as [number, number, number], fov: 45 },
            { position: [-0.54, 1.4, 2.4] as [number, number, number], lookAt: [-0.42, 1.26, 0] as [number, number, number], fov: 43 },
          ];
      const shot = shots[questionnaireIndex % shots.length];
      setCinematicShot({ ...shot, duration: 1.1 });
    } else if (stage === 'RELATIONSHIP_QUESTION') {
      setCinematicShot({
        position: [camPosX, 1.42, 2.45],
        lookAt: [sideOffsetX, 1.24, 0],
        fov: 44,
        duration: 1.1,
      });
    } else if (stage === 'RESPECTFUL_ENDING') {
      setCinematicShot({
        position: [0.0, 1.78, 3.65],
        lookAt: [0, 1.18, 0],
        fov: 46,
        duration: 2.2,
      });
    }
  }, [stage, questionnaireIndex, isMobilePortrait, setCinematicShot, setWorldWarmth]);

  // Choreographed WORLD TRANSFORMATION sequence (minimum 10.5s reading time)
  useEffect(() => {
    if (stage !== 'WORLD_TRANSFORMATION') return;

    const proxy = { w: 0 };
    setNarrativeCaption(CUTSCENE_CAPTIONS.worldTransform);

    setCinematicShot({
      position: [-1.15, 1.44, 2.15],
      lookAt: [0, 1.42, 0],
      fov: 42,
      duration: Math.min(2.2, CUTSCENE_MIN_DURATION_SEC * 0.45),
    });

    const tl = gsap.timeline();
    tl.to(proxy, {
      w: 1,
      duration: Math.max(1.5, CUTSCENE_MIN_DURATION_SEC - 0.4),
      ease: 'power2.inOut',
      onUpdate: () => {
        warmthRef.current = proxy.w;
        setWorldWarmth(proxy.w);
      },
    });

    tl.call(
      () => {
        setCinematicShot({
          position: [1.35, 1.65, 2.85],
          lookAt: [0, 1.38, -0.4],
          fov: 46,
          duration: Math.min(2.6, CUTSCENE_MIN_DURATION_SEC * 0.52),
        });
      },
      [],
      CUTSCENE_MIN_DURATION_SEC * 0.45
    );

    tl.call(
      () => {
        setNarrativeCaption(null);
        transitionTo('MISSION_1', { withFade: true });
      },
      [],
      CUTSCENE_MIN_DURATION_SEC
    );

    return () => {
      tl.kill();
    };
  }, [stage, setCinematicShot, setWorldWarmth, setNarrativeCaption, transitionTo]);

  const treePlacements = useMemo(
    () => [
      { pos: [-3.8, 0, -3.2] as [number, number, number], s: 1.15 },
      { pos: [3.9, 0, -3.4] as [number, number, number], s: 1.22 },
      { pos: [-5.2, 0, 0.5] as [number, number, number], s: 0.95 },
      { pos: [5.1, 0, 0.8] as [number, number, number], s: 1.05 },
      { pos: [-2.4, 0, -5.8] as [number, number, number], s: 1.35 },
      { pos: [2.5, 0, -6.1] as [number, number, number], s: 1.28 },
      { pos: [0.0, 0, -7.6] as [number, number, number], s: 1.4 },
    ],
    []
  );

  const particlePositions = useMemo(() => {
    const count = graphicsProfile === 'LOW' ? 24 : graphicsProfile === 'MEDIUM' ? 55 : 90;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = 0.3 + Math.random() * 4.0;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10 - 1.5;
    }
    return arr;
  }, [graphicsProfile]);

  const tmpSky = useMemo(() => new THREE.Color(), []);
  const tmpFog = useMemo(() => new THREE.Color(), []);
  const warmAccentTarget = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const w = warmthRef.current;
    const t = state.clock.elapsedTime;

    tmpSky.copy(COLD_SKY).lerp(WARM_SKY, w);
    tmpFog.copy(COLD_FOG).lerp(WARM_FOG, w);

    scene.background = tmpSky;
    if (!scene.fog || !(scene.fog as THREE.FogExp2).isFogExp2) {
      scene.fog = new THREE.FogExp2(tmpFog.getHex(), 0.055);
    } else {
      const fog = scene.fog as THREE.FogExp2;
      fog.color.copy(tmpFog);
      fog.density = THREE.MathUtils.lerp(0.058, 0.022, w);
    }

    if (dirLightRef.current) {
      dirLightRef.current.intensity = THREE.MathUtils.lerp(0.72, 2.15, w);
      dirLightRef.current.color.set('#9fb0c8').lerp(new THREE.Color('#ffd596'), w);
    }
    if (hemiLightRef.current) {
      hemiLightRef.current.intensity = THREE.MathUtils.lerp(0.75, 1.18, w);
      hemiLightRef.current.color.set('#8f9cb0').lerp(new THREE.Color('#fff5e4'), w);
      hemiLightRef.current.groundColor.set('#343944').lerp(new THREE.Color('#5e7d58'), w);
    }

    warmAccentTarget.copy(
      answers.atmosphere === 'flowers_gardens' ? WARM_BLOSSOM : new THREE.Color('#66ab68')
    );

    sharedMats.ground.color.copy(COLD_GROUND).lerp(WARM_GROUND, w);
    sharedMats.stone.color.copy(COLD_STONE).lerp(WARM_STONE, w);
    sharedMats.tree.color.copy(COLD_TREE).lerp(WARM_TREE, w);
    sharedMats.blossom.color.copy(COLD_BLOSSOM).lerp(warmAccentTarget, w);
    sharedMats.hill.color.copy(COLD_HILL).lerp(WARM_HILL, w);

    if (treesGroupRef.current) {
      treesGroupRef.current.children.forEach((child, idx) => {
        child.rotation.z = Math.sin(t * (0.6 + w * 0.9) + idx) * (0.006 + w * 0.025);
      });
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.06;
      particlesRef.current.position.y = Math.sin(t * 0.5) * 0.18;
      const mat = particlesRef.current.material as THREE.PointsMaterial;
      mat.opacity = w * 0.78;
    }
  });

  const isTransforming = stage === 'WORLD_TRANSFORMATION';

  return (
    <group>
      <CameraRig />

      <hemisphereLight ref={hemiLightRef} args={['#8f9cb0', '#343944', 0.75]} />
      <directionalLight
        ref={dirLightRef}
        position={[4.5, 7.5, 5.5]}
        intensity={0.72}
        castShadow={graphicsProfile !== 'LOW'}
        shadow-mapSize-width={graphicsProfile === 'HIGH' ? 2048 : 1024}
        shadow-mapSize-height={graphicsProfile === 'HIGH' ? 2048 : 1024}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <pointLight position={[0.25, 1.68, 1.85]} intensity={1.05} distance={6} color="#e6eefc" />

      {/* Ground terrain */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
        material={sharedMats.ground}
      >
        <circleGeometry args={[30, 48]} />
      </mesh>

      {/* Distant stylized rolling hills along horizon */}
      {[
        [-11, -0.8, -16, 7.5, 3.2],
        [0, -0.9, -18, 9.5, 3.8],
        [11, -0.8, -15, 7.8, 3.1],
      ].map(([hx, hy, hz, rx, ry], idx) => (
        <mesh key={idx} position={[hx, hy, hz]} scale={[rx, ry, 4.5]} material={sharedMats.hill}>
          <sphereGeometry args={[1, 18, 12]} />
        </mesh>
      ))}

      {/* Sculpted circular stone terrace */}
      <mesh position={[0, 0.02, 0]} receiveShadow material={sharedMats.stone}>
        <cylinderGeometry args={[2.35, 2.55, 0.08, 36]} />
      </mesh>

      {/* Architectural stone archways */}
      {[-2.8, 0, 2.8].map((x, idx) => (
        <group key={idx} position={[x, 0, -4.4 - Math.abs(x) * 0.25]} rotation={[0, -x * 0.12, 0]}>
          <mesh position={[-0.55, 1.2, 0]} material={sharedMats.stone}>
            <cylinderGeometry args={[0.11, 0.13, 2.4, 12]} />
          </mesh>
          <mesh position={[0.55, 1.2, 0]} material={sharedMats.stone}>
            <cylinderGeometry args={[0.11, 0.13, 2.4, 12]} />
          </mesh>
          <mesh position={[0, 2.42, 0]} material={sharedMats.stone}>
            <boxGeometry args={[1.38, 0.16, 0.28]} />
          </mesh>
        </group>
      ))}

      {/* Stylized trees */}
      <group ref={treesGroupRef}>
        {treePlacements.map((item, idx) => (
          <group key={idx} position={item.pos} scale={item.s}>
            <mesh position={[0, 0.75, 0]} material={sharedMats.trunk}>
              <cylinderGeometry args={[0.1, 0.16, 1.5, 8]} />
            </mesh>
            <mesh position={[0, 1.85, 0]} material={sharedMats.tree}>
              <sphereGeometry args={[0.82, 14, 12]} />
            </mesh>
            <mesh position={[0.35, 2.25, 0.15]} material={sharedMats.blossom}>
              <sphereGeometry args={[0.56, 12, 10]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Female Protagonist wearing her 3D glasses */}
      <StylizedCharacter
        kind="female"
        position={[0, 0.06, 0]}
        rotationY={0.22}
        pose="idle"
        emotion={isTransforming ? 'hopeful' : stage === 'QUESTIONNAIRE' ? 'thoughtful' : 'neutral'}
        gazeBehavior={isTransforming ? 'wonder_up' : 'forward'}
      />

      {/* Warm golden dust motes during transformation */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#ffe29e"
          size={0.075}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </points>
    </group>
  );
};
