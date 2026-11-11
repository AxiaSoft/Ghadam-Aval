import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { PlayerController, ObstacleCircle } from '../characters/PlayerController';
import { StylizedCharacter } from '../characters/StylizedCharacter';
import { CameraRig } from '../camera/CameraRig';
import { useSurfaceTexture } from '../graphics/useSurfaceTexture';
import { InteractionSystem } from '../interaction/InteractionSystem';
import { useGameStore } from '../state/gameStore';
import { resetPlayerTransform, transientInput } from '../state/inputStore';
import {
  CharacterEmotion,
  CharacterGazeBehavior,
  CharacterPose,
  InteractionTarget,
} from '../types/game';
import { audioManager } from '../audio/AudioManager';
import {
  CUTSCENE_CAPTIONS,
  CUTSCENE_MIN_DURATION_MS,
  CUTSCENE_MIN_DURATION_SEC,
} from '../dialogue/dialogueData';
import { PresentationBoard } from './UniversityProps';
import { PottedShrub } from './Vegetation';
import { DESK_ROWS_Z, DESK_COLS_X, classroomExitRoute } from './classroomRoutes';
import { ClassroomWalker, SlidingChair } from './ClassroomWalkers';

// Classroom Desk Layout: 4 Rows x 3 Columns (facing -Z toward whiteboard at z = -5.4)

// Male character seated near the middle of the classroom (Row 1 index = 2nd row, Center-Right col)
const MALE_DESK = { row: 1, col: 1 }; // [0.0, 0, -0.55] — dead center of classroom!
// Female player's empty chair: Row 3 (4th row), Left column [-2.2, 0, 2.95]
// Strictly NOT beside him and NOT directly in front of him — 2 rows back & 1 column left!
const PLAYER_EMPTY_DESK = { row: 3, col: 0 };

const OCCUPIED_STUDENT_DESKS = [
  { row: 0, col: 0 },
  { row: 0, col: 2 },
  { row: 1, col: 0 },
  { row: 2, col: 1 },
  { row: 2, col: 2 },
  { row: 3, col: 2 },
];

const CLASSROOM_INDOOR_CLAMP = {
  minX: -4.25,
  maxX: 4.25,
  minZ: -5.25,
  maxZ: 5.25,
  maxY: 3.15,
};

