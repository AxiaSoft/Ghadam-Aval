import * as THREE from 'three';
import type { CharacterRigNodes } from '../characters/CharacterBuilder';
import type { CharacterEmotion, CharacterGazeBehavior, CharacterPose } from '../types/game';

export interface ProceduralAnimParams {
  pose: CharacterPose;
  seated?: boolean;
  seatHands?: 'lap' | 'desk';
  emotion?: CharacterEmotion;
  gazeBehavior?: CharacterGazeBehavior;
  gazeTargetWorld?: THREE.Vector3 | null;
  walkSpeed?: number;
  isSpeaking?: boolean;
  isFemale?: boolean;
  phaseOffset?: number;
  baseHipsY?: number;
}

const _localTarget = new THREE.Vector3();
const _invWorldMatrix = new THREE.Matrix4();

function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export class ProceduralAnimator {
  private time = 0;
  private walkCycle = 0;
  private lastFootHalf = 0;

  private nextBlinkIn = 2.4 + Math.random() * 2.5;
  private blinkProgress = -1;

  private saccadeTimer = 1.2;
  private saccadeX = 0;
  private saccadeY = 0;

  private sitBlend = 0;
  private walkBlend = 0;
  private headYaw = 0;
  private headPitch = 0;
  private headRoll = 0;
  private chestTwistY = 0;
  private chestLeanX = 0;
  private eyeYaw = 0;
  private eyePitch = 0;

  // Smoothed Facial Emotion Channels
  private browLift = 0;
  private browTiltL = 0;
  private browTiltR = 0;
  private lowerLidSmile = 0;
  private cheekWarmth = 1;

  public onFootstep?: () => void;

  constructor(phaseOffset = 0) {
    this.time = phaseOffset * 17.3;
    this.nextBlinkIn = 1.5 + Math.random() * 3.0;
  }

  public update(nodes: CharacterRigNodes, dt: number, params: ProceduralAnimParams): void {
    const clampedDt = Math.min(dt, 0.05);
    this.time += clampedDt;
    const t = this.time;

    const isSeated =
      Boolean(params.seated) ||
      params.pose === 'sit' ||
      params.pose === 'sit_attentive' ||
      params.pose === 'sit_nervous' ||
      params.pose === 'sit_lean_forward';

    const targetSit = isSeated ? 1 : 0;
    const targetWalk =
      !isSeated && params.pose === 'walk' ? Math.max(0.2, params.walkSpeed ?? 0.8) : 0;

    this.sitBlend = damp(this.sitBlend, targetSit, 8, clampedDt);
    this.walkBlend = damp(this.walkBlend, targetWalk, 10, clampedDt);

    const baseHipsY = params.baseHipsY ?? (params.isFemale ? 0.9 : 0.96);
    const emotion: CharacterEmotion = params.emotion ?? 'neutral';

    // 1. BREATHING & ORGANIC MULTI-HARMONIC IDLE SWAY
    const breath = Math.sin(t * 1.65) * 0.5 + 0.5;
    const idleSwayZ =
      (Math.sin(t * 0.73) * 0.014 + Math.sin(t * 1.31) * 0.006) * (1 - this.walkBlend * 0.7);
    const idleSwayX =
      (Math.cos(t * 0.59) * 0.011 + Math.sin(t * 1.12) * 0.005) * (1 - this.walkBlend * 0.7);

    // 2. WALK CYCLE & FOOTSTEPS
    if (this.walkBlend > 0.04) {
      const strideFreq = 5.4 + this.walkBlend * 3.2;
      this.walkCycle += clampedDt * strideFreq;
      const halfTurn = Math.floor(this.walkCycle / Math.PI);
      if (halfTurn !== this.lastFootHalf) {
        this.lastFootHalf = halfTurn;
        if (this.walkBlend > 0.25) {
          this.onFootstep?.();
        }
      }
    }

    const wSin = Math.sin(this.walkCycle);
    const wCos = Math.cos(this.walkCycle);
    const wBob = Math.abs(wCos) * 0.032 * this.walkBlend;

    // 3. HIPS & LEGS
    if (nodes.hips) {
      const sitDropY = baseHipsY - 0.37 * (params.isFemale ? 1.0 : 1.06);
      const standY = baseHipsY + wBob;
      nodes.hips.position.y = THREE.MathUtils.lerp(standY, sitDropY, this.sitBlend);
      nodes.hips.position.z = THREE.MathUtils.lerp(0, -0.04, this.sitBlend);
      nodes.hips.rotation.y = wSin * 0.08 * this.walkBlend * (1 - this.sitBlend);
      nodes.hips.rotation.z =
        (wCos * 0.025 * this.walkBlend + idleSwayZ * 0.4) * (1 - this.sitBlend);
    }

    const legSwing = wSin * 0.56 * this.walkBlend;
    const kneeBendL = Math.max(0, -wCos) * 0.68 * this.walkBlend;
    const kneeBendR = Math.max(0, wCos) * 0.68 * this.walkBlend;

    if (nodes.upLegL && nodes.legL) {
      nodes.upLegL.rotation.x = THREE.MathUtils.lerp(-legSwing, -Math.PI * 0.48, this.sitBlend);
      nodes.upLegL.rotation.z = THREE.MathUtils.lerp(0, -0.04, this.sitBlend);
      nodes.legL.rotation.x = THREE.MathUtils.lerp(kneeBendL, Math.PI * 0.48, this.sitBlend);
    }

    if (nodes.upLegR && nodes.legR) {
      nodes.upLegR.rotation.x = THREE.MathUtils.lerp(legSwing, -Math.PI * 0.48, this.sitBlend);
      nodes.upLegR.rotation.z = THREE.MathUtils.lerp(0, 0.04, this.sitBlend);
      nodes.legR.rotation.x = THREE.MathUtils.lerp(kneeBendR, Math.PI * 0.48, this.sitBlend);
    }

    if (nodes.footL) {
      nodes.footL.rotation.x = THREE.MathUtils.lerp(wCos * 0.16 * this.walkBlend, 0, this.sitBlend);
    }
    if (nodes.footR) {
      nodes.footR.rotation.x = THREE.MathUtils.lerp(-wCos * 0.16 * this.walkBlend, 0, this.sitBlend);
    }

    if (nodes.skirt) {
      nodes.skirt.rotation.x = THREE.MathUtils.lerp(
        wSin * 0.04 * this.walkBlend,
        -0.42,
        this.sitBlend
      );
    }

    // 4. SPINE, CHEST & CONVERSATIONAL BODY LANGUAGE
    let desiredChestLeanX = idleSwayX + breath * 0.018;
    let desiredChestTwistY = -wSin * 0.09 * this.walkBlend;

    if (params.pose === 'sit_attentive') {
      desiredChestLeanX += 0.06;
    } else if (params.pose === 'sit_nervous') {
      desiredChestLeanX += 0.08 + Math.sin(t * 0.9) * 0.025;
      desiredChestTwistY += Math.sin(t * 0.55) * 0.04;
    } else if (params.pose === 'sit_lean_forward') {
      desiredChestLeanX += 0.28;
    } else if (params.pose === 'talk') {
      desiredChestLeanX += 0.035 + Math.sin(t * 1.8) * 0.025;
      desiredChestTwistY += Math.sin(t * 1.15) * 0.045;
    } else if (params.pose === 'laugh' || emotion === 'happy_laugh') {
      desiredChestLeanX += -0.02 + Math.sin(t * 7.5) * 0.018;
    } else if (params.pose === 'interact') {
      desiredChestLeanX += 0.16;
    }

    if (params.gazeBehavior === 'look_backward') {
      desiredChestTwistY = 0.38;
    }

    this.chestLeanX = damp(this.chestLeanX, desiredChestLeanX, 6, clampedDt);
    this.chestTwistY = damp(this.chestTwistY, desiredChestTwistY, 5, clampedDt);

    if (nodes.spine) {
      nodes.spine.rotation.x = this.chestLeanX * 0.45;
      nodes.spine.rotation.z = idleSwayZ * 0.6;
      nodes.spine.rotation.y = this.chestTwistY * 0.35;
    }
    if (nodes.chest) {
      nodes.chest.rotation.x = this.chestLeanX * 0.55;
      nodes.chest.rotation.y = this.chestTwistY * 0.65;
      nodes.chest.scale.set(1 + breath * 0.012, 1 + breath * 0.008, 1 + breath * 0.018);
    }

    const shoulderLift =
      breath * 0.018 +
      (params.pose === 'sit_nervous' || emotion === 'nervous'
        ? Math.max(0, Math.sin(t * 1.4)) * 0.028
        : 0);
    if (nodes.shoulderL) nodes.shoulderL.rotation.z = -shoulderLift;
    if (nodes.shoulderR) nodes.shoulderR.rotation.z = shoulderLift;

    // 5. ARMS & EXPRESSIVE CONVERSATIONAL GESTURES (Seated OR Standing!)
    if (nodes.armL && nodes.armR) {
      let armLX = legSwing * 0.65;
      let armLZ = 0.09 + breath * 0.015;
      let foreLX = -0.16 - Math.max(0, legSwing) * 0.25;

      let armRX = -legSwing * 0.65;
      let armRZ = -0.09 - breath * 0.015;
      let foreRX = -0.16 - Math.max(0, -legSwing) * 0.25;

      if (isSeated) {
        armLX = -0.44;
        armLZ = 0.12;
        foreLX = -0.76;

        armRX = -0.46;
        armRZ = -0.12;
        foreRX = -0.8;

        if (params.pose === 'sit_nervous') {
          armRX = -0.54 + Math.sin(t * 3.8) * 0.028;
          foreRX = -0.92 + Math.cos(t * 4.6) * 0.045;
          if (nodes.handR) {
            nodes.handR.rotation.z = Math.sin(t * 5.2) * 0.08;
            nodes.handR.rotation.x = Math.cos(t * 3.9) * 0.06;
          }
        } else if (params.pose === 'sit_lean_forward') {
          armLX = -0.62;
          foreLX = -0.58;
          armRX = -0.62;
          foreRX = -0.58;
        }
      }

      // Away from a desk, keep the forearms lowered towards the thighs.
      // An explicit wait gesture can still temporarily lift a hand.
      const handsOnLap = isSeated && params.seatHands !== 'desk';
      if (handsOnLap) {
        armLX = -0.4;
        armLZ = 0.17;
        foreLX = 0;
        armRX = -0.4;
        armRZ = -0.17;
        foreRX = 0;
      }

      if (params.pose === 'interact') {
        armRX = -0.95;
        armRZ = -0.04;
        foreRX = -0.38;
      } else if (params.pose === 'wait_gesture') {
        // A short raised hand towards the companion, not a spoken line.
        armRX = -1.03;
        armRZ = -0.28;
        foreRX = -1.15;
      } else if (params.pose === 'greet') {
        armRX = -0.74;
        armRZ = -0.22;
        foreRX = -0.95 + Math.sin(t * 4.5) * 0.12;
        if (nodes.handR) {
          nodes.handR.rotation.z = Math.sin(t * 5.4) * 0.16;
        }
      } else if (!handsOnLap && (params.pose === 'talk' || params.isSpeaking)) {
        const g1 = Math.sin(t * 2.5) * 0.5 + 0.5;
        const g2 = Math.cos(t * 1.9);
        armRX += -0.13 * g1;
        foreRX += -0.17 * g1;
        armLX += -0.08 * (1 - g1);
        foreLX += -0.12 * Math.abs(g2);
      } else if (!handsOnLap && (params.pose === 'laugh' || emotion === 'happy_laugh')) {
        armRX = -0.68;
        armRZ = 0.08;
        foreRX = -1.12 + Math.sin(t * 7.2) * 0.07;
      }

      // The simplified student rig has shorter arms and no separate hands.
      // Extend those segments slightly while seated so their ends reach the lap.
      const shortRigScale = handsOnLap && !nodes.handL && !nodes.handR ? 1.2 : 1;
      nodes.armL.scale.y = damp(nodes.armL.scale.y, shortRigScale, 8, clampedDt);
      nodes.armR.scale.y = damp(nodes.armR.scale.y, shortRigScale, 8, clampedDt);
      if (nodes.foreArmL) nodes.foreArmL.scale.y = damp(nodes.foreArmL.scale.y, shortRigScale, 8, clampedDt);
      if (nodes.foreArmR) nodes.foreArmR.scale.y = damp(nodes.foreArmR.scale.y, shortRigScale, 8, clampedDt);

      nodes.armL.rotation.x = damp(nodes.armL.rotation.x, armLX, 8, clampedDt);
      nodes.armL.rotation.z = damp(nodes.armL.rotation.z, armLZ, 8, clampedDt);
      if (nodes.foreArmL) {
        nodes.foreArmL.rotation.x = damp(nodes.foreArmL.rotation.x, foreLX, 8, clampedDt);
      }

      nodes.armR.rotation.x = damp(nodes.armR.rotation.x, armRX, 8, clampedDt);
      nodes.armR.rotation.z = damp(nodes.armR.rotation.z, armRZ, 8, clampedDt);
      if (nodes.foreArmR) {
        nodes.foreArmR.rotation.x = damp(nodes.foreArmR.rotation.x, foreRX, 8, clampedDt);
      }
    }

    if (nodes.handR && params.pose !== 'greet' && params.pose !== 'sit_nervous') {
      nodes.handR.rotation.z = damp(nodes.handR.rotation.z, 0, 7, clampedDt);
      nodes.handR.rotation.x = damp(nodes.handR.rotation.x, 0, 7, clampedDt);
    }

    // ریزحرکت روزمره: خودکار آرام توی دست میچرخد، بدون ژست نمایشی
    if (
      nodes.heldPen &&
      nodes.handR &&
      (emotion === 'thoughtful' || params.pose === 'sit_nervous' || params.pose === 'interact')
    ) {
      nodes.heldPen.rotation.z = Math.sin(t * 1.7) * 0.06;
      nodes.handR.rotation.y = Math.sin(t * 1.1) * 0.04;
    }

    // 6. HEAD TRACKING & GAZE BEHAVIORS
    let targetYaw = Math.sin(t * 0.48) * 0.025;
    let targetPitch = Math.cos(t * 0.62) * 0.018;
    let targetRoll = Math.sin(t * 0.53) * 0.012;

    if (params.gazeBehavior === 'look_backward') {
      targetYaw = 1.12;
      targetPitch = 0.04;
      targetRoll = 0.05;
    } else if (params.gazeBehavior === 'look_away') {
      targetYaw = 0.46;
      targetPitch = 0.18;
      targetRoll = 0.04;
    } else if (params.gazeBehavior === 'down_shy') {
      targetYaw = 0.14;
      targetPitch = 0.24;
      targetRoll = 0.04;
    } else if (params.gazeBehavior === 'wonder_up') {
      targetYaw = Math.sin(t * 0.7) * 0.25;
      targetPitch = -0.32;
      targetRoll = 0.04;
    } else if (params.gazeBehavior === 'target' && params.gazeTargetWorld && nodes.root.parent) {
      nodes.root.updateWorldMatrix(true, false);
      _invWorldMatrix.copy(nodes.root.matrixWorld).invert();
      _localTarget.copy(params.gazeTargetWorld).applyMatrix4(_invWorldMatrix);
      const dx = _localTarget.x;
      const dy = _localTarget.y - 1.48;
      const dz = _localTarget.z;
      const horizDist = Math.max(0.25, Math.hypot(dx, dz));
      const rawYaw = Math.atan2(dx, dz);
      const rawPitch = -Math.atan2(dy, horizDist);

      targetYaw = THREE.MathUtils.clamp(rawYaw, -0.95, 0.95);
      targetPitch = THREE.MathUtils.clamp(rawPitch, -0.45, 0.45);
    }

    if (params.pose === 'talk' || params.isSpeaking) {
      targetPitch += Math.sin(t * 3.8) * 0.022;
      targetYaw += Math.cos(t * 2.1) * 0.024;
      targetRoll += Math.sin(t * 1.7) * 0.018;
    } else if (params.pose === 'laugh' || emotion === 'happy_laugh') {
      targetPitch -= 0.1 + Math.sin(t * 7.8) * 0.045;
      targetRoll += 0.09;
    } else if (emotion === 'curious') {
      targetRoll += 0.075; // Expressive curious head tilt!
    } else if (emotion === 'shy') {
      targetPitch += 0.08;
      targetRoll -= 0.05;
    }

    this.headYaw = damp(this.headYaw, targetYaw, 5.5, clampedDt);
    this.headPitch = damp(this.headPitch, targetPitch, 5.5, clampedDt);
    this.headRoll = damp(this.headRoll, targetRoll, 5.5, clampedDt);

    if (nodes.neck) {
      nodes.neck.rotation.y = this.headYaw * 0.35;
      nodes.neck.rotation.x = this.headPitch * 0.35;
      nodes.neck.rotation.z = this.headRoll * 0.35;
    }
    if (nodes.head) {
      nodes.head.rotation.y = this.headYaw * 0.65;
      nodes.head.rotation.x = this.headPitch * 0.65;
      nodes.head.rotation.z = this.headRoll * 0.65;
    }

    if (nodes.hairDynamic) {
      nodes.hairDynamic.rotation.x =
        0.08 + this.walkBlend * 0.14 + Math.sin(this.walkCycle * 2) * 0.05 * this.walkBlend;
      nodes.hairDynamic.rotation.z = -this.headYaw * 0.15 + idleSwayZ * 1.5;
    }

    // 7. EYE TRACKING & MICRO-SACCADES
    this.saccadeTimer -= clampedDt;
    if (this.saccadeTimer <= 0) {
      this.saccadeTimer = 0.8 + Math.random() * 2.1;
      this.saccadeX = (Math.random() - 0.5) * 0.07;
      this.saccadeY = (Math.random() - 0.5) * 0.045;
    }

    const desiredEyeYaw = THREE.MathUtils.clamp(targetYaw * 0.28 + this.saccadeX, -0.28, 0.28);
    const desiredEyePitch = THREE.MathUtils.clamp(targetPitch * 0.25 + this.saccadeY, -0.2, 0.22);
    this.eyeYaw = damp(this.eyeYaw, desiredEyeYaw, 14, clampedDt);
    this.eyePitch = damp(this.eyePitch, desiredEyePitch, 14, clampedDt);

    if (nodes.eyeL) {
      nodes.eyeL.rotation.y = this.eyeYaw;
      nodes.eyeL.rotation.x = this.eyePitch;
    }
    if (nodes.eyeR) {
      nodes.eyeR.rotation.y = this.eyeYaw;
      nodes.eyeR.rotation.x = this.eyePitch;
    }

    // 8. NATURAL BLINKING + EMOTIONAL EYELID EXPRESSIONS
    if (this.blinkProgress < 0) {
      this.nextBlinkIn -= clampedDt;
      if (this.nextBlinkIn <= 0) {
        this.blinkProgress = 0;
        this.nextBlinkIn = Math.random() < 0.18 ? 0.24 : 2.5 + Math.random() * 3.1;
      }
    } else {
      this.blinkProgress += clampedDt / 0.19;
      if (this.blinkProgress >= 1) {
        this.blinkProgress = -1;
      }
    }

    let lidCloseAmount = 0;
    if (this.blinkProgress >= 0) {
      lidCloseAmount =
        this.blinkProgress < 0.4
          ? this.blinkProgress / 0.4
          : 1 - (this.blinkProgress - 0.4) / 0.6;
    } else if (params.pose === 'laugh' || emotion === 'happy_laugh') {
      lidCloseAmount = 0.58;
    } else if (params.gazeBehavior === 'down_shy' || emotion === 'shy') {
      lidCloseAmount = 0.22;
    } else if (emotion === 'thoughtful') {
      lidCloseAmount = 0.16;
    }

    const lidRotX = THREE.MathUtils.lerp(-1.28, 0.12, lidCloseAmount);
    if (nodes.eyelidMeshL) nodes.eyelidMeshL.rotation.x = lidRotX;
    if (nodes.eyelidMeshR) nodes.eyelidMeshR.rotation.x = lidRotX;

    // 9. FULL 3D FACIAL EMOTION RIG (Eyebrows, Lower Eye-Smile Lids, Cheek Blush, Multi-Shape Mouth)
    let targetBrowLift = 0;
    let targetBrowTiltL = 0;
    let targetBrowTiltR = 0;
    let targetLowerSmile = 0;
    let targetCheek = 1.0;

    switch (emotion) {
      case 'warm_smile':
        targetBrowLift = 0.005;
        targetBrowTiltL = -0.05;
        targetBrowTiltR = 0.05;
        targetLowerSmile = 0.0055;
        targetCheek = 1.08;
        break;
      case 'hopeful':
        targetBrowLift = 0.0065;
        targetBrowTiltL = -0.12;
        targetBrowTiltR = 0.12;
        targetLowerSmile = 0.0045;
        targetCheek = 1.06;
        break;
      case 'shy':
        targetBrowLift = 0.003;
        targetBrowTiltL = -0.22; // Sympathetic raised inner brows!
        targetBrowTiltR = 0.22;
        targetLowerSmile = 0.0035;
        targetCheek = 1.12;
        break;
      case 'nervous':
        targetBrowLift = 0.002;
        targetBrowTiltL = -0.26;
        targetBrowTiltR = 0.26;
        targetLowerSmile = 0.001;
        targetCheek = 1.10;
        break;
      case 'curious':
        targetBrowLift = 0.008;
        targetBrowTiltL = -0.04;
        targetBrowTiltR = 0.18; // Expressive asymmetric inquisitive brow!
        targetLowerSmile = 0.001;
        targetCheek = 1.08;
        break;
      case 'happy_laugh':
        targetBrowLift = 0.009;
        targetBrowTiltL = -0.08;
        targetBrowTiltR = 0.08;
        targetLowerSmile = 0.0085;
        targetCheek = 1.12;
        break;
      case 'thoughtful':
        targetBrowLift = -0.002;
        targetBrowTiltL = 0.06;
        targetBrowTiltR = -0.06;
        targetLowerSmile = 0;
        targetCheek = 1.0;
        break;
      default:
        if (params.gazeBehavior === 'wonder_up') {
          targetBrowLift = 0.008;
          targetLowerSmile = 0.004;
        }
        break;
    }

    this.browLift = damp(this.browLift, targetBrowLift, 8, clampedDt);
    this.browTiltL = damp(this.browTiltL, targetBrowTiltL, 8, clampedDt);
    this.browTiltR = damp(this.browTiltR, targetBrowTiltR, 8, clampedDt);
    this.lowerLidSmile = damp(this.lowerLidSmile, targetLowerSmile, 8, clampedDt);
    this.cheekWarmth = damp(this.cheekWarmth, targetCheek, 6, clampedDt);

    if (nodes.browL) {
      nodes.browL.position.y = 0.158 + this.browLift;
      nodes.browL.rotation.z = this.browTiltL;
    }
    if (nodes.browR) {
      nodes.browR.position.y = 0.158 + this.browLift;
      nodes.browR.rotation.z = this.browTiltR;
    }

    if (nodes.lowerLidL) {
      nodes.lowerLidL.position.y = 0.101 + this.lowerLidSmile;
    }
    if (nodes.lowerLidR) {
      nodes.lowerLidR.position.y = 0.101 + this.lowerLidSmile;
    }

    if (nodes.cheekL) nodes.cheekL.scale.setScalar(this.cheekWarmth);
    if (nodes.cheekR) nodes.cheekR.scale.setScalar(this.cheekWarmth);

    // Multi-shape Mouth Expression & Speaking Syllable Animation
    if (nodes.mouthNeutral && nodes.mouthSmile && nodes.mouthShy && nodes.mouthOpen) {
      const speaking = Boolean(params.isSpeaking || params.pose === 'talk');
      const laughing = params.pose === 'laugh' || emotion === 'happy_laugh';
      const smiling =
        emotion === 'warm_smile' || emotion === 'hopeful' || params.pose === 'greet';
      const shyOrNervous = emotion === 'shy' || emotion === 'nervous';

      if (laughing) {
        nodes.mouthNeutral.visible = false;
        nodes.mouthShy.visible = false;
        nodes.mouthSmile.visible = true;
        nodes.mouthOpen.visible = true;
        const pulse = 0.85 + Math.abs(Math.sin(t * 8.5)) * 0.45;
        nodes.mouthOpen.scale.set(1.1, pulse, 1.0);
      } else if (speaking) {
        const syllable = Math.abs(Math.sin(t * 10.2)) * (0.45 + 0.55 * Math.abs(Math.cos(t * 3.9)));
        nodes.mouthNeutral.visible = !smiling && syllable < 0.22;
        nodes.mouthSmile.visible = smiling;
        nodes.mouthShy.visible = false;
        nodes.mouthOpen.visible = syllable >= 0.15;
        nodes.mouthOpen.scale.set(0.85 + syllable * 0.3, 0.35 + syllable * 0.95, 1.0);
      } else if (smiling) {
        nodes.mouthNeutral.visible = false;
        nodes.mouthShy.visible = false;
        nodes.mouthOpen.visible = false;
        nodes.mouthSmile.visible = true;
      } else if (shyOrNervous) {
        nodes.mouthNeutral.visible = false;
        nodes.mouthSmile.visible = false;
        nodes.mouthOpen.visible = false;
        nodes.mouthShy.visible = true;
      } else if (emotion === 'curious') {
        nodes.mouthNeutral.visible = true;
        nodes.mouthSmile.visible = false;
        nodes.mouthShy.visible = false;
        nodes.mouthOpen.visible = true;
        nodes.mouthOpen.scale.set(0.55, 0.42, 1.0);
      } else {
        nodes.mouthNeutral.visible = true;
        nodes.mouthSmile.visible = false;
        nodes.mouthShy.visible = false;
        nodes.mouthOpen.visible = false;
      }
    } else if (nodes.mouth) {
      // Background Student NPC simple mouth animation when talking with neighbor
      if (params.isSpeaking || params.pose === 'talk') {
        const syl = Math.abs(Math.sin(t * 9.2));
        nodes.mouth.scale.set(1 + syl * 0.25, 1 + syl * 2.2, 1);
      } else {
        nodes.mouth.scale.set(1, 1, 1);
      }
    }
  }
}
