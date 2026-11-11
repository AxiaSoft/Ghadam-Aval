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
import {
  applyCorridorWarmth,
  CorridorShell,
  PrinterCorner,
  WindowBench,
} from './UniversityProps';

const COLD_SKY = new THREE.Color('#252a33');
const WARM_SKY = new THREE.Color('#e4edf3');
const COLD_FOG = new THREE.Color('#2c313a');
const WARM_FOG = new THREE.Color('#ece3d5');

export const ColdWorldAndTransformScene: React.FC = () => {
  const { scene, size } = useThree();
  const isMobilePortrait = size.width < size.height * 1.05 || size.width < 680;
  const stage = useGameStore((s) => s.stage);
  const questionnaireIndex = useGameStore((s) => s.questionnaireIndex);
  const graphicsProfile = useGameStore((s) => s.graphicsProfile);
  const setCinematicShot = useGameStore((s) => s.setCinematicShot);
  const setWorldWarmth = useGameStore((s) => s.setWorldWarmth);
  const setNarrativeCaption = useGameStore((s) => s.setNarrativeCaption);
  const transitionTo = useGameStore((s) => s.transitionTo);

  const warmthRef = useRef(0);
  const corridorRef = useRef<THREE.Group>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const particlesRef = useRef<THREE.Points>(null);

  useEffect(() => {
    if (stage === 'QUESTIONNAIRE') {
      assetManager.preloadSecondaryAssets();
    }
  }, [stage]);

  useEffect(() => {
    // در موبایل عمودی یا باریک، کاراکتر دقیقاً در مرکز قاب بالای کارت قرار میگیرد.
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

  // تبدیل راهروی خاکستری به همان راهرو، ولی روشن و رنگدار
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

  const particlePositions = useMemo(() => {
    const count = graphicsProfile === 'LOW' ? 30 : graphicsProfile === 'MEDIUM' ? 65 : 105;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 1] = 0.4 + Math.random() * 2.8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 9 - 1.5;
    }
    return arr;
  }, [graphicsProfile]);

  const tmpSky = useMemo(() => new THREE.Color(), []);
  const tmpFog = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const w = warmthRef.current;
    const t = state.clock.elapsedTime;

    tmpSky.copy(COLD_SKY).lerp(WARM_SKY, w);
    tmpFog.copy(COLD_FOG).lerp(WARM_FOG, w);

    scene.background = tmpSky;
    if (!scene.fog || !(scene.fog as THREE.FogExp2).isFogExp2) {
      scene.fog = new THREE.FogExp2(tmpFog.getHex(), 0.05);
    } else {
      const fog = scene.fog as THREE.FogExp2;
      fog.color.copy(tmpFog);
      fog.density = THREE.MathUtils.lerp(0.055, 0.02, w);
    }

    applyCorridorWarmth(corridorRef.current, w);

    if (dirLightRef.current) {
      dirLightRef.current.intensity = THREE.MathUtils.lerp(0.7, 1.85, w);
      dirLightRef.current.color.set('#9fb0c8').lerp(new THREE.Color('#ffe0b0'), w);
    }
    if (hemiLightRef.current) {
      hemiLightRef.current.intensity = THREE.MathUtils.lerp(0.72, 1.15, w);
      hemiLightRef.current.color.set('#8f9cb0').lerp(new THREE.Color('#fff5e4'), w);
      hemiLightRef.current.groundColor.set('#343944').lerp(new THREE.Color('#b9a88e'), w);
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.012;
      particlesRef.current.position.y = Math.sin(t * 0.4) * 0.08;
      const mat = particlesRef.current.material as THREE.PointsMaterial;
      mat.opacity = 0.06 + w * 0.32;
    }
  });

  const isTransforming = stage === 'WORLD_TRANSFORMATION';

  return (
    <group>
      <CameraRig indoorClamp={{ minX: -3.05, maxX: 3.05, minZ: -9.55, maxZ: 5.55, maxY: 3.15 }} />

      <hemisphereLight ref={hemiLightRef} args={['#8f9cb0', '#343944', 0.72]} />
      <directionalLight
        ref={dirLightRef}
        position={[3.5, 6.5, 4.5]}
        intensity={0.7}
        castShadow={graphicsProfile !== 'LOW'}
        shadow-mapSize-width={graphicsProfile === 'HIGH' ? 2048 : 1024}
        shadow-mapSize-height={graphicsProfile === 'HIGH' ? 2048 : 1024}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <pointLight position={[0.25, 2.6, 1.2]} intensity={0.9} distance={7} color="#fff0d4" />

      <group ref={corridorRef}>
        <CorridorShell initialWarmth={0} />
        <PrinterCorner position={[0, 0, -6.4]} initialWarmth={0} />
        <WindowBench position={[2.7, 0, 1.2]} rotationY={-Math.PI / 2} initialWarmth={0} />
      </group>

      <StylizedCharacter
        kind="female"
        position={[0, 0.06, 0]}
        rotationY={0.18}
        pose="idle"
        emotion={isTransforming ? 'curious' : stage === 'QUESTIONNAIRE' ? 'thoughtful' : 'neutral'}
        gazeBehavior={isTransforming ? 'forward' : 'down_shy'}
        showPen
      />

      {/* گرد ریز توی نور مهتابی */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#ffe6b8"
          size={0.045}
          transparent
          opacity={0.08}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
};
