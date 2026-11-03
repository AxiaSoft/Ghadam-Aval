import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { PlayerController, ObstacleCircle } from '../characters/PlayerController';
import { StylizedCharacter } from '../characters/StylizedCharacter';
import { CameraRig } from '../camera/CameraRig';
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
  DIALOGUE_NODES,
  DIALOGUE_START_NODE,
} from '../dialogue/dialogueData';

// چیدمان منسجم و روشن لابی تا تمام شخصیت‌ها هم در حالت عمودی موبایل و هم افقی کاملاً داخل کادر باشند
const MALE_SEAT_POS: [number, number, number] = [1.85, 0, 0.05];
const MALE_SEAT_ROT = -1.42;
const FEMALE_SEAT_POS: [number, number, number] = [-1.85, 0, 0.45];
const FEMALE_SEAT_ROT = 0.78; // روبه‌روی دوستش روی صندلی
const FEMALE_TABLE_POS: [number, number, number] = [-1.46, 0, 0.86];

// محل توقف در وسط فضای باز لابی هنگام رفتن دختر به سمت در خروجی و جلو آمدن پسر (زاویه سه‌رخ رو به دوربین و داخل کادر موبایل)
const LEAVE_DIALOGUE_FEMALE_POS: [number, number, number] = [-0.42, 0, 2.05];
const LEAVE_DIALOGUE_FEMALE_ROT = 1.32;
const LEAVE_DIALOGUE_MALE_POS: [number, number, number] = [0.46, 0, 1.95];
const LEAVE_DIALOGUE_MALE_ROT = -1.28;

const LOBBY_INDOOR_CLAMP = {
  minX: -6.8,
  maxX: 6.8,
  minZ: -5.4,
  maxZ: 6.2,
  maxY: 4.1,
};

// دانشجویان نشسته در لابی — همه دو‌به‌دو مشغول حرف زدن با کناری‌شان هستند جز پسر که تنها نشسته!
const SEATED_TALKING_PAIRS: {
  pos: [number, number, number];
  rot: number;
  tint: string;
  phase: number;
}[] = [
  // دوستِ شخصیت دختر که روبه‌رویش نشسته
  { pos: [-1.05, 0, 1.28], rot: -2.36, tint: '#7d7379', phase: 0.18 },
  // جفت دوم (چپِ عقب)
  { pos: [-3.15, 0, -2.15], rot: 1.15, tint: '#6f7882', phase: 0.35 },
  { pos: [-2.15, 0, -2.55], rot: -1.98, tint: '#807b74', phase: 0.52 },
  // جفت سوم (راستِ جلو — با همدیگر حرف می‌زنند، نه با پسر!)
  { pos: [2.25, 0, 2.15], rot: 0.75, tint: '#727b78', phase: 0.68 },
  { pos: [3.1, 0, 2.8], rot: -2.38, tint: '#7c7682', phase: 0.84 },
  // جفت چهارم (راستِ عقب)
  { pos: [2.05, 0, -2.45], rot: 1.92, tint: '#767d85', phase: 0.41 },
  { pos: [3.05, 0, -2.85], rot: -1.22, tint: '#827c75', phase: 0.93 },
];