export const ClassroomScene: React.FC = () => {
  const floorTexture = useSurfaceTexture('wood', 3, 3);
  const foliageTexture = useSurfaceTexture('foliage', 1, 1);
  const wallTexture = useSurfaceTexture('plaster', 2, 2);
  const { scene } = useThree();
  const stage = useGameStore((s) => s.stage);
  const graphicsProfile = useGameStore((s) => s.graphicsProfile);
  const selectedPath = useGameStore((s) => s.selectedPath);
  const setObjectiveHint = useGameStore((s) => s.setObjectiveHint);
  const setNarrativeCaption = useGameStore((s) => s.setNarrativeCaption);
  const setCinematicShot = useGameStore((s) => s.setCinematicShot);
  const transitionTo = useGameStore((s) => s.transitionTo);

  // Male character dynamic animation states during CLASSROOM_CINEMATIC
  const [malePose, setMalePose] = useState<CharacterPose>('sit_attentive');
  const [maleGaze, setMaleGaze] = useState<CharacterGazeBehavior>('forward');
  const [maleEmotion, setMaleEmotion] = useState<CharacterEmotion>('thoughtful');
  const [femaleEmotion, setFemaleEmotion] = useState<CharacterEmotion>('neutral');
  const [classDismissed, setClassDismissed] = useState(false);
  const [playerExiting, setPlayerExiting] = useState(false);
  const [playerWaypoint, setPlayerWaypoint] = useState(1);
  const [playerHasExited, setPlayerHasExited] = useState(false);
  const [exitStudentCount, setExitStudentCount] = useState(6);
  const exitedCount = useRef(0);
  const exitExpected = useRef(0);
  const exitFinished = useRef(false);
  const playerRoute = useMemo(() => classroomExitRoute(PLAYER_EMPTY_DESK.row, PLAYER_EMPTY_DESK.col), []);
  const onActorExit = useCallback(() => {
    if (exitFinished.current) return;
    exitedCount.current += 1;
    if (exitedCount.current >= exitExpected.current) {
      exitFinished.current = true;
      setNarrativeCaption(null);
      transitionTo('LOBBY_ENTRY', { withFade: true });
    }
  }, [setNarrativeCaption, transitionTo]);
  const onPlayerReachWaypoint = useCallback(() => {
    if (playerWaypoint >= playerRoute.length - 1) { setPlayerHasExited(true); onActorExit(); }
    else setPlayerWaypoint(playerWaypoint + 1);
  }, [playerWaypoint, playerRoute, onActorExit]);

  const playerSeatPos = useMemo<[number, number, number]>(
    () => [DESK_COLS_X[PLAYER_EMPTY_DESK.col], 0, DESK_ROWS_Z[PLAYER_EMPTY_DESK.row] + 0.36],
    []
  );
  const maleSeatPos = useMemo<[number, number, number]>(
    () => [DESK_COLS_X[MALE_DESK.col], 0, DESK_ROWS_Z[MALE_DESK.row] + 0.36],
    []
  );
  const playerHeadWorld = useMemo(
    () => new THREE.Vector3(playerSeatPos[0], 1.32, playerSeatPos[2]),
    [playerSeatPos]
  );

  // Entry & Gameplay Setup
  useEffect(() => {
    scene.background = new THREE.Color('#eae2d6');
    scene.fog = new THREE.FogExp2('#efe7db', 0.015);
    transientInput.malePosition.set(maleSeatPos[0], 0, maleSeatPos[2]);
  }, [scene, maleSeatPos]);

  useEffect(() => {
    if (stage === 'CLASSROOM_ENTRY') {
      resetPlayerTransform([-2.95, 0, 3.85], 2.75, -0.48, 0.28);
      audioManager.playSfx('door_open');
      audioManager.playSfx('student_ambience');

      setCinematicShot({
        position: [-1.85, 1.88, 5.05],
        lookAt: [-1.05, 1.1, 1.05],
        fov: 50,
        duration: 2.0,
      });
      setNarrativeCaption(CUTSCENE_CAPTIONS.classroomEntry);

      const timer = window.setTimeout(() => {
        setCinematicShot(null);
        setNarrativeCaption(null);
        transitionTo('CLASSROOM_GAMEPLAY');
      }, CUTSCENE_MIN_DURATION_MS);
      return () => window.clearTimeout(timer);
    }

    if (stage === 'CLASSROOM_GAMEPLAY') {
      setCinematicShot(null);
      setObjectiveHint('ردیف آخر یک صندلی خالی هست. برگهات را بگذار و بشین.');
    }
  }, [stage, setCinematicShot, setNarrativeCaption, setObjectiveHint, transitionTo]);

  // Choreographed CLASSROOM CINEMATIC + CLASSROOM ENDING
  useEffect(() => {
    if (stage !== 'CLASSROOM_CINEMATIC') return;

    setObjectiveHint(null);
    audioManager.playSfx('chair_move');

    const beat = CUTSCENE_MIN_DURATION_SEC;
    const tl = gsap.timeline({ paused: useGameStore.getState().isPaused });
    const unsubPause = useGameStore.subscribe(state => tl.paused(state.isPaused));

    // Shot 1
    tl.call(() => {
      setFemaleEmotion('thoughtful');
      setCinematicShot({
        position: [playerSeatPos[0] + 1.15, 1.4, playerSeatPos[2] - 1.35],
        lookAt: [playerSeatPos[0], 1.16, playerSeatPos[2]],
        fov: 43,
        duration: 1.8,
      });
      setNarrativeCaption(CUTSCENE_CAPTIONS.classroomBeat1);
    }, [], 0);

    // Shot 2
    tl.call(() => {
      setMalePose('sit_nervous');
      setMaleEmotion('nervous');
      setMaleGaze('forward');
      setCinematicShot({
        position: [maleSeatPos[0] - 0.95, 1.4, maleSeatPos[2] - 1.35],
        lookAt: [maleSeatPos[0], 1.18, maleSeatPos[2]],
        fov: 41,
        duration: 1.9,
      });
      setNarrativeCaption(CUTSCENE_CAPTIONS.classroomBeat2);
    }, [], beat * 1);

    // Shot 3
    tl.call(() => {
      setMaleGaze('look_backward');
      setMaleEmotion('shy');
      setCinematicShot({
        position: [maleSeatPos[0] - 1.05, 1.38, maleSeatPos[2] - 0.55],
        lookAt: [maleSeatPos[0], 1.2, maleSeatPos[2]],
        fov: 40,
        duration: 1.6,
      });
      setNarrativeCaption(CUTSCENE_CAPTIONS.classroomBeat3);
    }, [], beat * 2);

    // Mid-beat reverse angle on Female noticing
    tl.call(() => {
      setFemaleEmotion('curious');
      setCinematicShot({
        position: [playerSeatPos[0] + 0.92, 1.36, playerSeatPos[2] - 1.25],
        lookAt: [playerSeatPos[0], 1.18, playerSeatPos[2]],
        fov: 42,
        duration: 1.3,
      });
    }, [], beat * 2 + beat * 0.52);

    // Shot 4
    tl.call(() => {
      setMaleGaze('look_away');
      setMaleEmotion('shy');
      setCinematicShot({
        position: [maleSeatPos[0] + 0.98, 1.4, maleSeatPos[2] - 1.25],
        lookAt: [maleSeatPos[0], 1.18, maleSeatPos[2]],
        fov: 41,
        duration: 1.5,
      });
      setNarrativeCaption(CUTSCENE_CAPTIONS.classroomBeat4);
    }, [], beat * 3);

    tl.call(() => {
      setMaleGaze('forward');
      setMalePose('sit_attentive');
      setMaleEmotion('thoughtful');
    }, [], beat * 3 + beat * 0.55);

    // Shot 5 — University Bell
    tl.call(() => {
      audioManager.playSfx('classroom_bell');
      setNarrativeCaption(CUTSCENE_CAPTIONS.classroomBeat5);
      setCinematicShot({
        position: [-1.65, 2.05, 4.35],
        lookAt: [-0.35, 1.12, -0.45],
        fov: 50,
        duration: 2.0,
      });
    }, [], beat * 4);

    // Shot 6 — Students Leaving & His Hesitation
    tl.call(() => {
      audioManager.playSfx('chair_move');
      audioManager.playSfx('student_ambience');
      setClassDismissed(true);
      exitedCount.current = 0;
      exitFinished.current = false;
      const count = useGameStore.getState().graphicsProfile === 'LOW' ? 4 : 6;
      setExitStudentCount(count);
      exitExpected.current = count + 2;
      setPlayerWaypoint(1);
      setPlayerHasExited(false);
      setMalePose('idle');
      setMaleEmotion('hopeful');
      setMaleGaze('look_backward');
      setNarrativeCaption(null);
      setCinematicShot({
        position: [-0.4, 2.9, 5.1],
        lookAt: [-0.4, 0.9, 0.6],
        fov: 57,
        duration: 2.0,
      });
    }, [], beat * 5);

    // Let chairs slide clear before anyone begins to walk.
    tl.call(() => setPlayerExiting(true), [], beat * 5 + 1.0);

    return () => {
      tl.kill();
      unsubPause();
    };
  }, [stage, maleSeatPos, playerSeatPos, setCinematicShot, setNarrativeCaption, setObjectiveHint, transitionTo]);

  const handleSelectEmptyChair = useCallback(() => {
    if (stage !== 'CLASSROOM_GAMEPLAY') return;
    transitionTo('CLASSROOM_CINEMATIC');
  }, [stage, transitionTo]);

  const targets = useMemo<InteractionTarget[]>(
    () => [
      {
        id: 'classroom_empty_seat',
        label: 'نشستن ردیف آخر',
        sublabel: 'کنار برگهای که خط آخرش خالی است',
        position: [playerSeatPos[0], 0, playerSeatPos[2]],
        radius: 1.25,
        accentColor: '#f4c76c',
        onInteract: handleSelectEmptyChair,
      },
    ],
    [playerSeatPos, handleSelectEmptyChair]
  );

  // Desk obstacles during gameplay
  const obstacles = useMemo<ObstacleCircle[]>(() => {
    const list: ObstacleCircle[] = [];
    DESK_ROWS_Z.forEach((rz, rIdx) => {
      DESK_COLS_X.forEach((cx, cIdx) => {
        if (rIdx === PLAYER_EMPTY_DESK.row && cIdx === PLAYER_EMPTY_DESK.col) {
          // Only desk front is obstacle so player can step up to chair
          list.push({ x: cx, z: rz - 0.18, radius: 0.44 });
        } else {
          list.push({ x: cx, z: rz + 0.05, radius: 0.58 });
        }
      });
    });
    return list;
  }, []);

  const notebookColor =
    selectedPath === 'blue' ? '#4c94e6' : selectedPath === 'pink' ? '#ea7fa2' : '#ebb64b';

  const isSeatedStage = stage === 'CLASSROOM_CINEMATIC' && !playerExiting;

  return (
    <group>
      <CameraRig
        followDistance={2.8}
        followHeight={1.45}
        indoorClamp={CLASSROOM_INDOOR_CLAMP}
      />

      {/* Warm sunlit classroom interior lighting */}
      <hemisphereLight args={['#fff8eb', '#9c8c78', 0.98]} />
      <directionalLight
        position={[-7, 6.5, 1.5]}
        intensity={1.75}
        color="#ffe2ad"
        castShadow={graphicsProfile !== 'LOW'}
        shadow-mapSize-width={graphicsProfile === 'HIGH' ? 2048 : 1024}
        shadow-mapSize-height={graphicsProfile === 'HIGH' ? 2048 : 1024}
      />
      <pointLight position={[0, 3.1, -1.5]} intensity={0.45} color="#fff2d9" />

      {/* Warm Wood Parquet Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9.4, 11.4]} />
        <meshStandardMaterial color="#c9a57c" map={floorTexture} roughness={0.72} />
      </mesh>

      {/* Ceiling & Walls */}
      <mesh position={[0, 3.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9.4, 11.4]} />
        <meshStandardMaterial color="#f6f1e7" roughness={0.9} />
      </mesh>
      {/* Front Wall with Whiteboard */}
      <mesh position={[0, 1.78, -5.65]} receiveShadow>
        <boxGeometry args={[9.4, 3.6, 0.18]} />
        <meshStandardMaterial color="#ede5d8" map={wallTexture} roughness={0.85} />
      </mesh>
      {/* Back Wall */}
      <mesh position={[0, 1.78, 5.65]}>
        <boxGeometry args={[9.4, 3.6, 0.18]} />
        <meshStandardMaterial color="#e8dfd1" roughness={0.85} />
      </mesh>
      {/* Right Wall with Bookcase & Framed Posters */}
      <mesh position={[4.65, 1.78, 0]}>
        <boxGeometry args={[0.18, 3.6, 11.4]} />
        <meshStandardMaterial color="#ebe2d4" roughness={0.85} />
      </mesh>
      {/* Left Wall with Tall Sunlit Windows + Classroom Entry Door at rear-left */}
      <mesh position={[-4.65, 0.52, -0.8]}>
        <boxGeometry args={[0.2, 1.05, 9.2]} />
        <meshStandardMaterial color="#e6dccd" roughness={0.82} />
      </mesh>
      <mesh position={[-4.65, 3.2, 0]}>
        <boxGeometry args={[0.2, 0.72, 11.4]} />
        <meshStandardMaterial color="#e6dccd" roughness={0.82} />
      </mesh>
      {[-3.8, -1.2, 1.4].map((wz, idx) => (
        <group key={idx} position={[-4.62, 1.92, wz]}>
          <mesh>
            <boxGeometry args={[0.22, 1.85, 0.24]} />
            <meshStandardMaterial color="#dfd4c3" roughness={0.78} />
          </mesh>
          <mesh position={[0.04, 0, 1.15]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[2.1, 1.72]} />
            <meshBasicMaterial color="#e6f5ff" transparent opacity={0.45} />
          </mesh>
          {/* Warm sunlight patch on floor */}
          <mesh position={[1.7, -1.9, 1.15]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.1, 1.7]} />
            <meshBasicMaterial color="#fff3cf" transparent opacity={0.22} />
          </mesh>
        </group>
      ))}

      {/* Classroom Door (rear-left) */}
      <group position={[-4.55, 1.2, 4.35]}>
        <mesh>
          <boxGeometry args={[0.1, 2.35, 1.12]} />
          <meshStandardMaterial color="#704932" roughness={0.62} />
        </mesh>
      </group>

      {/* فهرست ارائهها روی تخته */}
      <PresentationBoard position={[0, 1.88, -5.44]} />

      {/* Teacher's Desk & Packing Teacher */}
      <group position={[1.65, 0, -4.15]}>
        <mesh position={[0, 0.74, 0]} castShadow={graphicsProfile !== 'LOW'}>
          <boxGeometry args={[1.65, 0.07, 0.78]} />
          <meshStandardMaterial color="#7d5338" roughness={0.65} />
        </mesh>
        <mesh position={[-0.72, 0.36, 0]}>
          <boxGeometry args={[0.12, 0.72, 0.7]} />
          <meshStandardMaterial color="#5e3e29" roughness={0.7} />
        </mesh>
        <mesh position={[0.72, 0.36, 0]}>
          <boxGeometry args={[0.12, 0.72, 0.7]} />
          <meshStandardMaterial color="#5e3e29" roughness={0.7} />
        </mesh>
        {/* Stack of books on teacher's desk */}
        <mesh position={[-0.42, 0.81, 0.1]}>
          <boxGeometry args={[0.26, 0.09, 0.34]} />
          <meshStandardMaterial color="#3c5a78" roughness={0.65} />
        </mesh>
        <StylizedCharacter
          kind="student"
          position={[0, 0, -0.52]}
          rotationY={classDismissed ? 0.5 : 0}
          pose={classDismissed ? 'interact' : 'talk'}
          tintTop="#524a44"
          phaseOffset={0.15}
        />
      </group>

      {/* Potted Plant & Bookshelf Decorations */}
      <PottedShrub position={[4.1, 0, -4.6]} leafTexture={foliageTexture} lowDetail={graphicsProfile === 'LOW'} />

      {/* 12 Student Desks & Chairs */}
      {DESK_ROWS_Z.map((rz, rIdx) =>
        DESK_COLS_X.map((cx, cIdx) => {
          const isPlayerDesk =
            rIdx === PLAYER_EMPTY_DESK.row && cIdx === PLAYER_EMPTY_DESK.col;
          const isMaleDesk = rIdx === MALE_DESK.row && cIdx === MALE_DESK.col;

          return (
            <group key={`${rIdx}-${cIdx}`} position={[cx, 0, rz]}>
              {/* Desk tabletop */}
              <mesh position={[0, 0.71, -0.14]} castShadow={graphicsProfile !== 'LOW'} receiveShadow>
                <boxGeometry args={[1.05, 0.05, 0.56]} />
                <meshStandardMaterial
                  color={isPlayerDesk ? '#dfb98f' : '#d2ab80'}
                  map={floorTexture}
                  roughness={0.72}
                />
              </mesh>
              {/* Metal desk legs */}
              {[-0.46, 0.46].map((lx, li) => (
                <mesh key={li} position={[lx, 0.35, -0.14]}>
                  <boxGeometry args={[0.045, 0.7, 0.5]} />
                  <meshStandardMaterial color="#414852" roughness={0.5} metalness={0.4} />
                </mesh>
              ))}

              {/* Notebook on desk */}
              {(isMaleDesk || (isPlayerDesk && stage === 'CLASSROOM_CINEMATIC') || (rIdx + cIdx) % 2 === 0) && (
                <mesh position={[0.05, 0.745, -0.12]} rotation={[0, 0.08, 0]}>
                  <boxGeometry args={[0.26, 0.02, 0.34]} />
                  <meshStandardMaterial
                    color={isPlayerDesk ? notebookColor : isMaleDesk ? '#e8e2d5' : '#cfd3d8'}
                    roughness={0.7}
                  />
                </mesh>
              )}

              {/* Chair (slides back naturally when class ends!) */}
              <SlidingChair dismissed={classDismissed}>
                <mesh position={[0, 0.44, 0]}>
                  <boxGeometry args={[0.46, 0.045, 0.44]} />
                  <meshStandardMaterial color="#8c6245" roughness={0.68} />
                </mesh>
                <mesh position={[0, 0.68, 0.2]}>
                  <boxGeometry args={[0.44, 0.34, 0.04]} />
                  <meshStandardMaterial color="#8c6245" roughness={0.68} />
                </mesh>
                {[-0.19, 0.19].map((lx, li) => (
                  <mesh key={li} position={[lx, 0.22, 0]}>
                    <boxGeometry args={[0.04, 0.44, 0.4]} />
                    <meshStandardMaterial color="#3c424b" roughness={0.55} />
                  </mesh>
                ))}
              </SlidingChair>
            </group>
          );
        })
      )}

      {/* Each seated character follows a clear aisle towards the doorway. */}
      {OCCUPIED_STUDENT_DESKS.slice(0, classDismissed ? exitStudentCount : graphicsProfile === 'LOW' ? 4 : 6).map((d, idx) => (
        <ClassroomWalker key={idx} row={d.row} col={d.col} exiting={playerExiting}
          delay={(3 - d.row) * 0.7 + d.col * 0.2} onExit={onActorExit}
          kind={idx % 2 === 0 && (graphicsProfile !== 'LOW' || idx === 0) ? 'student_female' : 'student'}
          rotationY={Math.PI} pose="sit" tintTop={['#7d7178', '#697b80', '#897f70', '#677867'][idx % 4]}
          phaseOffset={idx * 0.27} />
      ))}
      <ClassroomWalker row={MALE_DESK.row} col={MALE_DESK.col} exiting={playerExiting}
        delay={1.8} onExit={onActorExit} kind="male" rotationY={Math.PI} pose={malePose}
        emotion={maleEmotion} gazeBehavior={playerExiting ? 'forward' : maleGaze}
        gazeTarget={playerHeadWorld} showPen={!classDismissed} phaseOffset={0.42} />

      {/* Empty Chair Proximity Marker during CLASSROOM_GAMEPLAY */}
      <InteractionSystem
        targets={targets}
        enabled={stage === 'CLASSROOM_GAMEPLAY'}
      />

      {/* CHARACTER A — Female Player Character with 3D Eyeglasses */}
      <group visible={!playerHasExited}>
      <PlayerController
        bounds={{ minX: -4.0, maxX: 4.0, minZ: -3.2, maxZ: 4.8 }}
        obstacles={obstacles}
        controlEnabled={stage === 'CLASSROOM_GAMEPLAY'}
        overridePosition={isSeatedStage ? playerSeatPos : null}
        overrideRotationY={isSeatedStage ? Math.PI : null}
        overridePose={isSeatedStage ? 'sit_attentive' : undefined}
        emotion={femaleEmotion}
        autoWalkTarget={playerExiting && playerWaypoint < playerRoute.length ? new THREE.Vector3(playerRoute[playerWaypoint].x, 0, playerRoute[playerWaypoint].z) : null}
        onReachAutoWalkTarget={onPlayerReachWaypoint}
        autoWalkAlignBeforeMove
      />
      </group>
    </group>
  );
};