export const LobbyAndEndingScene: React.FC = () => {
  const { scene } = useThree();
  const stage = useGameStore((s) => s.stage);
  const graphicsProfile = useGameStore((s) => s.graphicsProfile);
  const answers = useGameStore((s) => s.answers);
  const finalDecision = useGameStore((s) => s.finalDecision);
  const activeDialogueNodeId = useGameStore((s) => s.activeDialogueNodeId);
  const chooseFinalDecision = useGameStore((s) => s.chooseFinalDecision);
  const setActiveDialogueNode = useGameStore((s) => s.setActiveDialogueNode);
  const setObjectiveHint = useGameStore((s) => s.setObjectiveHint);
  const setNarrativeCaption = useGameStore((s) => s.setNarrativeCaption);
  const setCinematicShot = useGameStore((s) => s.setCinematicShot);
  const transitionTo = useGameStore((s) => s.transitionTo);

  const [femaleCinematicPose, setFemaleCinematicPose] = useState<CharacterPose>('talk');
  const [femaleCinematicEmotion, setFemaleCinematicEmotion] =
    useState<CharacterEmotion>('warm_smile');
  const [malePose, setMalePose] = useState<CharacterPose>('sit');
  const [maleSeated, setMaleSeated] = useState<boolean>(true);
  const [maleEmotion, setMaleEmotion] = useState<CharacterEmotion>('thoughtful');
  const [maleGaze, setMaleGaze] = useState<CharacterGazeBehavior>('forward');
  const [malePos, setMalePos] = useState<[number, number, number]>(MALE_SEAT_POS);
  const [maleRot, setMaleRot] = useState<number>(MALE_SEAT_ROT);
  const [leavingToExitAuto, setLeavingToExitAuto] = useState(false);

  const maleWalkRef = useRef<{
    active: boolean;
    progress: number;
    from: [number, number, number];
    to: [number, number, number];
  }>({
    active: false,
    progress: 0,
    from: MALE_SEAT_POS,
    to: LEAVE_DIALOGUE_MALE_POS,
  });
  const motesRef = useRef<THREE.Points>(null);

  const femaleSeatWorld = useMemo(
    () => new THREE.Vector3(FEMALE_SEAT_POS[0], 1.28, FEMALE_SEAT_POS[2]),
    []
  );
  const maleDialogHeadWorld = useMemo(
    () => new THREE.Vector3(LEAVE_DIALOGUE_MALE_POS[0], 1.48, LEAVE_DIALOGUE_MALE_POS[2]),
    []
  );
  const femaleDialogHeadWorld = useMemo(
    () => new THREE.Vector3(LEAVE_DIALOGUE_FEMALE_POS[0], 1.42, LEAVE_DIALOGUE_FEMALE_POS[2]),
    []
  );

  useEffect(() => {
    scene.background = new THREE.Color('#f5e6cf');
    scene.fog = new THREE.FogExp2('#f7ead6', 0.011);
    if (useGameStore.getState().stage === 'FINAL_DECISION') {
      // دوربین در راهروی میانی قرار می‌گیرد تا هم دختر، هم پسر و هم درِ خروجی کاملاً داخل کادر موبایل باشند
      resetPlayerTransform([-0.45, 0, -0.35], 0.18, -2.88, 0.28);
      setCinematicShot(null);
    }
  }, [scene, setCinematicShot]);

  useEffect(() => {
    if (stage === 'LOBBY_ENTRY') {
      audioManager.playSfx('lobby_ambience');
      transitionTo('LOBBY_CINEMATIC');
    }
  }, [stage, transitionTo]);

  // سکانس سینمایی لابی — تمام زوایای دوربین برای نمایش کامل کاراکترها در موبایل و دسکتاپ تنظیم شده‌اند
  useEffect(() => {
    if (stage !== 'LOBBY_CINEMATIC') return;

    setMalePos(MALE_SEAT_POS);
    setMaleRot(MALE_SEAT_ROT);
    setMaleSeated(true);
    setMalePose('sit');
    setMaleEmotion('thoughtful');
    setMaleGaze('forward');
    setFemaleCinematicPose('talk');
    setFemaleCinematicEmotion('warm_smile');

    const beat = CUTSCENE_MIN_DURATION_SEC;
    const tl = gsap.timeline();

    // ۱. نمای باز و کامل داخل لابی (نمایش هم‌زمان دختر و دوستش، پسر تنها و سایر جفت‌ها در کادر موبایل)
    tl.call(() => {
      setCinematicShot({
        position: [0.0, 2.45, 4.75],
        lookAt: [0.0, 0.98, 0.05],
        fov: 54,
        duration: 1.8,
      });
      setNarrativeCaption(CUTSCENE_CAPTIONS.lobbyBeat1);
    }, [], 0);

    // ۲. نمای دونفره واضح از دختر و دوستش که روبه‌روی هم گرم صحبت هستند
    tl.call(() => {
      setCinematicShot({
        position: [0.15, 1.52, 2.55],
        lookAt: [-1.45, 1.12, 0.85],
        fov: 45,
        duration: 1.9,
      });
      setNarrativeCaption(CUTSCENE_CAPTIONS.lobbyBeat2);
    }, [], beat * 1);

    // ۳. حرکت نرم در فضای باز وسط به سمت پسر — تنها کسی که ساکت نشسته
    tl.call(() => {
      setMaleEmotion('thoughtful');
      setCinematicShot({
        position: [0.15, 1.48, 1.55],
        lookAt: [MALE_SEAT_POS[0], 1.12, MALE_SEAT_POS[2]],
        fov: 44,
        duration: 1.9,
      });
      setNarrativeCaption(CUTSCENE_CAPTIONS.lobbyBeat3);
    }, [], beat * 2);

    // ۴. نگاه زیرچشمی پسر به سمت دختر
    tl.call(() => {
      setMaleGaze('target');
      setMaleEmotion('shy');
      setCinematicShot({
        position: [0.55, 1.4, 0.95],
        lookAt: [MALE_SEAT_POS[0], 1.18, MALE_SEAT_POS[2]],
        fov: 40,
        duration: 1.6,
      });
      setNarrativeCaption(CUTSCENE_CAPTIONS.lobbyBeat4);
    }, [], beat * 3);

    // میانه نما: زاویه باز از کنار پسر به سمت دختر و دوستش در کادر
    tl.call(() => {
      setCinematicShot({
        position: [1.35, 1.68, -1.25],
        lookAt: [-1.35, 1.12, 0.72],
        fov: 47,
        duration: 1.5,
      });
    }, [], beat * 3 + beat * 0.52);

    // ۵. خنده دختر و دوستش
    tl.call(() => {
      setFemaleCinematicPose('laugh');
      setFemaleCinematicEmotion('happy_laugh');
      setCinematicShot({
        position: [-0.15, 1.44, 2.25],
        lookAt: [FEMALE_SEAT_POS[0] + 0.25, 1.15, FEMALE_SEAT_POS[2] + 0.25],
        fov: 43,
        duration: 1.8,
      });
      setNarrativeCaption(CUTSCENE_CAPTIONS.lobbyBeat5);
    }, [], beat * 4);

    // ۶. خم شدن پسر به جلو برای بلند شدن
    tl.call(() => {
      setMalePose('sit_lean_forward');
      setMaleEmotion('nervous');
      setMaleGaze('target');
      setCinematicShot({
        position: [0.48, 1.38, 1.05],
        lookAt: [MALE_SEAT_POS[0], 1.14, MALE_SEAT_POS[2]],
        fov: 40,
        duration: 1.6,
      });
      setNarrativeCaption(CUTSCENE_CAPTIONS.lobbyBeat6);
    }, [], beat * 5);

    // ۷. تردید و تکیه دادن دوباره به صندلی
    tl.call(() => {
      setMalePose('sit');
      setMaleEmotion('shy');
      setMaleGaze('down_shy');
      setCinematicShot({
        position: [0.28, 1.44, 1.32],
        lookAt: [MALE_SEAT_POS[0], 1.15, MALE_SEAT_POS[2]],
        fov: 42,
        duration: 1.6,
      });
      setNarrativeCaption(CUTSCENE_CAPTIONS.lobbyBeat7);
    }, [], beat * 6);

    // بازگشت کنترل به بازیکن با زاویه دید باز در مرکز لابی
    tl.call(() => {
      setNarrativeCaption(CUTSCENE_CAPTIONS.lobbyReadyToLeave);
      resetPlayerTransform([-0.45, 0, -0.35], 0.18, -2.88, 0.28);
      setCinematicShot(null);
      transitionTo('FINAL_DECISION');
      window.setTimeout(() => {
        if (
          useGameStore.getState().stage === 'FINAL_DECISION' &&
          !useGameStore.getState().finalDecision
        ) {
          setNarrativeCaption(null);
        }
      }, CUTSCENE_MIN_DURATION_MS);
    }, [], beat * 7);

    return () => {
      tl.kill();
    };
  }, [stage, setCinematicShot, setNarrativeCaption, transitionTo]);

  // FINAL_DECISION: وقتی دختر می‌خواهد از لابی برود، پسر بلند می‌شود و دیالوگ آغاز می‌شود
  useEffect(() => {
    if (stage !== 'FINAL_DECISION') return;

    if (!finalDecision) {
      setObjectiveHint('حرفت تمام شد. اگر میخواهی بروی، سمت در حرکت کن.');
      setMaleSeated(true);
      setMalePose('sit');
      setMaleEmotion('shy');
      setMaleGaze('target');
      return;
    }

    setObjectiveHint(null);

    if (finalDecision === 'leave_trigger') {
      setLeavingToExitAuto(true);
      setNarrativeCaption(CUTSCENE_CAPTIONS.lobbyLeavingTrigger);
      setCinematicShot({
        position: [0.04, 1.68, 4.55],
        lookAt: [0.06, 1.06, 1.75],
        fov: 48,
        duration: 1.8,
      });

      const tStand = window.setTimeout(() => {
        audioManager.playSfx('chair_move');
        setMaleSeated(false);
        setMalePose('walk');
        setMaleEmotion('nervous');
        maleWalkRef.current = {
          active: true,
          progress: 0,
          from: [MALE_SEAT_POS[0] - 0.25, 0, MALE_SEAT_POS[2] + 0.2],
          to: LEAVE_DIALOGUE_MALE_POS,
        };
      }, 450);

      const tArriveStand = window.setTimeout(() => {
        maleWalkRef.current.active = false;
        setLeavingToExitAuto(false);
        resetPlayerTransform(LEAVE_DIALOGUE_FEMALE_POS, LEAVE_DIALOGUE_FEMALE_ROT, 0, 0.22);
        setMalePos(LEAVE_DIALOGUE_MALE_POS);
        setMaleRot(LEAVE_DIALOGUE_MALE_ROT);
        setMalePose('greet');
        setMaleEmotion('nervous');
        setMaleGaze('target');
      }, Math.min(3600, Math.max(1800, CUTSCENE_MIN_DURATION_MS - 900)));

      // زمان خواندن متن کات‌سین قبل از شروع کارت دیالوگ (۵ ثانیه)
      const tStartDial = window.setTimeout(() => {
        setNarrativeCaption(null);
        setActiveDialogueNode(DIALOGUE_START_NODE);
        transitionTo('DIALOGUE');
      }, CUTSCENE_MIN_DURATION_MS);

      return () => {
        window.clearTimeout(tStand);
        window.clearTimeout(tArriveStand);
        window.clearTimeout(tStartDial);
      };
    }
  }, [
    stage,
    finalDecision,
    setActiveDialogueNode,
    setCinematicShot,
    setNarrativeCaption,
    setObjectiveHint,
    transitionTo,
  ]);

  // قاب‌بندی سینمایی دوربین در طول گفت‌وگو (هر دو شخصیت کاملاً داخل کادر و بالای باکس دیالوگ)
  useEffect(() => {
    if (stage !== 'DIALOGUE' || !activeDialogueNodeId) return;
    const node = DIALOGUE_NODES[activeDialogueNodeId];
    if (!node) return;

    setMaleSeated(false);
    setMalePos(LEAVE_DIALOGUE_MALE_POS);
    setMaleRot(LEAVE_DIALOGUE_MALE_ROT);

    const fx = LEAVE_DIALOGUE_FEMALE_POS[0];
    const fz = LEAVE_DIALOGUE_FEMALE_POS[2];
    const mx = LEAVE_DIALOGUE_MALE_POS[0];
    const mz = LEAVE_DIALOGUE_MALE_POS[2];
    const midX = (fx + mx) * 0.5;
    const midZ = (fz + mz) * 0.5;

    if (node.cameraPreset === 'male_close') {
      setCinematicShot({
        position: [midX - 0.14, 1.48, midZ + 1.55],
        lookAt: [mx - 0.08, 1.24, mz],
        fov: 42,
        duration: 1.1,
      });
    } else if (node.cameraPreset === 'female_close') {
      setCinematicShot({
        position: [midX + 0.14, 1.46, midZ + 1.55],
        lookAt: [fx + 0.08, 1.22, fz],
        fov: 42,
        duration: 1.1,
      });
    } else {
      setCinematicShot({
        position: [midX, 1.52, midZ + 2.15],
        lookAt: [midX, 1.16, midZ],
        fov: 45,
        duration: 1.25,
      });
    }
  }, [stage, activeDialogueNodeId, setCinematicShot]);

  useEffect(() => {
    if (stage !== 'FINAL_ENDING') return;
    const midX = (LEAVE_DIALOGUE_FEMALE_POS[0] + LEAVE_DIALOGUE_MALE_POS[0]) * 0.5;
    const midZ = (LEAVE_DIALOGUE_FEMALE_POS[2] + LEAVE_DIALOGUE_MALE_POS[2]) * 0.5;
    setCinematicShot({
      position: [midX, 1.56, midZ + 2.45],
      lookAt: [midX, 1.18, midZ],
      fov: 46,
      duration: 2.2,
    });
  }, [stage, setCinematicShot]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (stage === 'FINAL_DECISION' && !finalDecision) {
      // وقتی دختر با جوی‌استیک به سمت درِ خروجی لابی می‌رود، خودکار صحنه شروع دیالوگ فعال می‌شود
      if (transientInput.playerPosition.z > 2.85) {
        chooseFinalDecision('leave_trigger');
      }
    }

    if (maleWalkRef.current.active) {
      maleWalkRef.current.progress = Math.min(1, maleWalkRef.current.progress + delta * 0.42);
      const p = maleWalkRef.current.progress;
      const nx = THREE.MathUtils.lerp(maleWalkRef.current.from[0], maleWalkRef.current.to[0], p);
      const nz = THREE.MathUtils.lerp(maleWalkRef.current.from[2], maleWalkRef.current.to[2], p);
      setMalePos([nx, 0, nz]);
      // چرخش خالق در جهت حرکت تا عقب به عقب نرود
      const walkDx = maleWalkRef.current.to[0] - maleWalkRef.current.from[0];
      const walkDz = maleWalkRef.current.to[2] - maleWalkRef.current.from[2];
      setMaleRot(Math.atan2(walkDx, walkDz));
      if (Math.floor(p * 8) !== Math.floor((p - delta * 0.42) * 8)) {
        audioManager.playSfx('footstep');
      }
    }

    if (motesRef.current) {
      motesRef.current.rotation.y = t * 0.05;
      motesRef.current.position.y = Math.sin(t * 0.45) * 0.14;
    }
  });

  // تنها نشانگر تعاملی در لابی: درِ خروجی لابی برای رفتن
  const lobbyTargets = useMemo<InteractionTarget[]>(
    () => [
      {
        id: 'lobby_exit_doors',
        label: 'رفتن سمت در',
        sublabel: 'همان دستگیرهای که زیر نور عصر سرد است',
        position: [0, 0, 4.45],
        radius: 2.05,
        accentColor: '#f5c76e',
        onInteract: () => {
          if (!finalDecision) {
            chooseFinalDecision('leave_trigger');
          }
        },
      },
    ],
    [finalDecision, chooseFinalDecision]
  );

  const obstacles = useMemo<ObstacleCircle[]>(
    () => [
      { x: FEMALE_TABLE_POS[0], z: FEMALE_TABLE_POS[2], radius: 0.72 },
      { x: MALE_SEAT_POS[0], z: MALE_SEAT_POS[2], radius: 0.62 },
      { x: -2.65, z: -2.35, radius: 0.85 },
      { x: 2.68, z: 2.45, radius: 0.85 },
      { x: 2.55, z: -2.65, radius: 0.85 },
      { x: 0, z: -5.9, radius: 1.25 },
    ],
    []
  );

  const motesPositions = useMemo(() => {
    const count = graphicsProfile === 'LOW' ? 20 : 65;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 13;
      arr[i * 3 + 1] = 0.4 + Math.random() * 3.6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return arr;
  }, [graphicsProfile]);

  const currentDialogueNode = activeDialogueNodeId ? DIALOGUE_NODES[activeDialogueNodeId] : null;
  const isMaleSpeaking = stage === 'DIALOGUE' && currentDialogueNode?.speaker === 'male';
  const isFemaleSpeaking = stage === 'DIALOGUE' && currentDialogueNode?.speaker === 'female';

  const activeMaleEmotion: CharacterEmotion =
    stage === 'DIALOGUE' && currentDialogueNode?.maleEmotion
      ? currentDialogueNode.maleEmotion
      : stage === 'FINAL_ENDING'
        ? 'warm_smile'
        : maleEmotion;

  const activeFemaleEmotion: CharacterEmotion =
    stage === 'DIALOGUE' && currentDialogueNode?.femaleEmotion
      ? currentDialogueNode.femaleEmotion
      : stage === 'FINAL_ENDING'
        ? 'warm_smile'
        : stage === 'LOBBY_CINEMATIC'
          ? femaleCinematicEmotion
          : 'neutral';

  const isSeatedInLobbyCinematic = stage === 'LOBBY_CINEMATIC' || stage === 'LOBBY_ENTRY';
  const isDialogueOrEnding = stage === 'DIALOGUE' || stage === 'FINAL_ENDING';

  return (
    <group>
      {/* محدوده‌ی ایمن دوربین کاملاً داخل دیوارهای لابی (x: ±8.2, z: ±7.6) تا هرگز وارد دیوار نشود */}
      <CameraRig
        followDistance={2.85}
        followHeight={1.52}
        indoorClamp={LOBBY_INDOOR_CLAMP}
      />

      <hemisphereLight args={['#fff7e8', '#b89f82', 1.16]} />
      <directionalLight
        position={[-8, 10, 5]}
        intensity={stage === 'FINAL_ENDING' ? 2.25 : 1.95}
        color="#ffd89c"
        castShadow={graphicsProfile !== 'LOW'}
        shadow-mapSize-width={graphicsProfile === 'HIGH' ? 2048 : 1024}
        shadow-mapSize-height={graphicsProfile === 'HIGH' ? 2048 : 1024}
      />
      <pointLight position={[0, 3.8, 0.5]} intensity={0.62} color="#ffe8c2" />

      {/* کفپوش وسیع و گرم لابی (۱۶.۶ در ۱۵.۶ متر) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16.6, 15.6]} />
        <meshStandardMaterial color="#e8dfd2" roughness={0.52} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.008, 0.3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6.4, 9.6]} />
        <meshStandardMaterial color="#d8c8b4" roughness={0.82} />
      </mesh>

      {/* سقف و چراغ‌های آویز */}
      <mesh position={[0, 4.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16.6, 15.6]} />
        <meshStandardMaterial color="#faf5ec" roughness={0.88} />
      </mesh>
      {[-2.8, 0, 2.8].map((px, idx) => (
        <group key={idx} position={[px, 4.1, -0.4]}>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.7, 6]} />
            <meshStandardMaterial color="#5c4b3c" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.2, 14, 12]} />
            <meshStandardMaterial
              color="#fff4d6"
              emissive="#ffcf80"
              emissiveIntensity={0.65}
              roughness={0.25}
            />
          </mesh>
        </group>
      ))}

      {/* دیوار پشتی و بخش پذیرش (در عمق z = -7.6) */}
      <mesh position={[0, 2.4, -7.6]} receiveShadow>
        <boxGeometry args={[16.6, 4.8, 0.24]} />
        <meshStandardMaterial color="#ede3d4" roughness={0.82} />
      </mesh>
      <group position={[0, 0, -6.0]}>
        <mesh position={[0, 2.0, -1.35]}>
          <boxGeometry args={[4.6, 3.2, 0.14]} />
          <meshStandardMaterial color="#9c6f4e" roughness={0.68} />
        </mesh>
        <mesh position={[0, 0.56, 0]} castShadow={graphicsProfile !== 'LOW'} receiveShadow>
          <boxGeometry args={[3.4, 1.12, 0.82]} />
          <meshStandardMaterial color="#f4ece0" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.14, 0.04]}>
          <boxGeometry args={[3.52, 0.07, 0.9]} />
          <meshStandardMaterial color="#8c5e3c" roughness={0.55} />
        </mesh>
      </group>

      {/* درِ خروجی شیشه‌ای لابی رو به آفتاب عصر (در عمق z = +7.6 با فاصله زیاد از دوربین) */}
      <group position={[0, 0, 7.6]}>
        <mesh position={[-4.85, 2.4, 0]}>
          <boxGeometry args={[6.9, 4.8, 0.24]} />
          <meshStandardMaterial color="#e8ded0" roughness={0.8} />
        </mesh>
        <mesh position={[4.85, 2.4, 0]}>
          <boxGeometry args={[6.9, 4.8, 0.24]} />
          <meshStandardMaterial color="#e8ded0" roughness={0.8} />
        </mesh>
        <mesh position={[0, 4.05, 0]}>
          <boxGeometry args={[2.8, 1.5, 0.24]} />
          <meshStandardMaterial color="#e8ded0" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.65, 0.05]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[2.75, 3.3]} />
          <meshBasicMaterial color="#ffefc8" />
        </mesh>
        {[-0.68, 0.68].map((dx, di) => (
          <mesh key={di} position={[dx, 1.65, 0]}>
            <boxGeometry args={[1.3, 3.25, 0.06]} />
            <meshStandardMaterial
              color="#8ab8d4"
              roughness={0.18}
              metalness={0.3}
              transparent
              opacity={0.42}
            />
          </mesh>
        ))}
      </group>

      {/* پنجره‌های بلند دو طرف لابی (x = ±8.2) */}
      {[-8.2, 8.2].map((wx, sideIdx) => (
        <group key={sideIdx} position={[wx, 0, 0]}>
          {[-5.4, -1.8, 1.8, 5.4].map((pz, pi) => (
            <mesh key={pi} position={[0, 2.4, pz]}>
              <boxGeometry args={[0.26, 4.8, 0.46]} />
              <meshStandardMaterial color="#dfd4c3" roughness={0.76} />
            </mesh>
          ))}
          {[-3.6, 0, 3.6].map((gz, gi) => (
            <mesh
              key={gi}
              position={[sideIdx === 0 ? 0.05 : -0.05, 2.4, gz]}
              rotation={[0, sideIdx === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
            >
              <planeGeometry args={[3.1, 4.1]} />
              <meshBasicMaterial color="#fff3dc" transparent opacity={0.42} />
            </mesh>
          ))}
        </group>
      ))}

      {/* گیاهان طبیعی در گوشه‌های لابی (دور از مسیر دید دوربین) */}
      {[
        [-6.9, 0, -6.1],
        [6.9, 0, -6.1],
        [-6.9, 0, 6.1],
        [6.9, 0, 6.1],
      ].map(([px, py, pz], idx) => (
        <group key={idx} position={[px, py, pz]}>
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.28, 0.22, 0.64, 14]} />
            <meshStandardMaterial color="#d4896a" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <sphereGeometry args={[0.52, 12, 10]} />
            <meshStandardMaterial color="#4a8a56" roughness={0.78} />
          </mesh>
          <mesh position={[0.18, 1.32, 0.1]}>
            <sphereGeometry args={[0.36, 10, 8]} />
            <meshStandardMaterial color="#5b9c64" roughness={0.78} />
          </mesh>
        </group>
      ))}

      {/* صندلی دختر و میز وسط */}
      <group
        position={[FEMALE_SEAT_POS[0], 0, FEMALE_SEAT_POS[2]]}
        rotation={[0, FEMALE_SEAT_ROT, 0]}
      >
        <mesh position={[0, 0.34, 0]}>
          <boxGeometry args={[0.68, 0.28, 0.64]} />
          <meshStandardMaterial color="#c97b68" roughness={0.82} />
        </mesh>
        <mesh position={[0, 0.64, -0.24]}>
          <boxGeometry args={[0.68, 0.44, 0.16]} />
          <meshStandardMaterial color="#ba6d5b" roughness={0.82} />
        </mesh>
      </group>
      <group position={FEMALE_TABLE_POS}>
        <mesh position={[0, 0.36, 0]}>
          <cylinderGeometry args={[0.44, 0.44, 0.06, 20]} />
          <meshStandardMaterial color="#b98a60" roughness={0.62} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.08, 0.2, 0.36, 12]} />
          <meshStandardMaterial color="#3c424b" roughness={0.6} />
        </mesh>
        {answers.afternoon === 'cafe' && (
          <mesh position={[0.08, 0.44, 0.08]}>
            <cylinderGeometry args={[0.045, 0.036, 0.09, 10]} />
            <meshStandardMaterial color="#faf6f0" roughness={0.35} />
          </mesh>
        )}
      </group>

      {/* جزئیات کوچک روی میز: دفتر باز، خودکار، لیوان کاغذی */}
      <group position={[-1.46, 0.44, 0.86]}>
        <mesh rotation={[0, 0.24, 0]}>
          <boxGeometry args={[0.34, 0.018, 0.24]} />
          <meshStandardMaterial color="#f7f1e6" roughness={0.85} />
        </mesh>
        <mesh position={[0.1, 0.014, -0.02]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.22, 8]} />
          <meshStandardMaterial color="#3f4a55" roughness={0.5} />
        </mesh>
        <mesh position={[-0.18, 0.05, 0.06]}>
          <cylinderGeometry args={[0.045, 0.036, 0.09, 12]} />
          <meshStandardMaterial color="#efe2cf" roughness={0.55} />
        </mesh>
      </group>

      {/* ساعت روی دیوار پشتی؛ عقربهها حدود ده را نشان میدهند */}
      <group position={[4.9, 2.85, -7.43]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.28, 0.28, 0.05, 24]} />
          <meshStandardMaterial color="#f6efe3" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[0.022, 0.18, 0.012]} />
          <meshStandardMaterial color="#5c4b3c" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.04]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.022, 0.13, 0.012]} />
          <meshStandardMaterial color="#5c4b3c" roughness={0.6} />
        </mesh>
      </group>

      {/* صندلی تکی پسر */}
      <group position={[MALE_SEAT_POS[0], 0, MALE_SEAT_POS[2]]} rotation={[0, MALE_SEAT_ROT, 0]}>
        <mesh position={[0, 0.34, 0]}>
          <boxGeometry args={[0.68, 0.28, 0.64]} />
          <meshStandardMaterial color="#677c73" roughness={0.82} />
        </mesh>
        <mesh position={[0, 0.64, -0.24]}>
          <boxGeometry args={[0.68, 0.44, 0.16]} />
          <meshStandardMaterial color="#586c63" roughness={0.82} />
        </mesh>
      </group>

      {/* تمام دانشجویان نشسته روی صندلی که با کناری‌شان حرف می‌زنند */}
      {SEATED_TALKING_PAIRS.slice(0, graphicsProfile === 'LOW' ? 5 : 7).map((st, idx) => (
        <React.Fragment key={idx}>
          <group position={st.pos} rotation={[0, st.rot, 0]}>
            <mesh position={[0, 0.34, 0]}>
              <boxGeometry args={[0.64, 0.28, 0.6]} />
              <meshStandardMaterial
                color={idx === 0 ? '#c97b68' : '#8d8479'}
                roughness={0.84}
              />
            </mesh>
            <mesh position={[0, 0.62, -0.22]}>
              <boxGeometry args={[0.64, 0.42, 0.15]} />
              <meshStandardMaterial
                color={idx === 0 ? '#ba6d5b' : '#7c746a'}
                roughness={0.84}
              />
            </mesh>
          </group>

          <StylizedCharacter
            kind="student"
            position={st.pos}
            rotationY={st.rot}
            seated={true}
            pose={idx === 0 && !isSeatedInLobbyCinematic ? 'sit' : 'talk'}
            isSpeaking={idx === 0 ? isSeatedInLobbyCinematic : true}
            tintTop={st.tint}
            phaseOffset={st.phase}
          />
        </React.Fragment>
      ))}

      {/* شخصیت پسر (نشسته در سکوت تا لحظه‌ای که دختر می‌خواهد از لابی برود) */}
      <StylizedCharacter
        kind="male"
        position={malePos}
        rotationY={maleRot}
        seated={maleSeated && !isDialogueOrEnding}
        pose={
          stage === 'DIALOGUE'
            ? isMaleSpeaking
              ? 'talk'
              : 'idle'
            : stage === 'FINAL_ENDING'
              ? 'idle'
              : malePose
        }
        emotion={activeMaleEmotion}
        gazeBehavior={stage === 'DIALOGUE' || stage === 'FINAL_ENDING' ? 'target' : maleGaze}
        gazeTarget={isDialogueOrEnding ? femaleDialogHeadWorld : femaleSeatWorld}
        isSpeaking={isMaleSpeaking}
        phaseOffset={0.5}
      />

      {/* نشانگر درِ خروجی لابی */}
      <InteractionSystem
        targets={lobbyTargets}
        enabled={stage === 'FINAL_DECISION' && !finalDecision}
      />

      {/* شخصیت دختر (بازیکن) */}
      <PlayerController
        bounds={{ minX: -6.2, maxX: 6.2, minZ: -4.6, maxZ: 5.8 }}
        obstacles={obstacles}
        controlEnabled={stage === 'FINAL_DECISION' && !finalDecision}
        overrideSeated={isSeatedInLobbyCinematic}
        overridePosition={
          isSeatedInLobbyCinematic
            ? FEMALE_SEAT_POS
            : isDialogueOrEnding
              ? LEAVE_DIALOGUE_FEMALE_POS
              : null
        }
        overrideRotationY={
          isSeatedInLobbyCinematic
            ? FEMALE_SEAT_ROT
            : isDialogueOrEnding
              ? LEAVE_DIALOGUE_FEMALE_ROT
              : null
        }
        overridePose={
          isSeatedInLobbyCinematic
            ? femaleCinematicPose
            : stage === 'DIALOGUE'
              ? isFemaleSpeaking
                ? 'talk'
                : 'idle'
              : stage === 'FINAL_ENDING'
                ? 'idle'
                : undefined
        }
        emotion={activeFemaleEmotion}
        gazeBehavior={isDialogueOrEnding ? 'target' : 'forward'}
        gazeTarget={isDialogueOrEnding ? maleDialogHeadWorld : null}
        isSpeaking={isFemaleSpeaking}
        autoWalkTarget={
          leavingToExitAuto
            ? new THREE.Vector3(LEAVE_DIALOGUE_FEMALE_POS[0], 0, LEAVE_DIALOGUE_FEMALE_POS[2])
            : null
        }
      />

      {/* ذرات طلایی نور عصر در لابی */}
      <points ref={motesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[motesPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#ffe6a8"
          size={0.065}
          transparent
          opacity={stage === 'FINAL_ENDING' ? 0.78 : 0.36}
          depthWrite={false}
        />
      </points>
    </group>
  );
};
